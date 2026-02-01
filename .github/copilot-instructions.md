# MoiBook2025 — AI Coding Agent Guide

## Big picture
- Frontend is CRA SPA: entry at ../src/App.jsx; primary data entry flow in ../src/components/MoiFormPage.jsx.
- Offline-first data flow: ../src/lib/databaseManager.js prefers API, falls back to localStorage; persistence + validation + backups in ../src/lib/localStorage.js.
- API base URL is client-configurable via `window.__MOIBOOK_API_URL__` or localStorage `moibook_api_url` (see ../src/lib/databaseManager.js).
- Backend: Express + MySQL pool in ../server/server.js, with SSL support for PlanetScale/remote MySQL. Schema/migrations live under ../server/ and ../server/migrations/.
- Reporting/export: ../src/lib/exportUtils.js renders hidden MoiReport and waits for render before capture; timing is critical.

## Core workflows (from package.json/README)
- npm install (copies sql.js WASM to public via postinstall)
- npm start (SPA at http://localhost:3000)
- npm run server (API at http://localhost:3001/api; reads server/.env)
- npm run static-proxy (local static proxy)
- npm run test-planetscale (PlanetScale smoke test)

## Project-specific conventions (don’t change silently)
- IDs: UI uses zero‑padded 4‑digit strings; server expects numeric IDs (`toNumericId()` in ../server/server.js). Convert before API calls.
- localStorage keys must keep the `moibook_` prefix; import/export + backups depend on exact names (see ../src/lib/localStorage.js).
- Event scoping: UI flows filter by `eventId === event.id` (see ../src/components/MoiFormPage.jsx).
- Shortcuts catalogs live in ../src/lib/*Shortcuts.js; custom lists stored under keys like `moibook_customTownShortcuts`.

## Integrations & platform notes
- DB config in ../server/.env: `MYSQL_*` for local/remote; PlanetScale uses `PLANETSCALE_*` (see ../PLANETSCALE_SETUP.bat).
- Printing is Windows-only and server-side: `/api/printers/print` executes PowerShell with custom paper sizes (see ../server/server.js).
- Booking pages exist: `/booking` (public) and `/booking-admin` (PIN‑protected); defaults documented in ../README.md.
- Portable offline bundle is in ../MoiBook2025_Portable/ with launcher bat files (see ../MoiBook2025_Portable/README.md).

## Known edges
- Mixing string IDs vs numeric IDs breaks API calls; always normalize before sending to server.
- Renaming `moibook_*` keys breaks migrations/import/export.
- Export timing in ../src/lib/exportUtils.js uses ~4s + 1.5s delays; keep them to avoid flaky PDFs.

## Fast file map
- ../src/App.jsx
- ../src/components/MoiFormPage.jsx
- ../src/lib/databaseManager.js
- ../src/lib/localStorage.js
- ../src/lib/exportUtils.js
- ../server/server.js
