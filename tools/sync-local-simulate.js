const mysql = require('mysql2/promise');

(async function main(){
  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || '127.0.0.1',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'moibook2025',
    port: process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT,10) : 3306,
    waitForConnections: true,
    connectionLimit: 2
  });

  const conn = await pool.getConnection();
  try{
    const [rows] = await conn.query('SELECT * FROM moi_entries WHERE synced = 0 ORDER BY id ASC LIMIT 100');
    if (!rows || rows.length === 0) {
      console.log('No unsynced rows found');
      return;
    }

    console.log(`Simulating central import for ${rows.length} rows`);
    const results = [];
    for (const r of rows) {
      const uuid = r.uuid || (function(){
        return 'sim-'+Math.random().toString(36).slice(2,10);
      })();
      // Simulate central insert: here we'll simply mark the row as synced and set remote_id to the same id
      const remoteId = r.id;
      await conn.query('UPDATE moi_entries SET uuid = ?, synced = 1, remote_id = ? WHERE id = ?', [uuid, remoteId, r.id]);
      results.push({ uuid, id: remoteId, action: 'simulated_insert' });
    }

    console.log('Simulation results:', results);
  } catch (err) {
    console.error('Simulation failed:', err.message || err);
  } finally {
    conn.release();
    await pool.end();
  }
})();
