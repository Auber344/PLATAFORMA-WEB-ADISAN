const express = require('express');

const cors = require('cors');

const path = require('path');

const app = express();
const db = require('./db');
const bcrypt = require('bcryptjs');

app.use(cors());

app.use(express.json());

app.use(express.static(path.join(__dirname, '../frontend')));

const auth = require('./routes/auth');

const productos = require('./routes/productos');

const usuarios = require('./routes/usuarios');

const proveedores = require('./routes/proveedores');

const pedidos = require('./routes/pedidos');

const categoriasRoutes = require('./routes/categorias');

const dashboardRoutes = require('./routes/dashboard');
const ofertasRoutes = require('./routes/ofertas');

app.use('/api', auth);
app.use('/api', productos);
app.use('/api', usuarios);
app.use('/api', proveedores);
app.use('/api', pedidos);
app.use('/api', categoriasRoutes);
app.use('/api', dashboardRoutes);
app.use('/api', ofertasRoutes);

app.get('/', (req, res) => {

  res.sendFile(
    path.join(__dirname, '../frontend/index.html')
  );

});


app.listen(3000, () => {

  console.log(
    'Servidor en http://localhost:3000'
  );

  db.query('SELECT id FROM usuarios WHERE usuario = ?', ['admin'], (err, result) => {
    if (!err && result.length === 0) {
      const hash = bcrypt.hashSync('1234', 10);
      const sql = `INSERT INTO usuarios (nombres, apellidos, dni, telefono, correo, usuario, password, rol)
                   VALUES (?, ?, ?, ?, ?, ?, ?, 'admin')`;
      db.query(sql, ['Admin', 'Sistema', '00000000', '999999999', 'admin@adisan.com', 'admin', hash], (err2) => {
        if (!err2) console.log('Usuario admin creado (admin/1234)');
      });
    }
  });

});