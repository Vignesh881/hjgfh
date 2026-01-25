// MySQL Adapter for MoiBook2025 (Node.js backend)


const mysql = require('mysql2/promise');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

class MySQLAdapter {
  constructor(config) {
    this.config = config || {};
    this.connection = null;
  }

  async connect() {
    // Use Mozilla cacert.pem for SSL
    const host = process.env.MYSQL_HOST;
    const user = process.env.MYSQL_USER;
    const password = process.env.MYSQL_PASSWORD;
    const database = process.env.MYSQL_DATABASE;
    const port = process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT, 10) : 3306;
    const ca = fs.readFileSync(path.join(__dirname, '../cacert.pem'), 'utf8');
    this.connection = await mysql.createConnection({
      host,
      user,
      password,
      database,
      port,
      ssl: {
        ca,
        rejectUnauthorized: true
      }
    });
    console.log('Connected to Planetscale using Mozilla cacert.pem');
    return true;
  }
  async disconnect() {
    if (this.connection) await this.connection.end();
  }
  async getEvents() {
    const [rows] = await this.connection.execute('SELECT * FROM events');
    return rows;
  }
  async createEvent(eventData) {
    const [result] = await this.connection.execute(
      'INSERT INTO events (event_name, event_date) VALUES (?, ?)',
      [eventData.eventName, eventData.eventDate]
    );
    return { id: result.insertId, ...eventData };
  }
  // ... Add other CRUD functions as needed ...
}

module.exports = MySQLAdapter;
