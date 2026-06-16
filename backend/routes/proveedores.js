const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/proveedores', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  if (page < 1 || limit < 1 || limit > 100) {
    return res.json({ data: [], total: 0 });
  }

  db.query('SELECT COUNT(*) AS total FROM proveedores', (err, countResult) => {
    if (err) {
      console.log(err);
      return res.json({ data: [], total: 0 });
    }

    db.query(
      'SELECT * FROM proveedores ORDER BY id DESC LIMIT ? OFFSET ?',
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

router.post('/proveedores', (req, res) => {
  const { nombreEmpresa, ruc, telefono, correo, direccion } = req.body;

  if (!nombreEmpresa || !nombreEmpresa.trim()) {
    return res.json({ success: false, message: 'Nombre de empresa es requerido' });
  }

  if (!ruc || typeof ruc !== 'string' || !/^\d{11}$/.test(ruc)) {
    return res.json({ success: false, message: 'RUC debe tener 11 dígitos numéricos' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (correo && !emailRegex.test(correo)) {
    return res.json({ success: false, message: 'Correo electrónico inválido' });
  }

  db.query(
    'SELECT id FROM proveedores WHERE ruc = ?',
    [ruc],
    (err, exists) => {
      if (err) {
        console.log(err);
        return res.json({ success: false, message: 'Error del servidor' });
      }
      if (exists.length > 0) {
        return res.json({ success: false, message: 'El RUC ya está registrado' });
      }

      db.query(
        'INSERT INTO proveedores (nombre_empresa, ruc, telefono, correo, direccion) VALUES (?, ?, ?, ?, ?)',
        [nombreEmpresa.trim(), ruc, telefono || null, correo || null, direccion || null],
        (err2, result) => {
          if (err2) {
            console.log(err2);
            return res.json({ success: false, message: 'Error al registrar proveedor' });
          }
          res.json({ success: true });
        }
      );
    }
  );
});

router.get('/proveedores/:id', (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id) || id < 1) {
    return res.json(null);
  }

  db.query('SELECT * FROM proveedores WHERE id = ?', [id], (err, result) => {
    if (err) {
      console.log(err);
      return res.json(null);
    }
    if (result.length === 0) {
      return res.json(null);
    }
    res.json(result[0]);
  });
});

router.put('/proveedores/:id', (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id) || id < 1) {
    return res.json({ success: false, message: 'ID inválido' });
  }

  const { nombreEmpresa, ruc, telefono, correo, direccion } = req.body;

  if (!nombreEmpresa || !nombreEmpresa.trim()) {
    return res.json({ success: false, message: 'Nombre de empresa es requerido' });
  }

  if (!ruc || typeof ruc !== 'string' || !/^\d{11}$/.test(ruc)) {
    return res.json({ success: false, message: 'RUC debe tener 11 dígitos numéricos' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (correo && !emailRegex.test(correo)) {
    return res.json({ success: false, message: 'Correo electrónico inválido' });
  }

  db.query('SELECT id FROM proveedores WHERE ruc = ? AND id != ?', [ruc, id], (err, exists) => {
    if (err) {
      console.log(err);
      return res.json({ success: false, message: 'Error del servidor' });
    }
    if (exists.length > 0) {
      return res.json({ success: false, message: 'El RUC ya está registrado en otro proveedor' });
    }

    db.query(
      'UPDATE proveedores SET nombre_empresa = ?, ruc = ?, telefono = ?, correo = ?, direccion = ? WHERE id = ?',
      [nombreEmpresa.trim(), ruc, telefono || null, correo || null, direccion || null, id],
      (err2) => {
        if (err2) {
          console.log(err2);
          return res.json({ success: false, message: 'Error al actualizar proveedor' });
        }
        res.json({ success: true });
      }
    );
  });
});

router.delete('/proveedores/:id', (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id) || id < 1) {
    return res.json({ success: false, message: 'ID inválido' });
  }

  db.query('SELECT id FROM productos WHERE proveedor_id = ? LIMIT 1', [id], (err, productos) => {
    if (err) {
      console.log(err);
      return res.json({ success: false, message: 'Error del servidor' });
    }
    if (productos.length > 0) {
      return res.json({ success: false, message: 'No se puede eliminar porque tiene productos asociados' });
    }

    db.query('DELETE FROM proveedores WHERE id = ?', [id], (err2) => {
      if (err2) {
        console.log(err2);
        return res.json({ success: false, message: 'Error al eliminar proveedor' });
      }
      res.json({ success: true });
    });
  });
});

module.exports = router;
