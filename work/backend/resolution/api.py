"""Authenticated evidence-resolution APIs, additive to the existing parcel routes."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from .. import auth, store as db, models
from .engine import run
from .mock_sources import SCENARIOS
from .planner import SUPPORTED_FACTS

router = APIRouter(prefix='/api/v1/validation', tags=['Evidence resolution'])
User = Depends(auth.current_user)


class RunRequest(BaseModel):
    parcelId: str
    sourceMode: str | None = None
    scenario: str | None = None
    requiredFacts: list[str] = Field(default_factory=list, max_length=30)


def latest(con, parcel_id, user):
    from ..main import parcel_for
    parcel_for(con, parcel_id, user)
    return db.get(con, 'validation', parcel_id) or {}


@router.get('/scenarios')
def scenarios(user=User):
    return dict(scenarios=[dict(id=key, label=value) for key,value in SCENARIOS.items()],
                supportedFacts=sorted(SUPPORTED_FACTS), simulated=True)


@router.post('/run')
def execute(body: RunRequest, user=User):
    auth.require_role(user, auth.OFFICERS | {'system_admin'})
    with db.transaction() as con:
        latest(con, body.parcelId, user)
        if body.sourceMode not in {None, 'mock', 'live', 'disabled'}:
            raise HTTPException(422, 'Unknown source mode.')
        if body.scenario is not None and body.scenario not in SCENARIOS:
            raise HTTPException(422, 'Unknown synthetic scenario.')
        if set(body.requiredFacts) - SUPPORTED_FACTS:
            raise HTTPException(422, 'Unknown required evidence category.')
        return run(con, body.parcelId, actor=user['id'], mode=body.sourceMode,
                   scenario=body.scenario, requested=body.requiredFacts)


@router.get('/{parcel_id}')
def result(parcel_id: str, user=User):
    with db.transaction() as con: return latest(con, parcel_id, user)


@router.get('/{parcel_id}/history')
def history(parcel_id: str, user=User):
    with db.transaction() as con:
        latest(con, parcel_id, user)
        rows = con.execute(select(models.validation_runs).where(models.validation_runs.c.parcel_id == parcel_id)
                           .order_by(models.validation_runs.c.created_at.desc()).limit(25))
        return [dict(id=r['id'], createdAt=r['created_at'], actor=r['actor'], engineVersion=r['engine_version'],
                     externalResolution=r['snapshot']['externalResolution']) for r in rows]


@router.get('/{parcel_id}/runs/{run_id}')
def historical_result(parcel_id: str, run_id: str, user=User):
    with db.transaction() as con:
        latest(con, parcel_id, user)
        row = con.execute(select(models.validation_runs).where(models.validation_runs.c.id == run_id,
                          models.validation_runs.c.parcel_id == parcel_id)).first()
        if not row: raise HTTPException(404, 'Validation run not found.')
        return row['snapshot']


@router.get('/{parcel_id}/{section}')
def detail(parcel_id: str, section: str, user=User):
    with db.transaction() as con:
        validation = latest(con, parcel_id, user)
        if section == 'resolution': return validation.get('externalResolution', {})
        if section in {'checks','sources','conflicts'}: return validation.get(section, [])
        if section == 'evidence':
            run_id = validation.get('runId')
            records = con.execute(select(models.source_records).where(models.source_records.c.run_id == run_id))
            claims = con.execute(select(models.canonical_claims).where(models.canonical_claims.c.run_id == run_id))
            return dict(runId=run_id, records=[dict(r['metadata'], rawData=r['raw_data']) for r in records],
                        claims=[dict(c['provenance'], evidenceId=c['id']) for c in claims])
        if section == 'queries':
            rows = con.execute(select(models.source_queries).where(models.source_queries.c.run_id == validation.get('runId')))
            return [dict(r) for r in rows]
        raise HTTPException(404, 'Unknown validation section.')


class ConflictDecision(BaseModel):
    runId: str
    selectedEvidenceId: str
    notes: str = Field(min_length=5, max_length=4000)


@router.post('/{parcel_id}/conflicts/{conflict_id}/resolve')
def resolve_conflict(parcel_id: str, conflict_id: str, body: ConflictDecision, user=User):
    auth.require_role(user, auth.OFFICERS)
    with db.transaction() as con:
        validation = latest(con, parcel_id, user)
        case = db.get(con, 'case', f'CASE-{parcel_id}')
        if not case or case['assignedTo'] != user['id']:
            raise HTTPException(403, 'Only the assigned officer can resolve this case.')
        if body.runId != validation.get('runId'):
            raise HTTPException(409, 'Evidence changed. Reload the latest validation run.')
        item = next((c for c in validation.get('conflicts',[]) if c['id'] == conflict_id), None)
        if not item: raise HTTPException(404, 'Conflict not found.')
        if item['status'] != 'OPEN': raise HTTPException(409, 'Conflict already has a recorded resolution.')
        selected = next((s for s in item['sources'] if s.get('id') == body.selectedEvidenceId), None)
        if not selected or selected.get('normalizedValue') is None or len(body.notes.strip()) < 5:
            raise HTTPException(422, 'Select valid source evidence and explain the decision.')
        decision = dict(selectedEvidenceId=body.selectedEvidenceId, acceptedValue=selected['value'],
                        normalizedValue=selected['normalizedValue'], notes=body.notes.strip(),
                        originalValues=item['sources'], field=item['field'], simulated=selected.get('simulated',False),
                        basis='OFFICER_JUDGMENT', externalVerificationUnchanged=True)
        con.execute(models.review_resolutions.insert().values(id=db.uid('RES'), parcel_id=parcel_id, run_id=body.runId,
            conflict_fingerprint=item['fingerprint'], reviewer=user['id'], created_at=db.now(), decision=decision))
        item.update(status='RESOLVED_BY_OFFICER', resolution=dict(decision, reviewer=user['id'], reviewedAt=db.now()))
        db.put(con, 'validation', validation)
        db.put(con, 'conflicts', dict(id=parcel_id, items=validation['conflicts']))
        db.audit(con, user['id'], 'CONFLICT_RESOLVED_BY_OFFICER', parcel_id,
                 'Original evidence retained; officer judgment recorded separately.', dict(runId=body.runId, conflictId=conflict_id, decision=decision))
        return item
