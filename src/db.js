const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'recruiter_bot',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true
});

/**
 * Verify database connection on startup
 */
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    return true;
  } catch (err) {
    console.error('----------------------------------------------------');
    console.error('DATABASE CONNECTION ERROR:');
    console.error(`Could not connect to MySQL database "${process.env.DB_NAME}" at ${process.env.DB_HOST}:${process.env.DB_PORT}.`);
    console.error(`Error message: ${err.message}`);
    console.error('Check your .env settings (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME).');
    console.error('Ensure MySQL is running and the database has been created:');
    console.error('  mysql -u root -p -e "CREATE DATABASE recruiter_bot;"');
    console.error('----------------------------------------------------');
    throw err;
  }
}

module.exports = {
  pool,
  testConnection
};
