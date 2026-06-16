const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/productos', (req, res) => {
  const all = req.query.all == 1;

  const sql = `
    SELECT
      p.id AS producto_id,
      p.nombre AS producto_nombre,
      pr.id AS presentacion_id,
      pr.padre_id,
      pr.nivel,
      pr.factor,
      pr.stock,
      pr.precio_compra,
      pr.precio_venta,
      c.nombre AS categoria,
      pv.nombre_empresa AS proveedor
    FROM productos p
    LEFT JOIN presentaciones pr ON p.id = pr.producto_id
    LEFT JOIN categorias c ON pr.categoria_id = c.id
    LEFT JOIN proveedores pv ON p.proveedor_id = pv.id
    ORDER BY p.id DESC, pr.nivel ASC
  `;

  if (all) {
    db.query(sql, (err, result) => {
      if (err) {
        console.log(err);
        return res.json([]);
      }
      res.json({ data: result, total: result.length, totalPages: 1, currentPage: 1 });
    });
    return;
  }

  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const offset = (page - 1) * limit;

  if (page < 1) {
    return res.json({ data: [], total: 0, totalPages: 0, currentPage: 1 });
  }

  db.query('SELECT COUNT(*) AS total FROM productos', (errTotal, totalResult) => {
    if (errTotal) {
      console.log(errTotal);
      return res.json({ data: [], total: 0, totalPages: 0, currentPage: 1 });
    }

    const total = totalResult[0].total;

    db.query(sql + ' LIMIT ? OFFSET ?', [limit, offset], (err, result) => {
      if (err) {
        console.log(err);
        return res.json({ data: [], total: 0, totalPages: 0, currentPage: 1 });
      }
      res.json({
        data: result,
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page
      });
    });
  });
});

router.get('/productos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id) || id < 1) {
    return res.json([]);
  }

  const sql = `
    SELECT
      p.id AS producto_id,
      p.nombre AS producto_nombre,
      p.proveedor_id,
      pv.nombre_empresa AS proveedor_nombre,
      pr.id AS presentacion_id,
      pr.categoria_id,
      pr.padre_id,
      pr.nivel,
      pr.factor,
      pr.stock,
      pr.precio_compra,
      pr.precio_venta,
      c.nombre AS categoria
    FROM productos p
    LEFT JOIN presentaciones pr ON p.id = pr.producto_id
    LEFT JOIN categorias c ON pr.categoria_id = c.id
    LEFT JOIN proveedores pv ON p.proveedor_id = pv.id
    WHERE p.id = ?
    ORDER BY pr.nivel ASC
  `;

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.log(err);
      return res.json([]);
    }
    res.json(result);
  });
});

router.get('/categorias', (req, res) => {
  db.query('SELECT * FROM categorias', (err, result) => {
    res.json(result || []);
  });
});

router.post('/productos', (req, res) => {
  const { nombre, proveedor_id, presentaciones } = req.body;

  if (!nombre || !nombre.trim()) {
    return res.json({ success: false, message: 'Nombre del producto requerido' });
  }

  const proveedorId = parseInt(proveedor_id);
  if (isNaN(proveedorId) || proveedorId < 1) {
    return res.json({ success: false, message: 'Proveedor inválido' });
  }

  if (!presentaciones || !Array.isArray(presentaciones) || presentaciones.length === 0) {
    return res.json({ success: false, message: 'Debe tener al menos una presentación' });
  }

  const nombreTrim = nombre.trim();

  db.query('SELECT * FROM productos WHERE nombre = ?', [nombreTrim], (err, existe) => {
    if (err) {
      console.log(err);
      return res.json({ success: false, message: 'Error del servidor' });
    }

    if (existe.length > 0) {
      const productoId = existe[0].id;
      actualizarStockProducto(productoId, presentaciones, res);
    } else {
      db.query(
        'INSERT INTO productos (nombre, proveedor_id) VALUES (?, ?)',
        [nombreTrim, proveedorId],
        (err2, result) => {
          if (err2) {
            console.log(err2);
            return res.json({ success: false, message: 'Error al crear producto' });
          }
          guardarPresentaciones(result.insertId, presentaciones, res);
        }
      );
    }
  });
});

function guardarPresentaciones(productoId, presentaciones, res) {
  const idsGenerados = {};

  function validarPresentacion(pr) {
    const catId = parseInt(pr.categoria_id);
    const factor = parseInt(pr.factor) || 1;
    const stock = parseInt(pr.stock) || 0;
    const precioCompra = parseFloat(pr.precio_compra) || 0;
    const precioVenta = parseFloat(pr.precio_venta) || 0;
    const nivel = parseInt(pr.nivel) || 1;

    if (isNaN(catId) || catId < 1) return null;
    if (precioCompra < 0 || precioVenta < 0) return null;
    if (stock < 0) return null;
    if (factor < 1) return null;

    return { catId, factor, stock, precioCompra, precioVenta, nivel };
  }

  function insertarNivel(index) {
    if (index >= presentaciones.length) {
      return res.json({ success: true });
    }

    const pr = presentaciones[index];
    const valid = validarPresentacion(pr);
    if (!valid) {
      return res.json({ success: false, message: 'Datos de presentación inválidos' });
    }

    let padreReal = null;
    if (pr.padre_temp !== null && pr.padre_temp !== undefined) {
      padreReal = idsGenerados[pr.padre_temp] || null;
    }

    db.query(
      'INSERT INTO presentaciones (producto_id, categoria_id, padre_id, nivel, factor, stock, precio_compra, precio_venta) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [productoId, valid.catId, padreReal, valid.nivel, valid.factor, valid.stock, valid.precioCompra, valid.precioVenta],
      (err, result) => {
        if (err) {
          console.log(err);
          return res.json({ success: false, message: 'Error al guardar presentación' });
        }
        idsGenerados[pr.temp_id] = result.insertId;
        insertarNivel(index + 1);
      }
    );
  }

  insertarNivel(0);
}

function actualizarStockProducto(productoId, presentaciones, res) {
  let total = presentaciones.length;
  let completados = 0;

  presentaciones.forEach(pr => {
    const catId = parseInt(pr.categoria_id);
    const stock = parseInt(pr.stock) || 0;
    const nivel = parseInt(pr.nivel) || 1;
    const factor = parseInt(pr.factor) || 1;
    const precioCompra = parseFloat(pr.precio_compra) || 0;
    const precioVenta = parseFloat(pr.precio_venta) || 0;

    if (isNaN(catId) || catId < 1 || stock < 0) {
      completados++;
      if (completados >= total) {
        if (typeof res.json === 'function') res.json({ success: true });
      }
      return;
    }

    db.query(
      'SELECT * FROM presentaciones WHERE producto_id = ? AND categoria_id = ? AND nivel = ?',
      [productoId, catId, nivel],
      (err, existe) => {
        if (existe && existe.length > 0) {
          db.query(
            'UPDATE presentaciones SET stock = stock + ?, precio_compra = ?, precio_venta = ? WHERE id = ?',
            [stock, precioCompra, precioVenta, existe[0].id],
            finalizar
          );
        } else {
          db.query(
            'INSERT INTO presentaciones (producto_id, categoria_id, padre_id, nivel, factor, stock, precio_compra, precio_venta) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [productoId, catId, null, nivel, factor, stock, precioCompra, precioVenta],
            finalizar
          );
        }

        function finalizar() {
          completados++;
          if (completados >= total) {
            if (typeof res.json === 'function') res.json({ success: true });
          }
        }
      }
    );
  });
}

router.put('/productos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id) || id < 1) {
    return res.json({ success: false, message: 'ID inválido' });
  }

  const { nombre, proveedor_id, presentaciones } = req.body;

  if (!nombre || !nombre.trim()) {
    return res.json({ success: false, message: 'Nombre del producto requerido' });
  }

  const proveedorId = parseInt(proveedor_id);
  if (isNaN(proveedorId) || proveedorId < 1) {
    return res.json({ success: false, message: 'Proveedor inválido' });
  }

  db.query(
    'UPDATE productos SET nombre = ?, proveedor_id = ? WHERE id = ?',
    [nombre.trim(), proveedorId, id],
    (err) => {
      if (err) {
        console.log(err);
        return res.json({ success: false, message: 'Error al actualizar' });
      }

      db.query('DELETE FROM presentaciones WHERE producto_id = ?', [id], () => {
        guardarPresentaciones(id, presentaciones || [], res);
      });
    }
  );
});

router.delete('/productos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id) || id < 1) {
    return res.json({ success: false, message: 'ID inválido' });
  }

  db.query('DELETE FROM presentaciones WHERE producto_id = ?', [id], (err) => {
    if (err) {
      console.log(err);
      return res.json({ success: false, message: 'Error al eliminar' });
    }

    db.query('DELETE FROM productos WHERE id = ?', [id], (err2) => {
      if (err2) {
        console.log(err2);
        return res.json({ success: false, message: 'Error al eliminar' });
      }
      res.json({ success: true });
    });
  });
});

router.get('/catalogo', (req, res) => {
  db.query(`
    SELECT
      p.id AS producto_id,
      p.nombre,
      pr.id AS presentacion_id,
      pr.stock,
      pr.precio_venta,
      pr.factor,
      pr.nivel,
      c.nombre AS categoria
    FROM productos p
    LEFT JOIN presentaciones pr ON p.id = pr.producto_id
    LEFT JOIN categorias c ON pr.categoria_id = c.id
    ORDER BY p.id DESC, pr.nivel ASC
  `, (err, result) => {
    if (err) {
      console.log(err);
      return res.json([]);
    }
    res.json(result);
  });
});

module.exports = router;
