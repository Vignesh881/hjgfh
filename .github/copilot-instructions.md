# MoiBook2025 — AI Coding Agent Guide

## Quick start (dev)
- npm install
- npm start           # React SPA (http://localhost:3000)
- npm run server      # API (http://localhost:3001/api)
- npm run build       # production build
- npm run test-planetscale  # cloud DB smoke test

## Architecture overview (how data flows)
- Frontend is CRA React; bootstrap + local→API migration live in src/App.jsx.
- API is Express + mysql2/promise in server/server.js; schema is created/managed in ensureSchema().
- Data access is local‑first: src/lib/databaseManager.js prefers API, falls back to src/lib/localStorage.js, and migrates local → API when available.
- Printing/export: src/lib/printUtils.jsx + server/server.js handle POS printing; src/lib/exportUtils.js handles PDF/Excel/Word capture.

## Project-specific conventions (must follow)
- UI IDs are 4‑digit padded strings; backend stores numeric auto‑increment IDs. Use toNumericId() before API calls.
- Always scope entries by eventId === event.id (see filteredMoiEntries in src/components/MoiFormPage.jsx).
- Member IDs auto-generate as UR-XXXX when empty; sequence is computed across events in the frontend.
- Shortcuts dictionaries are in src/lib/townShortcuts.js, nameShortcuts.js, relationshipShortcuts.js, amountShortcuts.js; custom shortcuts stored in localStorage.customTownShortcuts.
- Do not rename LocalStorage keys (moibook_*). Use helpers in src/lib/localStorage.js.
- Preserve Tamil fonts/tokens in reports/prints (Noto Sans Tamil, Latha, TAMu_Kadambri).

## Integration & configuration
- Database config lives in server/.env (MYSQL_* local; PLANETSCALE_* cloud). See README.md for examples.
- Windows-only direct printing posts to /api/printers/print; server writes a temp file and calls a PowerShell print helper.
- Export timing matters: src/lib/exportUtils.js waits ~4s render + 1.5s settle for reliable captures.

## Distribution/portable build
- MoiBook2025_Portable contains a static build + launcher. Update it by running npm run build, then copy build/ → MoiBook2025_Portable/build/.

## Key files to reference
- src/App.jsx (bootstrap/migration)
- src/lib/databaseManager.js (API/localStorage fallback)
- src/lib/localStorage.js (storage shape/exporters)
- src/components/MoiFormPage.jsx (event-scoped validations)
- server/server.js (routes, ensureSchema, print endpoint)
- src/lib/exportUtils.js (PDF/export timing)
- src/lib/printUtils.jsx (print layout + POS flow)
