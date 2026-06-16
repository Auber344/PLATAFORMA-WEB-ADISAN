const express = require('express');
const router = express.Router();
const db = require('../db');
const { generarBoletaPDF } = require('../pdf/boleta');
const { generarFacturaPDF } = require('../pdf/factura');

const ESTADOS_VALIDOS = ['pendiente', 'aceptado', 'en_camino', 'entregado'];
const METODOS_PAGO_VALIDOS = ['Yape', 'Tarjeta', 'Efectivo'];

router.post('/pedidos', (req, res) => {
  const { cliente_id, metodo_pago, total, carrito } = req.body;

  const clienteId = parseInt(cliente_id);
  if (isNaN(clienteId) || clienteId < 1) {
    return res.json({ success: false, message: 'Cliente inválido' });
  }

  if (!metodo_pago || !METODOS_PAGO_VALIDOS.includes(metodo_pago)) {
    return res.json({ success: false, message: 'Método de pago inválido' });
  }

  const totalNum = parseFloat(total);
  if (isNaN(totalNum) || totalNum <= 0) {
    return res.json({ success: false, message: 'Total inválido' });
  }

  if (!carrito || !Array.isArray(carrito) || carrito.length === 0) {
    return res.json({ success: false, message: 'Carrito vacío' });
  }

  for (const item of carrito) {
    if (item.es_oferta) continue;
    if (!item.producto_id || !item.presentacion_id || !item.cantidad || !item.precio) {
      return res.json({ success: false, message: 'Datos de producto incompletos' });
    }
    if (parseInt(item.cantidad) < 1) {
      return res.json({ success: false, message: 'Cantidad inválida' });
    }
    if (parseFloat(item.precio) < 0) {
      return res.json({ success: false, message: 'Precio inválido' });
    }
  }

  db.query(
    'SELECT id FROM usuarios WHERE id = ?',
    [clienteId],
    (err, userExists) => {
      if (err || !userExists || userExists.length === 0) {
        return res.json({ success: false, message: 'Cliente no encontrado' });
      }

      db.query(
        'INSERT INTO pedidos (cliente_id, total, metodo_pago, estado) VALUES (?, ?, ?, ?)',
        [clienteId, totalNum, metodo_pago, 'pendiente'],
        (err2, result) => {
          if (err2) {
            console.log(err2);
            return res.json({ success: false, message: 'Error al crear pedido' });
          }

          const pedidoId = result.insertId;
          let errores = [];
          let pendientes = carrito.length;

          carrito.forEach(item => {
            const cantidad = parseInt(item.cantidad);
            const precio = parseFloat(item.precio);
            const subtotal = precio * cantidad;
            const productoId = parseInt(item.producto_id);
            const presentacionId = parseInt(item.presentacion_id);
            const nombreOferta = item.nombre_oferta || null;

            const sqlInsert = nombreOferta
              ? 'INSERT INTO detalle_pedido (pedido_id, producto_id, presentacion_id, cantidad, precio, subtotal, nombre_oferta) VALUES (?, ?, ?, ?, ?, ?, ?)'
              : 'INSERT INTO detalle_pedido (pedido_id, producto_id, presentacion_id, cantidad, precio, subtotal) VALUES (?, ?, ?, ?, ?, ?)';
            const params = nombreOferta
              ? [pedidoId, productoId, presentacionId, cantidad, precio, subtotal, nombreOferta]
              : [pedidoId, productoId, presentacionId, cantidad, precio, subtotal];

            db.query(sqlInsert, params, (errDet) => {
              if (errDet) {
                console.log(errDet);
                errores.push(errDet);
              }

              // Items resumen (oferta) no descuentan stock
              if (item.es_resumen) {
                checkDone();
                return;
              }

                db.query('SELECT * FROM presentaciones WHERE id = ?', [presentacionId], (errPres, presentacionResult) => {
                  if (errPres || !presentacionResult || presentacionResult.length === 0) {
                    errores.push('Presentación no encontrada');
                    checkDone();
                    return;
                  }

                  const presentacion = presentacionResult[0];

                  if (parseInt(presentacion.stock) < cantidad) {
                    errores.push(`Stock insuficiente para presentación ${presentacionId}`);
                    checkDone();
                    return;
                  }

                  db.query('UPDATE presentaciones SET stock = stock - ? WHERE id = ?', [cantidad, presentacionId]);

                  db.query('SELECT * FROM presentaciones WHERE padre_id = ?', [presentacionId], (errHijos, hijos) => {
                    if (!errHijos && hijos) {
                      hijos.forEach(hijo => {
                        const descuento = cantidad * (parseInt(presentacion.factor) || 1);
                        db.query('UPDATE presentaciones SET stock = stock - ? WHERE id = ?', [descuento, hijo.id]);
                      });
                    }

                    if (presentacion.padre_id) {
                      db.query('SELECT * FROM presentaciones WHERE id = ?', [presentacion.padre_id], (errPadre, padreResult) => {
                        if (!errPadre && padreResult && padreResult.length > 0) {
                          const padre = padreResult[0];
                          const descuentoPadre = Math.floor(cantidad / (parseInt(presentacion.factor) || 1));
                          if (descuentoPadre > 0) {
                            db.query('UPDATE presentaciones SET stock = stock - ? WHERE id = ?', [descuentoPadre, padre.id]);
                          }
                        }
                        checkDone();
                      });
                    } else {
                      checkDone();
                    }
                  });
                });
              }
            );
          });

          function checkDone() {
            pendientes--;
            if (pendientes <= 0) {
              if (errores.length > 0) {
                return res.json({ success: false, message: 'Error al procesar: ' + errores[0] });
              }
              res.json({ success: true, pedidoId });
            }
          }
        }
      );
    }
  );
});

router.get('/pedidos', (req, res) => {
  const rol = req.query.rol;
  const cliente_id = req.query.cliente_id;
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = 10;
  const offset = (page - 1) * limit;

  db.query(
    "UPDATE pedidos SET estado = 'entregado' WHERE estado = 'en_camino' AND fecha_estimada_entrega IS NOT NULL AND fecha_estimada_entrega <= NOW()",
    (errMigrate) => {
      if (errMigrate) console.log(errMigrate);

      let countSql = 'SELECT COUNT(*) AS total FROM pedidos p';
      let sql = `
        SELECT p.id, u.nombres AS cliente, p.total, p.metodo_pago, p.estado,
               p.fecha, p.fecha_estimada_entrega
        FROM pedidos p
        LEFT JOIN usuarios u ON p.cliente_id = u.id
      `;
      let countParams = [];
      let params = [];

      if (rol === 'cliente') {
        const clienteId = parseInt(cliente_id);
        if (isNaN(clienteId) || clienteId < 1) {
          return res.json({ data: [], totalPages: 0, currentPage: 1, total: 0 });
        }
        const where = ' WHERE p.cliente_id = ?';
        countSql += where;
        sql += where;
        countParams.push(clienteId);
        params.push(clienteId);
      }

      sql += ' ORDER BY p.id DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      db.query(countSql, countParams, (errCount, countResult) => {
        if (errCount) return res.json([]);
        const total = countResult[0].total;
        const totalPages = Math.ceil(total / limit);

        db.query(sql, params, (err, result) => {
          if (err) {
            console.log(err);
            return res.json([]);
          }
          res.json({ data: result, totalPages, currentPage: page, total });
        });
      });
    }
  );
});

router.get('/pedidos/check-updates', (req, res) => {
  const cliente_id = parseInt(req.query.cliente_id);
  const desde = req.query.desde;

  if (isNaN(cliente_id) || !desde) {
    return res.json({ cambios: [] });
  }

  const sql = `
    SELECT id, estado
    FROM pedidos
    WHERE cliente_id = ? AND updated_at > ?
    ORDER BY id DESC
  `;

  db.query(sql, [cliente_id, desde], (err, result) => {
    if (err) {
      console.log(err);
      return res.json({ cambios: [] });
    }
    res.json({ cambios: result });
  });
});

router.get('/pedidos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id) || id < 1) {
    return res.json([]);
  }

  const sql = `
    SELECT
      dp.id,
      dp.cantidad,
      dp.precio,
      dp.subtotal,
      dp.nombre_oferta,
      pr.nombre
    FROM detalle_pedido dp
    LEFT JOIN productos pr ON dp.producto_id = pr.id
    WHERE dp.pedido_id = ?
  `;

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.log(err);
      return res.json([]);
    }
    res.json(result);
  });
});

router.put('/pedidos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id) || id < 1) {
    return res.json({ success: false, message: 'ID inválido' });
  }

  const { estado, fecha_estimada_entrega } = req.body;

  if (!estado || !ESTADOS_VALIDOS.includes(estado)) {
    return res.json({ success: false, message: 'Estado inválido' });
  }

  let sql = 'UPDATE pedidos SET estado = ?';
  let params = [estado];

  if (estado === 'en_camino' && fecha_estimada_entrega) {
    sql += ', fecha_estimada_entrega = ?';
    params.push(fecha_estimada_entrega);
  } else if (estado === 'entregado') {
    sql += ', fecha_estimada_entrega = NULL';
  }

  sql += ' WHERE id = ?';
  params.push(id);

  db.query(sql, params, (err) => {
    if (err) {
      console.log(err);
      return res.json({ success: false, message: 'Error al actualizar' });
    }
    res.json({ success: true });
  });
});

router.get('/pedidos-pdf/:id', generarBoletaPDF);
router.get('/pedidos-factura/:id', generarFacturaPDF);

module.exports = router;
