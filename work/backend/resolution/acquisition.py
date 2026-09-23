"""Bounded acquisition. Every planned path is evaluated before documentary fallback."""
import asyncio
import hashlib
import logging
import time
from datetime import datetime, timezone
from .. import store as db
from .contracts import SourceResponse, SourceState
from .normalization import timestamp

log = logging.getLogger('bharat.evidence')
RETRYABLE = {SourceState.TEMPORARILY_UNAVAILABLE, SourceState.TIMEOUT}


async def acquire(plan, timeout=2.0, attempts=2, backoff=.05):
    async def provider(item):
        adapter = item['adapter']
        capabilities = adapter.get_capabilities()
        records, queries, claims = [], [], []
        summary = dict(adapter.get_provenance(), status=item['status'], reason=item['reason'],
                       capabilities=sorted(capabilities.facts), requiredFacts=item['facts'],
                       attempted=False, attempts=0, recordsFound=0, usableRecords=0,
                       pathsExhausted=not item['truncated'])
        if item['status'] != 'PLANNED':
            queries.append(dict(id=db.uid('QRY'), sourceSystem=adapter.source_system, sourceType=adapter.source_type,
                attempt=0, status=item['status'], queriedAt=db.now(), durationMs=0, query={}, message=item['reason']))
            return summary, queries, records, claims
        for query in item['queries']:
            for attempt in range(1, attempts + 1):
                started = time.monotonic()
                queried_at = db.now()
                try:
                    response = await asyncio.wait_for(adapter.search_record(query), timeout=timeout)
                    if not isinstance(response, SourceResponse) or not isinstance(response.records, list):
                        raise ValueError('Invalid adapter envelope')
                    SourceState(response.status)
                    if response.status == SourceState.RECORD_FOUND and not response.records:
                        raise ValueError('RECORD_FOUND requires at least one record')
                except (TimeoutError, asyncio.TimeoutError):
                    response = SourceResponse(SourceState.TIMEOUT, message='Source query deadline exceeded.')
                except PermissionError:
                    response = SourceResponse(SourceState.ACCESS_DENIED, message='Source access denied.')
                except ValueError:
                    response = SourceResponse(SourceState.INVALID_RESPONSE, message='Invalid source response envelope.')
                except Exception as error:
                    # Do not serialize exception messages that could contain a credential-bearing URL.
                    log.warning('Provider %s failed (%s)', adapter.source_system, type(error).__name__)
                    response = SourceResponse(SourceState.TEMPORARILY_UNAVAILABLE, message='Provider query failed.')
                q = dict(id=db.uid('QRY'), sourceSystem=adapter.source_system, sourceType=adapter.source_type,
                         attempt=attempt, status=str(response.status), queriedAt=queried_at,
                         durationMs=round((time.monotonic() - started) * 1000), query=query, message=response.message)
                queries.append(q)
                summary.update(attempted=True, attempts=summary['attempts'] + 1)
                for raw in response.records:
                    normalized, error = [], None
                    try:
                        adapter.validate_response(raw)
                        normalized = adapter.normalize_record(raw)
                        if any(c['fact'] not in capabilities.facts for c in normalized):
                            raise ValueError('Adapter emitted an undeclared fact')
                    except Exception:
                        error = 'Source schema validation or normalization failed.'
                    data = raw if isinstance(raw, dict) else {}
                    updated = timestamp(data.get('updated_at'))
                    age = (datetime.now(timezone.utc) - updated).total_seconds() / 86400 if updated else None
                    fresh = age is not None and 0 <= age <= capabilities.max_age_days
                    verification = data.get('verification_status', 'UNVERIFIED')
                    completeness = sum(c.get('normalizedValue') is not None for c in normalized) / max(1, len(normalized))
                    components = dict(authority=capabilities.authority, verification=1 if verification == 'VERIFIED' else .4,
                                      freshness=1 if fresh else .4, completeness=completeness, provenance=1 if updated else .4)
                    reliability = round(components['authority'] * components['verification'] * components['freshness'] * completeness * components['provenance'], 3)
                    state = 'INVALID_RESPONSE' if error else 'UNVERIFIED' if verification != 'VERIFIED' else 'STALE' if not fresh else 'VERIFIED'
                    usable = not error and state == 'VERIFIED' and reliability >= .6 and response.status == SourceState.RECORD_FOUND
                    record = dict(id=db.uid('SRC'), queryId=q['id'], sourceType=adapter.source_type,
                        sourceSystem=adapter.source_system, externalRecordId=data.get('external_record_id'),
                        rawData=raw, dataHash=hashlib.sha256(db.encode(raw).encode()).hexdigest(),
                        availabilityStatus='INVALID_RESPONSE' if error else str(response.status),
                        verificationStatus=verification, freshnessStatus='FRESH' if fresh else 'STALE', status=state,
                        retrievedAt=db.now(), sourceUpdatedAt=data.get('updated_at'), sourceVersion=data.get('source_version'),
                        simulated=adapter.simulated, usable=bool(usable), reliability=reliability,
                        reliabilityComponents=components, independenceGroup=capabilities.independence_group or adapter.source_system,
                        error=error)
                    records.append(record)
                    if error: q['status'] = 'INVALID_RESPONSE'
                    else:
                        summary['recordsFound'] += 1
                        summary['usableRecords'] += int(bool(usable))
                    for c in normalized:
                        claims.append(dict(c, id=db.uid('CLM'), sourceRecordId=record['id'],
                            source=adapter.source_system, sourceType=adapter.source_type, sourceSystem=adapter.source_system,
                            externalRecordId=record['externalRecordId'], retrievedAt=record['retrievedAt'],
                            dataHash=record['dataHash'], independenceGroup=record['independenceGroup'],
                            simulated=adapter.simulated, usable=bool(usable) and c.get('normalizedValue') is not None,
                            reliability=reliability, sourceStatus=state))
                log.info('Source %s attempt %s: %s', adapter.source_system, attempt, q['status'])
                if response.status not in RETRYABLE or attempt == attempts: break
                await asyncio.sleep(backoff * 2 ** (attempt - 1))
        statuses = [r['status'] for r in records]
        summary.update(status='PARTIAL' if summary['usableRecords'] and (
            any(q['status'] != 'RECORD_FOUND' for q in queries if q['attempt'] == attempts) or any(s != 'VERIFIED' for s in statuses))
            else 'RECORD_FOUND' if summary['usableRecords'] else statuses[-1] if statuses else queries[-1]['status'],
            reason='; '.join(dict.fromkeys(q['message'] for q in queries if q['message'])) or 'Source records evaluated.',
            recordIds=[r['id'] for r in records])
        return summary, queries, records, claims

    results = await asyncio.gather(*(provider(item) for item in plan))
    return tuple([value for result in results for value in (result[i] if i else [result[i]])] for i in range(4))
