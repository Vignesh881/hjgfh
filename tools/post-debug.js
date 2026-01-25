const http = require('http');

const payload = JSON.stringify([
  { uuid: 'debug-uuid-1', table: 'moi_entries', data: { event_id: 1, contributor_name: 'DBG', amount: 1 }, created_at: '2026-01-01 00:00:00' }
]);

const opts = {
  hostname: 'localhost',
  port: process.env.PORT || 4001,
  path: '/api/sync/import',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
};

const req = http.request(opts, (res) => {
  console.log('STATUS', res.statusCode);
  console.log('HEADERS', res.headers);
  let body = '';
  res.setEncoding('utf8');
  res.on('data', (d) => body += d);
  res.on('end', () => {
    console.log('RAW RESPONSE BODY:');
    console.log(body);
    try {
      console.log('PARSED JSON:', JSON.parse(body));
    } catch (e) {
      console.error('Failed to parse JSON response:', e.message);
    }
  });
});

req.on('error', (e) => { console.error('Request error', e.message); });
req.write(payload);
req.end();
