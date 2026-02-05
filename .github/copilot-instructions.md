# AI Agent Guide — MoiBook2025 (concise)

Short actionable briefing to get an AI coding agent productive in this repo.

## Big picture (what to know)
- Frontend: Create React App SPA (entry: `src/App.jsx`, main flow: `src/components/MoiFormPage.jsx`). State via `zustand`; many UI helpers live in `src/lib`.
- Data layer: `src/lib/databaseManager.js` implements offline-first logic (local `sql.js` / localStorage) and falls back to backend API at `http://localhost:3001/api` when available.
- Backend: Express API at `server/server.js` using `mysql2` pool. Supports local MySQL and PlanetScale (SSL auto-detection for `*.psdb.cloud`).
- Reporting/Export: `src/lib/exportUtils.js` renders `src/components/MoiReport.jsx` offscreen and waits multiple seconds for Tamil fonts before capturing PDF/XLSX — do not shorten this delay.

## Quick developer workflows
- Install deps: `npm install` (postinstall copies `sql-wasm.wasm` to `public/`).
- Run frontend: `npm start` (http://localhost:3000).
- Run API: `npm run server` (starts `server/server.js`, reads `server/.env`).
- Useful scripts: `npm run build`, `npm run static-proxy`, `npm run test-planetscale`.

Example dev steps:
```powershell
npm install
npm run server   # start API (server/.env used)
npm start        # start React dev server
```

## Project-specific conventions (must-follow)
- ID format: UI stores zero-padded 4-digit strings (`"0042"`) but server expects numeric IDs — always convert via canonical helpers (see `toNumericId`/`padId` in `server/server.js`).
- localStorage keys use prefix `moibook_` (e.g., `moibook_events`, `moibook_moi_entries`); changing keys breaks recovery/backup logic in `src/lib/localStorage.js`.
- Shortcuts: space-key expansions implemented in `src/lib/*Shortcuts.js` files; custom shortcuts are persisted under `moibook_custom*` keys.

## Integration points & noteworthy endpoints
- API base: `/api/*` served from `server/server.js` (port 3001 by default).
- Print: POST `/api/printers/print` — Windows-only path that stages a file and invokes PowerShell to print (see `server/server.js` printing section and `src/lib/printUtils.jsx`).
- Booking pages: frontend routes `/booking` and `/booking-admin` (admin PIN stored in localStorage; default `1234`).
- DB config: `server/.env` keys: `MYSQL_HOST`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE` (+ optional SSL CA overrides).

## Known pitfalls & non-obvious rules
- ID mismatch: failing to normalize UI string IDs to numeric values causes 400 responses. Use `toNumericId()` on server and `padId()` when showing IDs.
- Export timing: `exportUtils.js` includes deliberate waits for Tamil font rendering — do not reduce without testing.
- localStorage size: keys are pruned automatically; avoid large key renames or bulky client-side blobs.

## Key files to inspect first
- `src/components/MoiFormPage.jsx` — primary data-entry flow.
- `src/lib/databaseManager.js` — offline/online sync logic.
- `src/lib/localStorage.js` — persistence, backups, and validation.
- `src/lib/exportUtils.js` + `src/components/MoiReport.jsx` — PDF/Excel generation nuances.
- `server/server.js` — API, ID helpers, PlanetScale/SSL detection, and Windows print path.

## If you need to change behavior
- To change ID handling, update `server/server.js` helpers (`toNumericId`, `padId`) and search for `toNumericId()` usages in the codebase.
- To modify export timing, run a manual experiment: open a Tamil-heavy report in `src/components/MoiReport.jsx` and measure render-to-capture delay before changing waits in `src/lib/exportUtils.js`.

---
If you'd like, I can (1) run tests (`npm run test-planetscale`), (2) open a short PR with small improvements, or (3) expand any section above with concrete code pointers — which should I do next?
