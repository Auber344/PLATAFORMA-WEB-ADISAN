const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/categorias', (req, res) => {
  db.query('SELECT * FROM categorias ORDER BY nombre ASC', (err, result) => {
    if (err) {
      console.log(err);
      return res.json([]);
    }
    res.json(result);
  });
});

router.post('/categorias', (req, res) => {
  const { nombre, factor } = req.body;

  if (!nombre || !nombre.trim()) {
    return res.json({ success: false, message: 'Nombre de categoría requerido' });
  }

  const factorNum = parseInt(factor);
  if (isNaN(factorNum) || factorNum < 1) {
    return res.json({ success: false, message: 'Factor debe ser un número mayor a 0' });
  }

  db.query(
    'INSERT INTO categorias (nombre, factor) VALUES (?, ?)',
    [nombre.trim(), factorNum],
    (err, result) => {
      if (err) {
        console.log(err);
        return res.json({ success: false, message: 'Error al crear categoría' });
      }
      res.json({ success: true });
    }
  );
});

router.put('/categorias/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { nombre, factor } = req.body;

  if (isNaN(id) || id < 1) {
    return res.json({ success: false, message: 'ID inválido' });
  }

  if (!nombre || !nombre.trim()) {
    return res.json({ success: false, message: 'Nombre de categoría requerido' });
  }

  const factorNum = parseInt(factor);
  if (isNaN(factorNum) || factorNum < 1) {
    return res.json({ success: false, message: 'Factor debe ser un número mayor a 0' });
  }

  db.query(
    'UPDATE categorias SET nombre = ?, factor = ? WHERE id = ?',
    [nombre.trim(), factorNum, id],
    (err, result) => {
      if (err) {
        console.log(err);
        return res.json({ success: false, message: 'Error al actualizar' });
      }
      res.json({ success: true });
    }
  );
});

router.delete('/categorias/:id', (req, res) => {
  const id = parseInt(req.params.id);

  if (isNaN(id) || id < 1) {
    return res.json({ success: false, message: 'ID inválido' });
  }

  db.query('DELETE FROM categorias WHERE id = ?', [id], (err, result) => {
    if (err) {
      console.log(err);
      return res.json({ success: false, message: 'Error al eliminar' });
    }
    res.json({ success: true });
  });
});

module.exports = router;
