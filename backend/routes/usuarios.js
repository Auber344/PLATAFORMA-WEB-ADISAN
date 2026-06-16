const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');

router.post('/registro', (req, res) => {
  const {
    nombres,
    apellidos,
    dni,
    ruc,
    telefono,
    correo,
    usuario,
    password,
    direccion
  } = req.body;

  if (!nombres || !apellidos || !dni || !telefono || !correo || !usuario || !password) {
    return res.json({ success: false, message: 'Complete todos los campos obligatorios' });
  }

  if (typeof dni !== 'string' || !/^\d{8}$/.test(dni)) {
    return res.json({ success: false, message: 'DNI debe tener 8 dígitos numéricos' });
  }

  if (ruc && (typeof ruc !== 'string' || !/^\d{11}$/.test(ruc))) {
    return res.json({ success: false, message: 'RUC debe tener 11 dígitos numéricos' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(correo)) {
    return res.json({ success: false, message: 'Correo electrónico inválido' });
  }

  if (typeof password !== 'string' || password.length < 4) {
    return res.json({ success: false, message: 'La contraseña debe tener al menos 4 caracteres' });
  }

  if (typeof usuario !== 'string' || usuario.length < 3) {
    return res.json({ success: false, message: 'El usuario debe tener al menos 3 caracteres' });
  }

  if (typeof telefono !== 'string' || telefono.length < 7) {
    return res.json({ success: false, message: 'Teléfono inválido' });
  }

  const nombresTrim = nombres.trim();
  const apellidosTrim = apellidos.trim();

  db.query('SELECT id FROM usuarios WHERE usuario = ?', [usuario.trim()], (err, exists) => {
    if (err) {
      console.log(err);
      return res.json({ success: false, message: 'Error del servidor' });
    }
    if (exists.length > 0) {
      return res.json({ success: false, message: 'El usuario ya existe' });
    }

    db.query('SELECT id FROM usuarios WHERE dni = ?', [dni], (err2, dniExists) => {
      if (err2) {
        console.log(err2);
        return res.json({ success: false, message: 'Error del servidor' });
      }
      if (dniExists.length > 0) {
        return res.json({ success: false, message: 'El DNI ya está registrado' });
      }

      const hashedPassword = bcrypt.hashSync(password, 10);

      db.query(
        `INSERT INTO usuarios (nombres, apellidos, dni, ruc, telefono, correo, usuario, password, direccion, rol)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'cliente')`,
        [nombresTrim, apellidosTrim, dni, ruc || null, telefono.trim(), correo.trim(), usuario.trim(), hashedPassword, direccion || null],
        (err3, result) => {
          if (err3) {
            console.log(err3);
            return res.json({ success: false, message: 'Error al registrar' });
          }
          res.json({ success: true });
        }
      );
    });
  });
});

router.get('/usuarios', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  if (page < 1 || limit < 1 || limit > 100) {
    return res.json({ data: [], total: 0 });
  }

  db.query('SELECT COUNT(*) AS total FROM usuarios', (err, countResult) => {
    if (err) {
      console.log(err);
      return res.json({ data: [], total: 0 });
    }

    db.query(
      'SELECT id, nombres, apellidos, dni, ruc, telefono, correo, usuario, rol, direccion FROM usuarios ORDER BY id DESC LIMIT ? OFFSET ?',
      [limit, offset],
      (err2, result) => {
        if (err2) {
          console.log(err2);
          return res.json({ data: [], total: 0 });
        }
        res.json({ data: result, total: countResult[0].total });
      }
    );
  });
});

module.exports = router;
