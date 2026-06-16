const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '1234',
  database: 'adisan',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

pool.getConnection((err, connection) => {
  if (err) {
    console.log('Error MySQL:', err);
    return;
  }
  console.log('Conectado a MySQL');
  connection.release();
});

pool.on('error', err => {
  console.log('MySQL Error:', err);
});

module.exports = pool;
