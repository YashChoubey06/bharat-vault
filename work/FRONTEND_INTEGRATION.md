# Frontend integration

The application in this directory uses the replacement UI from `../frontend` and the existing FastAPI backend in `backend/`.

## Run locally

Install the frontend dependencies with `pnpm install` (or `npm ci`). Copy `.env.example` to `.env.local` on a new machine and set the public Mapbox token. This computer already has its token configured.

Build with `pnpm build`, then run `./start-local.ps1`. Open http://localhost:3003. For development, use `./start-local.ps1 -Dev`; stop both servers with `./stop-local.ps1`. Backend installation and account setup remain documented in `LOCAL_MVP.md`.

The browser calls `/api/v1` on the frontend origin. Next.js forwards those requests to `BACKEND_URL` (default `http://127.0.0.1:8000`). Authentication uses the backend's HttpOnly session cookie. Sign in with an existing `@bharatvault.gov` account and its configured password; the account buttons do not supply passwords.

Uploads send real files to the OCR queue, then poll their saved status. Evidence reviews send field versions and officer notes. Verification decisions, reports, audit logs, assistant queries, and parcel views use existing backend routes and preserve string IDs. Failed requests are surfaced rather than replaced by demo records or successful-looking writes.

Dashboard filters operate on authorized backend records. National digitization metrics are unavailable unless supplied by the backend. The Studio uses stored parcel GeoJSON; building/floor records are unavailable because the backend does not provide them. Its Mapbox basemap requires network access and a valid token. The dashboard spatial overview is schematic; open parcel GIS or Studio for stored geometry. Sample parcel geometry is explicitly synthetic in its backend source metadata.

`../frontend` remains the original replacement source. Runtime data, backend credentials, and `.env.local` are ignored by Git. The pre-replacement rollback commit is `4b66a79`.

## Validation

Production build (including lint) passed. The 36 backend tests passed against isolated data. Browser checks covered sign-in and 15 application routes, a real file upload and completed OCR, a persisted field review after reload, rejected invalid uploads, and Mapbox style/tile access. Tests did not alter the working backend database.
