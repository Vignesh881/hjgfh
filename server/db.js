const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const dbType = (process.env.DB_TYPE || '').trim().toLowerCase();
const databaseUrl = (process.env.DATABASE_URL || '').trim();
const isPostgres = dbType === 'postgres' || Boolean(databaseUrl);
if (process.env.RENDER || process.env.RENDER_SERVICE_ID) {
  console.log(
    `[DB] DB_TYPE=${dbType || '(empty)'} DATABASE_URL set=${Boolean(databaseUrl)}`
  );
}

const sanitizeIdentifier = (value) => {
  const text = String(value || '');
  if (!/^[A-Za-z0-9_]+$/.test(text)) {
    throw new Error(`Invalid SQL identifier: ${text}`);
  }
  return `"${text}"`;
};

const transformSql = (sql, params = []) => {
  let text = '';
  const values = [];
  let valueIndex = 1;
  let paramIndex = 0;

  for (let i = 0; i < sql.length; i += 1) {
    const ch = sql[i];
    if (ch === '?') {
      const next = sql[i + 1];
      if (next === '?') {
        const ident = params[paramIndex++];
        text += sanitizeIdentifier(ident);
        i += 1;
        continue;
      }
      text += `$${valueIndex++}`;
      values.push(params[paramIndex++]);
      continue;
    }
    text += ch;
  }

  return { text, values };
};

if (!isPostgres) {
  const mysql = require('mysql2/promise');
  const fsSync = require('fs');

  const hostName = process.env.MYSQL_HOST || 'localhost';
  const sslMode = (process.env.MYSQL_SSL || '').toLowerCase();
  const caBundlePath = path.join(__dirname, '..', 'cacert.pem');
  const sslCaPath = process.env.MYSQL_SSL_CA_PATH;
  const sslCaEnv = process.env.MYSQL_SSL_CA;
  const shouldUseSsl = sslMode === 'true' || sslMode === '1' || /psdb\.cloud$/i.test(hostName);
  const resolvedCa = shouldUseSsl
    ? (() => {
        if (sslCaPath && fsSync.existsSync(sslCaPath)) {
          return fsSync.readFileSync(sslCaPath, 'utf8');
        }
        if (sslCaEnv) {
          return sslCaEnv.replace(/\\n/g, '\n');
        }
        if (fsSync.existsSync(caBundlePath)) {
          return fsSync.readFileSync(caBundlePath, 'utf8');
        }
        return undefined;
      })()
    : undefined;

  const sslOptions = shouldUseSsl
    ? resolvedCa
      ? { ca: resolvedCa, rejectUnauthorized: true }
      : { rejectUnauthorized: true }
    : undefined;

  const pool = mysql.createPool({
    host: hostName,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'moibook_db',
    port: process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT, 10) : 3306,
    ssl: sslOptions,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4_general_ci'
  });

  module.exports = { pool, isPostgres };
  return;
}

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const query = async (sql, params = []) => {
  const { text, values } = transformSql(sql, params);
  const result = await pool.query(text, values);
  const output = {
    rows: result.rows || [],
    rowCount: result.rowCount || 0,
    insertId: result.rows && result.rows.length ? result.rows[0].id : null,
    affectedRows: result.rowCount || 0
  };
  const isSelect = /^\s*(select|with)\b/i.test(text);
  const primary = isSelect ? output.rows : output;
  return [primary, output];
};

const getConnection = async () => ({
  query,
  release: () => {}
});

module.exports = { pool: { query, getConnection }, isPostgres };
