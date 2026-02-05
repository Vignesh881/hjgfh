# Scan-only page & Prefill workflow

This document describes the lightweight "scan-only" page and how QR payloads can open the form-only view in MoiBook.

Files added
- `public/scan.html` — static page that decodes `#d=BASE64_JSON`, shows small preview, and lets the operator copy JSON or open the main app with `?prefill=`.
- `scripts/genQrUrl.js` — node helper to create `scan.html` and `?prefill=` URLs from a JSON payload.

Recommended workflow
1. Use `scripts/genQrUrl.js` to produce a `scan.html#d=BASE64` URL and print QR stickers.
2. Attendee scans QR with phone — it opens `scan.html` which shows the decoded fields only (no full app load).
3. Operator taps `Open in MoiFormPage` (or copies JSON and pastes into the app). This opens the app with `?prefill=BASE64` which auto-fills the form.

Notes
- Use fragment `#d=` in `scan.html` for privacy (fragments are not sent to the server).
- The app prefill uses `?prefill=` (query) because React will read it on load and call internal `applyQrPayload`.
- If you prefer not to expose the PC IP, host `scan.html` on GitHub Pages and use the `Open in MoiFormPage` button to target your local PC.

How to generate and test
```powershell
node scripts/genQrUrl.js "{\"name\":\"முருகன்\",\"phone\":\"9999999999\",\"amount\":\"500\",\"eventId\":\"0042\"}" --host=http://192.168.1.100:3000
```
