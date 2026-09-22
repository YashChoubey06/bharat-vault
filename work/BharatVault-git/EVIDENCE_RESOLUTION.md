# Bharat Vault evidence resolution

The backend acquires source evidence before reconciling documentary claims. OCR confidence, source reliability, validation confidence, risk, and officer approval are separate values.

## What changed

The original repository used FastAPI with SQLite, JSON entities, local Tesseract, cookie authentication, district scoping and officer roles. It did not have the PostgreSQL/SQLAlchemy/Alembic models assumed by the supplied architecture prompt. Those working routes and authentication calls are retained through a SQLAlchemy repository compatibility layer. PostgreSQL is now the local application's active database; SQLite remains an isolated test and pre-migration rollback option.

The pipeline is:

1. Preserve the document and its OCR extraction.
2. Convert fields into typed claims with original values, page, box, extraction ID and version.
3. Determine required facts from claims, parcel context, document types, GIS/dispute references and requested checks.
4. Discover providers by capability and jurisdiction. Plan distinct usable identifier queries.
5. Query all applicable paths with a per-attempt deadline and at most two attempts for temporary failures/timeouts. Keep every attempt, including failures. The default backoff is 50ms, then exponential; adapters must use cooperative async I/O.
6. Preserve raw records and hashes, normalize claims, evaluate verification, freshness, completeness, provenance, source independence and parcel identity.
7. Compare individual facts without majority voting. Current ownership needs two independent usable source groups. Other required facts currently require one; these are explicit policy thresholds, not legal rules.
8. Evaluate documentary evidence for unresolved fields only after all planned paths were exhausted. Partial external evidence remains visible. If the query safety cap (32 paths/provider) is reached, acquisition is incomplete and document fallback is not activated.
9. Persist the full run, risk factors, review case and audit event. An explicit officer decision is required.

The fixed area tolerance is configurable with `AREA_TOLERANCE_HA` (default 0.02 hectares). Unknown regional units are unresolved; the engine never guesses a bigha conversion. Names use Unicode/whitespace/case normalization, not fuzzy or vector similarity. A purchaser is only a current-holder corroborator when the provider explicitly records a current, effective ownership reference. Historical holders remain separate claims.

## Demonstrating it

Open Records, choose a parcel, then open Validation. The Evidence acquisition panel contains:

- source mode and labeled synthetic scenario controls;
- evidence coverage and external verification status;
- source results and attempt counts;
- field-level values, explanations and source IDs;
- original source payloads, retrieval times and SHA-256 hashes;
- officer conflict resolution with a selected supporting value and mandatory reason.

Use `consistent`, `ror_unavailable`, `mutation_unavailable`, `owner_conflict`, `gis_conflict`, then `exhausted` to demonstrate the important transitions. RoR being unavailable can still leave ownership sufficiently corroborated by registration and mutation. All-source exhaustion can produce internally consistent documents, but cannot produce external verification.

Mocks contain four independent synthetic fixtures for surveys 124/3, 125/1, 126/2 and 127/4 in Rampura, Ladpura, Kota, Rajasthan. They do not copy OCR values or create matching evidence for arbitrary new parcels. Other identifiers correctly return RECORD_NOT_FOUND. Fixture source timestamps are fixed at 2026-09-01, so they will eventually become stale under the normal policy. Scenario selection and requested checks are retained during later document reviews/reprocessing.

`SIMULATED` is displayed separately from corroboration. Approving fully reviewed documentary or simulated evidence yields `CONDITIONAL_REVIEWED`, not `VERIFIED`. Open conflicts block approval. Officers resolve conflicts separately; source records are never overwritten. A changed evidence fingerprint requires a new resolution. Only complete, usable, non-simulated external evidence can support a final `VERIFIED` officer decision.

## Storage and migrations

`backend/models.py` defines the SQLAlchemy schema. Existing MVP tables remain compatible. New tables are:

| Table | Purpose |
| --- | --- |
| validation_runs | Immutable input hash and complete result snapshot |
| source_queries | Every query, attempt, gate outcome and duration |
| source_records | Raw JSONB payload, retrieval/status metadata, version and hash |
| canonical_claims | Relational fact identity, numeric/text normalized values and JSONB provenance |
| review_resolutions | Append-only officer selections, original alternatives and reasoning |

JSONB preserves source-specific data without replacing normalized claim columns. Existing parcel, case and risk JSON entities are compatibility projections. No speculative owners/transactions tables were invented for unavailable authoritative data. The original prompt's broader relational domain migration can be introduced incrementally; all exact evidence comparisons already use typed canonical claims.

Database triggers reject updates/deletes to source queries, source records, canonical claims, run snapshots, review resolutions and audit events. Existing audit events retain their hash chain. Run snapshots remain unchanged after review; the current projection and separate decision records show the latest officer action.

Migrations:

- `0001_existing_mvp`: adopt/create the existing schema without re-encoding data.
- `0002_evidence_resolution`: add source tables and append-only protections.

Run from the repository root:

```powershell
& backend/.venv/Scripts/python.exe -m alembic upgrade head
& backend/.venv/Scripts/python.exe -m alembic current
& backend/.venv/Scripts/python.exe -m alembic check
```

Destructive downgrades are deliberately not implemented. Restore a verified backup to roll back schema/data, and restore the matching application revision.

## Local PostgreSQL

PostgreSQL 17 binaries come from the official EDB distribution linked by PostgreSQL's Windows download page:
https://www.postgresql.org/download/windows/
https://www.enterprisedb.com/download-postgresql-binaries

It runs only on `127.0.0.1:5433` with SCRAM passwords generated locally. The application role owns the application database but is not a cluster superuser. Binaries, cluster files, credentials, uploaded documents and backups stay under ignored `backend/tools` / `backend/data` directories. Connection strings are in ignored `backend/.env`; never commit them.

```powershell
# On a fresh Windows checkout, after installing backend requirements:
& backend/.venv/Scripts/python.exe -m backend.setup_postgres
# Stop app servers before copying the old database:
& ./stop-local.ps1
& backend/.venv/Scripts/python.exe -m backend.migrate_postgres --activate
& ./start-local.ps1
```

The migration refuses a non-empty destination, takes a consistent SQLite backup, copies all existing rows, verifies counts and audit integrity, then activates PostgreSQL only when requested. Uploaded files are retained in place. The local migration preserved 3 users, 6 documents, 42 fields and 61 audit events before the new engine began recording runs.

`start-local.ps1` starts this project's existing PostgreSQL cluster when necessary. `stop-local.ps1` stops the frontend/backend and leaves PostgreSQL available. To stop the database gracefully when the app is stopped:

```powershell
& backend/tools/postgresql/pgsql/bin/pg_ctl.exe -D backend/data/postgresql -m fast -w stop
```

To use the retained SQLite database temporarily, stop the app and remove/comment `BHARAT_DATABASE_URL` in the local `.env`. PostgreSQL changes made after migration are not present in that older SQLite copy; do not switch databases expecting them to merge automatically.

## Provider integration

`resolution/contracts.py` defines `SourceAdapter` and `Capabilities`. A real provider implements async `search_record`/`fetch_record`, schema validation, normalization, capability declaration, status and provenance. Register a provider factory with `resolution.registry.register`; configure its credentials through environment variables. The engine and API do not need to change. Do not use request parameters to import provider code.

Supported source types today: RoR, registration, mutation, cadastral, court and revenue/tax. The shipped adapters are mocks only. `BHARAT_SOURCE_MODE=disabled` explicitly reports unconfigured sources. `live` uses registered providers and reports unconfigured sources if none are registered. `mock` runs the labeled demonstration fixtures. No government network integrations or credentials are claimed.

All raw provider payloads must be JSON-compatible; adapters should omit unnecessary sensitive identifiers and secrets before returning records. A `RECORD_NOT_FOUND` response means a completed query found no record. Outage, denied access, invalid response, insufficient identifiers, stale data and unverified data retain their own states.

## APIs

Existing `/api/v1/parcels/{id}/validation`, `/conflicts`, `/risk`, `/workspace`, OCR and verification APIs remain available. Validation fields are additive, with explicit check statuses replacing misleading PASS/FAIL assumptions.

New authenticated endpoints:

```text
POST /api/v1/validation/run
     { parcelId, sourceMode?, scenario?, requiredFacts? }
GET  /api/v1/validation/scenarios
GET  /api/v1/validation/{parcelId}
GET  /api/v1/validation/{parcelId}/{checks|sources|resolution|evidence|conflicts|queries|history}
GET  /api/v1/validation/{parcelId}/runs/{runId}
POST /api/v1/validation/{parcelId}/conflicts/{conflictId}/resolve
     { runId, selectedEvidenceId, notes }
```

All reads enforce existing parcel district scope. Running validation requires officer/admin permission; conflict resolution requires the assigned officer and the current run ID. Source payloads are not public. The existing assistant can explain structured validation findings and cite run/source IDs; it remains a bounded local retrieval interface. A vector index and semantic RAG model are not introduced by this change, and semantic similarity is never used as validation proof.

## Verification

```powershell
# SQLite, isolated temp directories:
& backend/.venv/Scripts/python.exe -m unittest backend.test_resolution backend.test_resolution_api backend.test_mvp backend.test_migrations -v
# PostgreSQL, disposable schemas in the separate bharatvault_test database:
& backend/.venv/Scripts/python.exe -m backend.test_postgres
node node_modules/next/dist/bin/next build --turbopack
```

Tests cover source failure versus absence, retry, deadlines, unverified/stale/malformed responses, independent corroboration, conflicting owners and parcel IDs, area/GIS mismatch, exhausted and incomplete source paths, document consistency/conflict, identifiers, conditional officer decisions, immutable evidence, historical runs, RBAC, migration preservation and real local English/Hindi OCR.

The MVP keeps the existing single OCR worker and serial write transactions (a PostgreSQL advisory lock protects the legacy audit chain and version checks). Source calls are concurrent within a run but the transaction remains open during acquisition. For production-scale government integrations, separate acquisition from the committing transaction and introduce durable per-run job handling after measuring provider latency; do not simply add additional worker processes to this local launcher.
