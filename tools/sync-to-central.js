#!/usr/bin/env node
const mysql = require('mysql2/promise');
const { URL } = require('url');
const http = require('http');
const https = require('https');

const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '100', 10);
const CENTRAL_URL = process.env.CENTRAL_URL || process.argv[2];
if (!CENTRAL_URL) {
  console.error('Usage: CENTRAL_URL="https://central-host:3001/api/sync/import" node tools/sync-to-central.js');
  process.exit(1);
}

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'moibook2025',
  port: process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT, 10) : 3306,
  waitForConnections: true,
  connectionLimit: 5
});

const generateUuidV4 = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

async function ensureRemoteIdColumn(conn) {
  const [cols] = await conn.query("SHOW COLUMNS FROM moi_entries LIKE 'remote_id'");
  if (!cols || cols.length === 0) {
    console.log('Adding remote_id column to moi_entries');
    await conn.query('ALTER TABLE moi_entries ADD COLUMN remote_id INT DEFAULT NULL');
  }
}

function postJson(urlString, body) {
  const url = new URL(urlString);
  const data = JSON.stringify(body);
  const opts = {
    hostname: url.hostname,
    port: url.port || (url.protocol === 'https:' ? 443 : 80),
    path: url.pathname + (url.search || ''),
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  };
  const lib = url.protocol === 'https:' ? https : http;
  return new Promise((resolve, reject) => {
    const req = lib.request(opts, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          // debug: show raw response when parsing fails
          try {
            const parsed = JSON.parse(body || '{}');
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              resolve(parsed);
            } else {
              reject(new Error('Status ' + res.statusCode + ' ' + JSON.stringify(parsed)));
            }
          } catch (err) {
            console.error('Invalid JSON response from central endpoint. Raw body:');
            console.error(body);
            reject(new Error('Invalid JSON response: ' + String(body)));
          }
        });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function syncBatch() {
  const conn = await pool.getConnection();
  try {
    await ensureRemoteIdColumn(conn);

    const [rows] = await conn.query('SELECT * FROM moi_entries WHERE synced = 0 ORDER BY id ASC LIMIT ?', [BATCH_SIZE]);
    if (!rows || rows.length === 0) return false;

    const batch = [];
    for (const r of rows) {
      if (!r.uuid) {
        const newUuid = generateUuidV4();
        await conn.query('UPDATE moi_entries SET uuid = ? WHERE id = ?', [newUuid, r.id]);
        r.uuid = newUuid;
      }

      let parsedData = {};
      try { parsedData = r.data ? JSON.parse(r.data) : {}; } catch (e) { parsedData = {}; }

      batch.push({
        uuid: r.uuid,
        table: 'moi_entries',
        data: {
          event_id: r.event_id,
          table_no: r.table_no,
          contributor_name: r.contributor_name,
          amount: r.amount,
          phone: r.phone,
          note: r.note,
          denominations: parsedData.denominations || JSON.parse(r.denominations || '{}') || {},
          member_id: r.member_id,
          raw: parsedData || {}
        },
        sourceEvent: r.event_id,
        created_at: r.created_at
      });
    }

    console.log(`Pushing batch of ${batch.length} items to central`);
    const resp = await postJson(CENTRAL_URL, batch);
    if (!resp || !resp.success) throw new Error('Central responded with failure: ' + JSON.stringify(resp));

    // Mark synced and store remote ids if provided
    for (const resItem of resp.results || []) {
      try {
        if (!resItem.uuid) continue;
        const remoteId = resItem.id || null;
        await conn.query('UPDATE moi_entries SET synced = 1, remote_id = ? WHERE uuid = ?', [remoteId, resItem.uuid]);
      } catch (e) {
        console.warn('Failed to mark row synced for', resItem.uuid, e.message);
      }
    }

    return true;
  } finally {
    conn.release();
  }
}

async function main() {
  try {
    let round = 0;
    while (true) {
      round += 1;
      const did = await syncBatch();
      if (!did) break;
      console.log('Batch completed, checking for more...');
    }
    console.log('Sync finished');
    process.exit(0);
  } catch (err) {
    console.error('Sync failed:', err.message || err);
    process.exit(2);
  }
}

if (require.main === module) {
  main();
}
