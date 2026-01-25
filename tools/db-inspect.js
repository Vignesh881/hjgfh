const mysql = require('mysql2/promise');

(async function main(){
  try{
    const pool = mysql.createPool({
      host: process.env.MYSQL_HOST || '127.0.0.1',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'moibook2025',
      port: process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT,10) : 3306,
    });
    const conn = await pool.getConnection();
    try{
      const [cols] = await conn.query("SHOW COLUMNS FROM moi_entries");
      console.log('Columns for moi_entries:');
      cols.forEach(c => console.log(c.Field, c.Type, c.Null, c.Key, c.Default));
    }finally{
      conn.release();
      await pool.end();
    }
  }catch(err){
    console.error('DB inspect failed:', err.message || err);
    process.exit(2);
  }
})();
