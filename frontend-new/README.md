# Bharat Vault — frontend-new

This frontend uses the existing FastAPI backend and data in `../work/backend`.

## Run

1. Install dependencies with `pnpm install --frozen-lockfile` (or `npm ci`).
2. On a new computer, copy `.env.example` to `.env.local` and set the Mapbox token. The token is already configured on this computer.
3. Run `pnpm build`, then `./start-local.ps1`. Open http://localhost:3003.
4. Stop with `./stop-local.ps1`. Use `./start-local.ps1 -Dev` for development.

Stop the older application's servers first if ports 3003 or 8000 are occupied. Backend setup and account administration are documented in `../work/LOCAL_MVP.md`.

To run just this frontend against an already running backend, use `pnpm dev` or `pnpm start`. Requests use the same-origin `/api/v1` proxy, forwarding to `BACKEND_URL` (default `http://127.0.0.1:8000`). Authentication uses HttpOnly session cookies. Select a local account and enter its configured password; no demo passwords are supplied.

Uploads, OCR status, evidence reviews, verification decisions, reports, audit, assistant queries, and global search use backend records. Errors are surfaced rather than replaced with simulated success. Mapbox views use saved parcel geometry. National digitization metrics and building/floor records are unavailable unless the backend supplies them. Seeded GIS sources are explicitly synthetic.

The pre-integration checkpoint in this folder's Git repository is `cf597bb`. `.env.local` remains untracked.

## Verified

Production build and lint completed (one existing Google Fonts loading warning). Browser checks passed for 15 application routes, sign-in, real upload/OCR, persistent officer review, invalid-upload errors, global search, audit notifications, and sign-out/session revocation. Browser writes used a separate test database, not the working backend data.
