#!/usr/bin/env node
// Simple QR URL generator for MoiBook prefill payloads
// Usage: node scripts/genQrUrl.js '{"name":"Murugan","phone":"999...","amount":"500"}'
const fs = require('fs');
const arg = process.argv[2];
if(!arg){
  console.log('Usage: node scripts/genQrUrl.js "{\"name\":\"Murugan\",\"phone\":\"999\"}" [--host=http://192.168.1.100:3000]');
  process.exit(1);
}
let payload;
try{ payload = JSON.parse(arg); }catch(e){ console.error('Invalid JSON'); process.exit(1); }
const hostArg = (process.argv.find(a=>a.startsWith('--host=')) || '--host=http://<PC-IP>:3000').split('=')[1];
const b64 = Buffer.from(JSON.stringify(payload)).toString('base64');
const scanUrl = `${hostArg.replace(/\/$/, '')}/scan.html#d=${b64}`;
const appPrefillUrl = `${hostArg.replace(/\/$/, '')}/?prefill=${encodeURIComponent(b64)}`;
console.log('Scan-only page URL (works without loading full app):');
console.log(scanUrl);
console.log('\nOpen-in-app (prefill query) URL:');
console.log(appPrefillUrl);
