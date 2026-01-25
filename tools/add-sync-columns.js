const mysql = require('mysql2/promise');

(async function main(){
  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || '127.0.0.1',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'moibook2025',
    port: process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT,10) : 3306,
  });

  const conn = await pool.getConnection();
  try{
    const [cols] = await conn.query("SHOW COLUMNS FROM moi_entries LIKE 'uuid'");
    if (!cols || cols.length === 0) {
      console.log('Adding uuid column to moi_entries');
      await conn.query("ALTER TABLE moi_entries ADD COLUMN uuid CHAR(36) DEFAULT NULL");
    } else {
      console.log('uuid column already exists');
    }

    const [cols2] = await conn.query("SHOW COLUMNS FROM moi_entries LIKE 'synced'");
    if (!cols2 || cols2.length === 0) {
      console.log('Adding synced column to moi_entries');
      await conn.query("ALTER TABLE moi_entries ADD COLUMN synced TINYINT(1) DEFAULT 0");
    } else {
      console.log('synced column already exists');
    }

    console.log('Migration complete');
  } catch (err) {
    console.error('Migration failed:', err.message || err);
    process.exit(2);
  } finally {
    conn.release();
    await pool.end();
  }
})();
