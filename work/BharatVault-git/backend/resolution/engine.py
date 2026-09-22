"""Evidence resolution v2: no majority-wins rule and no implicit document verification."""
import asyncio
import hashlib
import logging
import os
from sqlalchemy import select
from .. import store as db
from .. import models
from .acquisition import acquire
from .contracts import SourceResponse, SourceState
from .mock_sources import mock_adapters
from .normalization import canonical, document_claims
from .planner import requirements, query_variants, plan
from .registry import configured

VERSION = 'evidence-resolution-v2'
log = logging.getLogger('bharat.evidence')
CONFLICT_TYPES = {'current_holder': 'OWNER_MISMATCH', 'registered_buyer': 'OWNER_MISMATCH',
    'area': 'AREA_MISMATCH', 'parcel_identity': 'KHASRA_MISMATCH', 'mapped_area': 'GIS_TEXT_MISMATCH',
    'mutation_number': 'MUTATION_MISMATCH', 'mutation_status': 'MUTATION_MISMATCH',
    'registration_number': 'REGISTRATION_MISMATCH', 'village': 'LOCATION_MISMATCH',
    'district': 'LOCATION_MISMATCH', 'tehsil': 'LOCATION_MISMATCH'}


class Unconfigured:
    """Declared source coverage with an explicit unconfigured gate, not a fake connection."""
    simulated = False
    def __init__(self, template):
        self.template = template
        self.source_type = template.source_type
        self.source_system = 'unconfigured-' + template.source_type.lower()
    def get_capabilities(self): return self.template.get_capabilities()
    def get_provenance(self): return dict(sourceType=self.source_type, sourceSystem=self.source_system, simulated=False)
    async def search_record(self, query):
        return SourceResponse(SourceState.PERMANENTLY_UNAVAILABLE, message='No real provider configured for this source.')


def providers(mode, scenario):
    if mode == 'mock': return mock_adapters(scenario)
    if mode == 'live':
        return configured() or [Unconfigured(adapter) for adapter in mock_adapters('consistent')]
    return [Unconfigured(adapter) for adapter in mock_adapters('consistent')]


def equivalent(fact, a, b):
    if fact in {'area', 'mapped_area'}:
        return abs(float(a) - float(b)) <= float(os.getenv('AREA_TOLERANCE_HA', '.02'))
    return a == b


def conflicts_within(fact, values):
    usable = [v for v in values if v.get('normalizedValue') is not None]
    return any(not equivalent(fact, a['normalizedValue'], b['normalizedValue'])
               for i, a in enumerate(usable) for b in usable[i + 1:])


def conflict(fact, values, kind=None, severity=None):
    # Fingerprints describe the evidence, so a later changed value reopens review.
    signature = sorted([dict(source=v.get('source'), document=v.get('documentId'),
        value=v.get('normalizedValue'), hash=v.get('dataHash'), version=v.get('version')) for v in values], key=db.encode)
    fingerprint = hashlib.sha256(db.encode([kind or CONFLICT_TYPES.get(fact, 'FIELD_MISMATCH'), fact, signature]).encode()).hexdigest()
    first = values[0]
    last = next((v for v in values[1:] if v.get('normalizedValue') != first.get('normalizedValue')), values[-1])
    description = '; '.join(f"{v.get('source')}: {v['value']}" for v in values)
    return dict(id=db.uid('CON'), fingerprint=fingerprint, type=kind or CONFLICT_TYPES.get(fact, 'FIELD_MISMATCH'),
        field=fact, affectedField=fact, severity=severity or ('HIGH' if fact in {'current_holder','parcel_identity','mapped_area'} else 'MEDIUM'),
        status='OPEN', sources=values, sourceA=first.get('source'), sourceB=last.get('source'),
        sourceAValue=first['value'], sourceBValue=last['value'], description=description)


def evaluate(parcel, doc_claims, external, required, summaries, records):
    checks, conflicts, issues = [], [], []
    resolved = 0
    exhausted = all(s['pathsExhausted'] for s in summaries)
    for requirement in required:
        fact = requirement.fact
        values = [c for c in external if c['fact'] == fact]
        documents = [c for c in doc_claims if c['fact'] == fact]
        usable = [c for c in values if c['usable']]
        independent = {c['independenceGroup'] for c in usable}
        all_values = values + documents
        if fact == 'parcel_identity' and parcel.get('surveyNumber'):
            all_values.append(dict(source='Selected parcel identifier', value=parcel['surveyNumber'],
                normalizedValue=canonical(fact, parcel['surveyNumber']), sourceType='PARCEL_CONTEXT'))
        disagreement = conflicts_within(fact, all_values)
        if disagreement:
            conflicts.append(conflict(fact, all_values))
        sufficient = len(independent) >= requirement.min_sources and not conflicts_within(fact, values)
        resolved += int(sufficient)
        doc_uncertain = any((c.get('lowConfidence') and not c.get('reviewed')) or c.get('flagged') or
                            c.get('normalizedValue') is None for c in documents)
        candidates = [s for s in summaries if fact in s['requiredFacts'] and s['status'] != 'NOT_APPLICABLE']
        if disagreement: state = 'CONFLICT'
        elif sufficient and not doc_uncertain: state = 'MATCH'
        elif doc_uncertain: state = 'HUMAN_REVIEW_REQUIRED'
        elif values and not usable: state = 'UNVERIFIED'
        elif candidates and all(s['status'] == 'RECORD_NOT_FOUND' for s in candidates): state = 'NOT_FOUND'
        elif not usable and not documents: state = 'NOT_AVAILABLE'
        else: state = 'INSUFFICIENT_EVIDENCE'
        external_agree = bool(usable) and not conflicts_within(fact, values)
        confidence = round(min(.95, sum(c['reliability'] for c in usable) / max(1, len(usable))) *
                           (1 if sufficient else .5) * (.4 if disagreement else 1), 3)
        if not usable:
            confidence = .45 if len({c['documentId'] for c in documents}) > 1 and not disagreement and not doc_uncertain else .15 if documents else 0
        explanation = (f"{fact.replace('_', ' ')}: {len(independent)}/{requirement.min_sources} independent usable source groups. " +
            ('Conflicting values are retained for officer review. ' if disagreement else '') +
            ('Required external evidence is sufficient. ' if sufficient else 'Required external evidence remains unresolved. ') +
            ('Document evidence is available after all planned source paths were exhausted. ' if not sufficient and exhausted and documents else '') +
            ('Source evidence is simulated. ' if any(v.get('simulated') for v in values) else '') +
            '; '.join(f"{s['sourceSystem']}: {s['status']}" for s in candidates))
        checks.append(dict(id=db.uid('CHK'), check=fact.upper(), name=fact.replace('_',' ').title(), field=fact,
            status=state, message=explanation, explanation=explanation, documentValue=[c['value'] for c in documents],
            externalValues=[dict(source=c['source'], value=c['value'], sourceRecordId=c['sourceRecordId'],
                                 usable=c['usable'], reliability=c['reliability']) for c in values],
            sources=all_values, sourceReferences=[c['sourceRecordId'] for c in values], confidence=confidence,
            externalSufficient=sufficient, corroborated=external_agree and len(independent) >= 2,
            documentFallback=bool(not sufficient and exhausted), requiredSourceGroups=requirement.min_sources))
    # Compare mapped and textual areas as different source concepts, retaining both.
    area_values = [c for c in external + doc_claims if c['fact'] in {'area', 'mapped_area'} and c.get('normalizedValue') is not None]
    if any(c['fact'] == 'area' for c in area_values) and any(c['fact'] == 'mapped_area' for c in area_values) and conflicts_within('area', area_values):
        conflicts.append(conflict('mapped_area', area_values, 'GIS_TEXT_MISMATCH', 'HIGH'))
        checks.append(dict(check='GIS_TEXT_CONSISTENCY', name='GIS / textual area', field='mapped_area', status='CONFLICT',
            message='Mapped and textual areas differ beyond the configured tolerance.', sources=area_values, confidence=.2))
    dates = {fact: [c for c in external + doc_claims if c['fact'] == fact and c.get('normalizedValue')]
             for fact in ('registration_date', 'mutation_date')}
    # Only compare events tied to the same registration/mutation reference. Do not
    # construct an ownership history from unrelated historical dates.
    for mutation in dates['mutation_date']:
        peers = [c for c in external + doc_claims if (c.get('sourceRecordId') and c.get('sourceRecordId') == mutation.get('sourceRecordId')) or
                 (c.get('documentId') and c.get('documentId') == mutation.get('documentId'))]
        for registration in dates['registration_date']:
            same_document = mutation.get('documentId') and mutation.get('documentId') == registration.get('documentId')
            reg_peers = [c for c in external if c.get('sourceRecordId') == registration.get('sourceRecordId')]
            linked = {c['normalizedValue'] for c in peers if c['fact'] == 'mutation_number'} & {c['normalizedValue'] for c in reg_peers if c['fact'] == 'mutation_number'}
            if (same_document or linked) and mutation['normalizedValue'] < registration['normalizedValue']:
                conflicts.append(conflict('mutation_date', [mutation, registration], 'OWNERSHIP_TIMELINE_CONFLICT'))
    for record in records:
        if record['status'] in {'STALE','UNVERIFIED','INVALID_RESPONSE'}:
            issues.append(dict(type='SOURCE_' + record['status'], sourceRecordId=record['id'], source=record['sourceSystem'],
                               description=f"{record['sourceSystem']}: {record['status']}; retained but not sufficient for verification."))
    for c in external + doc_claims:
        if c['fact'] == 'case_status' and c.get('normalizedValue') in {'pending', 'open', 'active', 'stayed'}:
            conflicts.append(conflict('case_status', [c], 'COURT_DISPUTE', 'HIGH'))
    for c in doc_claims:
        if c.get('normalizedValue') is None:
            issues.append(dict(type='INVALID_DOCUMENT_VALUE', fieldId=c.get('fieldId'), description='A source value could not be normalized.'))
    missing = len(required) - resolved
    # Coverage and acquisition termination are separate: partial external results
    # remain visible even after the remaining paths are exhausted.
    status = 'RESOLVED' if not missing else 'PARTIALLY_RESOLVED' if resolved else 'EXHAUSTED' if exhausted else 'IN_PROGRESS'
    return checks, conflicts, issues, dict(status=status, acquisitionStatus='EXHAUSTED' if exhausted else 'INCOMPLETE',
        requiredEvidenceCount=len(required), resolvedEvidenceCount=resolved, unresolvedEvidenceCount=missing,
        sourcesAttempted=sum(s['attempted'] for s in summaries), sourcesSuccessful=sum(s['usableRecords'] > 0 for s in summaries),
        documentModeActivated=bool(exhausted and missing), documentEvidenceMode='ACTIVE' if exhausted and missing else 'INACTIVE',
        unresolvedFacts=[c['field'] for c in checks if c.get('externalSufficient') is False],
        simulated=any(s['simulated'] and s['attempted'] for s in summaries),
        externalVerification='SIMULATED' if any(s['simulated'] and s['recordsFound'] for s in summaries) else
            'CORROBORATED' if not missing else 'NOT_VERIFIED')


def run(con, parcel_id, actor='evidence-engine', mode=None, scenario=None, requested=None, adapters=None, timeout=None):
    parcel = db.get(con, 'parcel', parcel_id)
    if not parcel: raise ValueError('Parcel not found')
    previous = db.get(con, 'validation', parcel_id) or {}
    mode = mode or previous.get('mode') or os.getenv('BHARAT_SOURCE_MODE', 'disabled')
    scenario = scenario or previous.get('scenario') or os.getenv('BHARAT_MOCK_SCENARIO', 'consistent')
    requested = requested if requested is not None else previous.get('requestedFacts', [])
    if mode not in {'mock', 'live', 'disabled'}: raise ValueError('Invalid source mode')
    extracted = db.fields(con, parcel_id)
    docs = document_claims(extracted)
    gis = parcel.get('gis')
    if gis and gis.get('area') is not None:
        docs.append(dict(id=gis['id'], fact='mapped_area', value=f"{gis['area']} ha", normalizedValue=canonical('mapped_area', f"{gis['area']} ha"),
            source=gis.get('source', 'Local GIS'), sourceType='LOCAL_GIS', documentId=gis['id'], page=None,
            extractionConfidence=None, reviewed=False, lowConfidence=False, simulated=gis.get('sample', False), role='mapped_area'))
    required = requirements(parcel, extracted, requested)
    source_plan = plan(adapters if adapters is not None else providers(mode, scenario), required, query_variants(parcel, extracted))
    summaries, queries, records, external = asyncio.run(acquire(source_plan,
        timeout=timeout if timeout is not None else float(os.getenv('BHARAT_SOURCE_TIMEOUT_SECONDS', '2'))))
    # A response for a different parcel is evidence of a mismatch, never supporting
    # evidence for another field of the selected parcel.
    expected = canonical('parcel_identity', parcel.get('surveyNumber', ''))
    for record in records:
        identities = [c for c in external if c['sourceRecordId'] == record['id'] and c['fact'] == 'parcel_identity']
        if any(c['normalizedValue'] != expected for c in identities):
            record['usable'] = False
            record['correlationStatus'] = 'PARCEL_IDENTITY_MISMATCH'
            for c in external:
                if c['sourceRecordId'] == record['id']: c['usable'] = False
    for summary in summaries:
        summary['usableRecords'] = sum(r['usable'] for r in records if r['sourceSystem'] == summary['sourceSystem'])
    checks, conflicts, issues, resolution = evaluate(parcel, docs, external, required, summaries, records)
    prior = con.execute(select(models.review_resolutions).where(models.review_resolutions.c.parcel_id == parcel_id)).all()
    by_fingerprint = {r['conflict_fingerprint']: dict(r['decision'], reviewer=r['reviewer'], reviewedAt=r['created_at']) for r in sorted(prior, key=lambda r:r['created_at'])}
    for c in conflicts:
        c['parcelId'] = parcel_id
        if c['fingerprint'] in by_fingerprint:
            c.update(status='RESOLVED_BY_OFFICER', resolution=by_fingerprint[c['fingerprint']])
    factors = []
    for c in conflicts:
        if c['status'] == 'OPEN':
            factors.append(dict(factor=c['type'], impact=25 if c['severity'] == 'HIGH' else 15,
                                description=c['description'], conflictId=c['id']))
    unresolved = resolution['unresolvedEvidenceCount']
    if unresolved: factors.append(dict(factor='Unresolved required evidence', impact=min(15, unresolved * 3), description=', '.join(resolution['unresolvedFacts'])))
    low = [c for c in docs if (c.get('lowConfidence') and not c.get('reviewed')) or c.get('flagged') or c.get('normalizedValue') is None]
    if low: factors.append(dict(factor='Document fields need review', impact=5, description=f'{len(low)} uncertain fields.'))
    score = min(100, sum(f['impact'] for f in factors))
    level = 'LOW' if score <= 20 else 'MEDIUM' if score <= 50 else 'HIGH' if score <= 80 else 'CRITICAL'
    risk = dict(id=parcel_id, parcelId=parcel_id, riskScore=score, score=score, riskLevel=level, level=level, factors=factors,
                methodology='Conflicts drive risk; missing evidence contributes at most 15 points. Source availability alone adds no risk.')
    run_id = db.uid('RUN')
    case_id = f'CASE-{parcel_id}'
    confidence = sum(c.get('confidence',0) for c in checks) / max(1,len(checks))
    consistency = 'CONFLICT' if any(conflicts_within(fact, [c for c in docs if c['fact']==fact]) for fact in {c['fact'] for c in docs}) else (
        'CONSISTENT' if len({c['documentId'] for c in docs if c['sourceType']=='DOCUMENT'}) > 1 else 'INSUFFICIENT_DOCUMENTS')
    validation = dict(id=parcel_id, parcelId=parcel_id, runId=run_id, engineVersion=VERSION, mode=mode,
        scenario=scenario if mode=='mock' else None, updatedAt=db.now(), checks=checks,
        requestedFacts=requested,
        overallConfidence=confidence, validationConfidence=confidence,
        extractionConfidence=sum(f['confidence'] for f in extracted)/max(1,len(extracted))/100,
        externalResolution=resolution, sources=summaries, sourceIssues=issues, documentConsistency=consistency,
        requiredEvidence=[dict(fact=r.fact, reason=r.reason, minSources=r.min_sources) for r in required],
        sourceCompleteness={s['sourceType']: bool(s['usableRecords']) for s in summaries},
        risk=risk, conflicts=conflicts, verification=dict(required=True, caseId=case_id, status='HUMAN_REVIEW_REQUIRED'),
        decisionBasis='Simulated source evidence' if resolution['simulated'] else 'External and documentary evidence')
    input_snapshot = dict(fields=extracted, gis=gis, survey=parcel.get('surveyNumber'), jurisdiction=parcel.get('village'),
                          requirements=validation['requiredEvidence'], mode=mode, scenario=scenario)
    con.execute(models.validation_runs.insert().values(id=run_id, parcel_id=parcel_id, actor=actor,
        created_at=validation['updatedAt'], engine_version=VERSION,
        input_hash=hashlib.sha256(db.encode(input_snapshot).encode()).hexdigest(), snapshot=validation))
    for q in queries:
        con.execute(models.source_queries.insert().values(id=q['id'], run_id=run_id, source_system=q['sourceSystem'],
            source_type=q['sourceType'], attempt=q['attempt'], status=q['status'], queried_at=q['queriedAt'],
            duration_ms=q['durationMs'], query=q['query'], details={'message':q['message']}))
    for r in records:
        con.execute(models.source_records.insert().values(id=r['id'], run_id=run_id, query_id=r['queryId'],
            parcel_identifier=parcel_id, source_type=r['sourceType'], source_system=r['sourceSystem'],
            external_record_id=r['externalRecordId'], availability_status=r['availabilityStatus'],
            verification_status=r['verificationStatus'], freshness_status=r['freshnessStatus'], retrieved_at=r['retrievedAt'],
            data_hash=r['dataHash'], source_version=r['sourceVersion'], simulated=r['simulated'], raw_data=r['rawData'],
            metadata={k:v for k,v in r.items() if k!='rawData'}))
    for c in external + docs:
        numeric = c.get('normalizedValue') if isinstance(c.get('normalizedValue'), (float,int)) else None
        con.execute(models.canonical_claims.insert().values(id=db.uid('EVD'), run_id=run_id, parcel_id=parcel_id,
            fact=c['fact'], source_record_id=c.get('sourceRecordId'), document_id=c.get('documentId'),
            extraction_id=c.get('extractionId'), page_number=c.get('page'), numeric_value=numeric,
            text_value=c.get('normalizedValue') if isinstance(c.get('normalizedValue'),str) else None,
            original_value=c['value'], provenance=c))
    db.put(con, 'validation', validation)
    db.put(con, 'risk', risk)
    db.put(con, 'conflicts', {'id':parcel_id, 'items':conflicts})
    health = round(100 * resolution['resolvedEvidenceCount'] / max(1,resolution['requiredEvidenceCount']))
    parcel.update(risk=risk, riskScore=score, riskLevel=level, recordHealth=health, healthScore=health,
                  recordStatus='REVIEW_REQUIRED', status='REVIEW_REQUIRED', externalVerification=resolution['externalVerification'],
                  evidenceRunId=run_id, updatedAt=db.now())
    db.put(con, 'parcel', parcel)
    case = db.get(con, 'case', case_id) or dict(id=case_id, parcelId=parcel_id, assignedTo='USR-001', createdAt=db.now())
    case.update(priority=level, riskScore=score, status='PENDING_REVIEW', runId=run_id,
                reason=[f['factor'] for f in factors] or ['Evidence awaits officer decision.'], externalResolution=resolution)
    db.put(con, 'case', case)
    db.audit(con, actor, 'EVIDENCE_RESOLUTION_COMPLETED', parcel_id,
             f"{resolution['resolvedEvidenceCount']}/{len(required)} evidence categories resolved; {len(conflicts)} conflicts retained.",
             dict(runId=run_id, queries=[q['id'] for q in queries], sourceRecords=[r['id'] for r in records],
                  conflicts=[c['id'] for c in conflicts], externalResolution=resolution, risk=score, engineVersion=VERSION))
    log.info('Parcel %s run %s: %s, document mode %s', parcel_id, run_id, resolution['status'], resolution['documentEvidenceMode'])
    return validation
