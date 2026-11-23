const path = require('path');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const rawHost = (process.env.DB_HOST || '127.0.0.1').trim();
const host = rawHost === 'localhost' ? '127.0.0.1' : rawHost;

// Create connection pool for MySQL
const pool = mysql.createPool({
  host,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'admin',
  database: process.env.DB_NAME || 'sl',
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  decimalNumbers: true
});

module.exports = pool;
