const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/ofertas', (req, res) => {
  const sql = `
    SELECT o.*,
      (SELECT JSON_ARRAYAGG(
        JSON_OBJECT('id', oi.id, 'producto_id', oi.producto_id, 'presentacion_id', oi.presentacion_id,
                    'cantidad', oi.cantidad, 'producto_nombre', p.nombre, 'presentacion_nombre', c.nombre)
      ) FROM oferta_items oi
        LEFT JOIN productos p ON oi.producto_id = p.id
        LEFT JOIN presentaciones pr ON oi.presentacion_id = pr.id
        LEFT JOIN categorias c ON pr.categoria_id = c.id
      WHERE oi.oferta_id = o.id) AS items
    FROM ofertas o
    ORDER BY o.fecha_creacion DESC
  `;
  db.query(sql, (err, result) => {
    if (err) return res.json([]);
    res.json(result.map(o => ({ ...o, items: o.items || [] })));
  });
});

router.get('/ofertas/catalogo', (req, res) => {
  const sql = `
    SELECT o.id, o.nombre, o.precio_oferta,
      (SELECT JSON_ARRAYAGG(
        JSON_OBJECT('producto_id', oi.producto_id, 'presentacion_id', oi.presentacion_id, 'producto_nombre', p.nombre, 'presentacion_nombre', c.nombre, 'cantidad', oi.cantidad)
      ) FROM oferta_items oi
        LEFT JOIN productos p ON oi.producto_id = p.id
        LEFT JOIN presentaciones pr ON oi.presentacion_id = pr.id
        LEFT JOIN categorias c ON pr.categoria_id = c.id
      WHERE oi.oferta_id = o.id) AS items
    FROM ofertas o
    WHERE o.activa = 1
    ORDER BY o.fecha_creacion DESC
  `;
  db.query(sql, (err, result) => {
    if (err) return res.json([]);
    res.json(result.map(o => ({ ...o, items: o.items || [] })));
  });
});

router.post('/ofertas', (req, res) => {
  const { nombre, precio_oferta, items } = req.body;
  if (!nombre || !precio_oferta || !items || items.length === 0) {
    return res.json({ success: false, message: 'Complete todos los campos' });
  }

  db.query('INSERT INTO ofertas (nombre, precio_oferta) VALUES (?, ?)',
    [nombre, precio_oferta],
    (err, result) => {
      if (err) return res.json({ success: false, message: 'Error al crear oferta' });
      const ofertaId = result.insertId;
      let pendientes = items.length;
      let errores = [];

      items.forEach(item => {
        db.query('INSERT INTO oferta_items (oferta_id, producto_id, presentacion_id, cantidad) VALUES (?, ?, ?, ?)',
          [ofertaId, item.producto_id, item.presentacion_id, item.cantidad || 1],
          (err2) => {
            if (err2) errores.push(err2);
            pendientes--;
            if (pendientes <= 0) {
              if (errores.length > 0) {
                return res.json({ success: false, message: 'Error al guardar items' });
              }
              res.json({ success: true, id: ofertaId });
            }
          }
        );
      });
    }
  );
});

router.put('/ofertas/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { nombre, precio_oferta, activa, items } = req.body;

  db.query('UPDATE ofertas SET nombre = ?, precio_oferta = ?, activa = ? WHERE id = ?',
    [nombre, precio_oferta, activa ?? 1, id],
    (err) => {
      if (err) return res.json({ success: false, message: 'Error al actualizar' });
      if (items) {
        db.query('DELETE FROM oferta_items WHERE oferta_id = ?', [id], () => {
          let pendientes = items.length;
          items.forEach(item => {
            db.query('INSERT INTO oferta_items (oferta_id, producto_id, presentacion_id, cantidad) VALUES (?, ?, ?, ?)',
              [id, item.producto_id, item.presentacion_id, item.cantidad || 1],
              () => {
                pendientes--;
                if (pendientes <= 0) res.json({ success: true });
              }
            );
          });
        });
      } else {
        res.json({ success: true });
      }
    }
  );
});

router.delete('/ofertas/:id', (req, res) => {
  const id = parseInt(req.params.id);
  db.query('DELETE FROM ofertas WHERE id = ?', [id], (err) => {
    if (err) return res.json({ success: false });
    res.json({ success: true });
  });
});

module.exports = router;
