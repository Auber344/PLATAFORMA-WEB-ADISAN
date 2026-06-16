const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');

router.post('/login', (req, res) => {
  const { usuario, password } = req.body;

  if (!usuario || !password) {
    return res.json({ success: false, message: 'Usuario y contraseña requeridos' });
  }

  if (typeof usuario !== 'string' || typeof password !== 'string') {
    return res.json({ success: false, message: 'Formato inválido' });
  }

  const usuarioTrim = usuario.trim();
  const passwordTrim = password.trim();

  if (usuarioTrim.length < 3) {
    return res.json({ success: false, message: 'Usuario debe tener al menos 3 caracteres' });
  }

  if (passwordTrim.length < 4) {
    return res.json({ success: false, message: 'Contraseña debe tener al menos 4 caracteres' });
  }

  db.query(
    'SELECT id, usuario, rol, password FROM usuarios WHERE usuario = ?',
    [usuarioTrim],
    (err, result) => {
      if (err) {
        console.log(err);
        return res.json({ success: false, message: 'Error del servidor' });
      }
      if (result.length > 0 && bcrypt.compareSync(passwordTrim, result[0].password)) {
        res.json({
          success: true,
          id: result[0].id,
          usuario: result[0].usuario,
          rol: result[0].rol
        });
      } else {
        res.json({ success: false, message: 'Usuario o contraseña incorrectos' });
      }
    }
  );
});

module.exports = router;
