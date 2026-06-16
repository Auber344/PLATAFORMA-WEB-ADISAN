const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/dashboard', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 5;
  const offset = (page - 1) * limit;

  if (page < 1) {
    return res.json({
      totalProductos: 0, totalUsuarios: 0, totalPedidos: 0,
      totalVentas: 0, ultimosProductos: [], totalPaginas: 0, currentPage: 1
    });
  }

  const queries = {
    totalProductos: 'SELECT COUNT(*) AS total FROM productos',
    totalUsuarios: 'SELECT COUNT(*) AS total FROM usuarios',
    totalPedidos: 'SELECT COUNT(*) AS total FROM pedidos',
    totalVentas: 'SELECT IFNULL(SUM(total),0) AS totalVentas FROM pedidos',
    ultimos: 'SELECT p.nombre, pr.stock, pr.precio_venta, c.nombre AS categoria FROM productos p LEFT JOIN presentaciones pr ON p.id = pr.producto_id LEFT JOIN categorias c ON pr.categoria_id = c.id ORDER BY p.id DESC LIMIT ? OFFSET ?',
    totalPresentaciones: 'SELECT COUNT(*) AS total FROM presentaciones',
    ventasProducto: 'SELECT pr.nombre, SUM(dp.cantidad) AS total_vendido, SUM(dp.subtotal) AS total_ingreso FROM detalle_pedido dp LEFT JOIN productos pr ON dp.producto_id = pr.id GROUP BY pr.id, pr.nombre ORDER BY total_vendido DESC'
  };

  db.query(queries.totalProductos, (err, productos) => {
    if (err) return res.json(err);
    db.query(queries.totalUsuarios, (err2, usuarios) => {
      if (err2) return res.json(err2);
      db.query(queries.totalPedidos, (err3, pedidos) => {
        if (err3) return res.json(err3);
        db.query(queries.totalVentas, (err4, ventas) => {
          if (err4) return res.json(err4);
          db.query(queries.ultimos, [limit, offset], (err5, ultimos) => {
            if (err5) return res.json(err5);
            db.query(queries.totalPresentaciones, (err6, totalResult) => {
              if (err6) return res.json(err6);
              db.query(queries.ventasProducto, (err7, ventasProducto) => {
                if (err7) return res.json(err7);
                res.json({
                  totalProductos: productos[0].total,
                  totalUsuarios: usuarios[0].total,
                  totalPedidos: pedidos[0].total,
                  totalVentas: ventas[0].totalVentas,
                  ultimosProductos: ultimos,
                  ventasProducto: ventasProducto,
                  totalPaginas: Math.ceil(totalResult[0].total / limit),
                  currentPage: page
                });
              });
            });
          });
        });
      });
    });
  });
});

module.exports = router;
