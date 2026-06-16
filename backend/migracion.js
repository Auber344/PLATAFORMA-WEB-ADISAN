const mysql = require('mysql2');
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '1234',
  database: 'adisan',
  waitForConnections: true,
  connectionLimit: 1,
  queueLimit: 0
});

const queries = [
  `ALTER TABLE pedidos ADD COLUMN fecha_estimada_entrega DATETIME NULL AFTER estado`,
  `ALTER TABLE pedidos ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER fecha`,
  `CREATE TABLE IF NOT EXISTS ofertas (
     id INT AUTO_INCREMENT PRIMARY KEY,
     nombre VARCHAR(200) NOT NULL,
     precio_oferta DECIMAL(10,2) NOT NULL,
     activa TINYINT(1) DEFAULT 1,
     fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
   )`,
  `CREATE TABLE IF NOT EXISTS oferta_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      oferta_id INT NOT NULL,
      producto_id INT NOT NULL,
      presentacion_id INT NOT NULL,
      cantidad INT DEFAULT 1,
      FOREIGN KEY (oferta_id) REFERENCES ofertas(id) ON DELETE CASCADE,
      FOREIGN KEY (producto_id) REFERENCES productos(id),
      FOREIGN KEY (presentacion_id) REFERENCES presentaciones(id)
    )`,
  `ALTER TABLE detalle_pedido ADD COLUMN nombre_oferta VARCHAR(255) DEFAULT NULL`
];

pool.getConnection((err, conn) => {
  if (err) {
    console.log('Error conectando:', err);
    process.exit(1);
  }
  let i = 0;
  function next() {
    if (i >= queries.length) {
      console.log('Migración completada');
      conn.release();
      pool.end();
      process.exit(0);
      return;
    }
    conn.query(queries[i], (err2) => {
      if (err2 && err2.errno !== 1060) {
        console.log('Error en query', i + 1, ':', err2.message);
      } else {
        console.log('OK query', i + 1);
      }
      i++;
      next();
    });
  }
  next();
});
