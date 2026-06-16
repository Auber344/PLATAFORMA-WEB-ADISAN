import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from db import conectar
from datetime import datetime

def consultar_stock():
    conexion = conectar()
    cursor = conexion.cursor(dictionary=True)
    cursor.execute("""
        SELECT p.nombre, pr.stock, pr.precio_venta, c.nombre AS categoria
        FROM productos p
        JOIN presentaciones pr ON p.id = pr.producto_id
        JOIN categorias c ON pr.categoria_id = c.id
        WHERE pr.nivel = 1
        ORDER BY p.nombre
        LIMIT 10
    """)
    datos = cursor.fetchall()
    conexion.close()
    if not datos:
        return "No hay productos registrados en el sistema."
    respuesta = "📦 *Productos disponibles:*\n\n"
    for d in datos:
        estado = "✅ En stock" if d['stock'] > 0 else "❌ Sin stock"
        respuesta += f"• {d['nombre']} ({d['categoria']}) - S/ {d['precio_venta']:.2f} - {estado}\n"
    respuesta += "\n¿Quieres consultar el precio o stock de algún producto en específico?"
    return respuesta

def consultar_productos():
    conexion = conectar()
    cursor = conexion.cursor(dictionary=True)
    cursor.execute("""
        SELECT DISTINCT p.nombre
        FROM productos p
        ORDER BY p.nombre
        LIMIT 20
    """)
    datos = cursor.fetchall()
    conexion.close()
    if not datos:
        return "No hay productos registrados aún."
    respuesta = "📋 *Nuestros productos:*\n\n"
    for d in datos:
        respuesta += f"• {d['nombre']}\n"
    respuesta += "\n¿Te interesa algún producto en particular? Pregúntame por su precio o stock. O puedo <a href=\"catalogo.html\">mostrarte el catálogo completo</a>."
    return respuesta

def consultar_precio():
    conexion = conectar()
    cursor = conexion.cursor(dictionary=True)
    cursor.execute("""
        SELECT p.nombre, pr.precio_venta, c.nombre AS categoria
        FROM productos p
        JOIN presentaciones pr ON p.id = pr.producto_id
        JOIN categorias c ON pr.categoria_id = c.id
        WHERE pr.nivel = 1
        ORDER BY p.nombre
        LIMIT 10
    """)
    datos = cursor.fetchall()
    conexion.close()
    if not datos:
        return "No hay productos registrados aún."
    respuesta = "💰 *Precios:*\n\n"
    for d in datos:
        respuesta += f"• {d['nombre']} ({d['categoria']}): S/ {d['precio_venta']:.2f}\n"
    respuesta += "\nPuedes ver todos los productos en el <a href=\"catalogo.html\">catálogo aquí</a>."
    return respuesta

def consultar_pedido_estado(cliente_id=None):
    if not cliente_id:
        return "Para consultar tu pedido necesito que inicies sesión primero."
    conexion = conectar()
    cursor = conexion.cursor(dictionary=True)
    cursor.execute("""
        SELECT id, total, estado, fecha, fecha_estimada_entrega
        FROM pedidos
        WHERE cliente_id = %s
        ORDER BY id DESC
        LIMIT 5
    """, (cliente_id,))
    datos = cursor.fetchall()
    conexion.close()
    if not datos:
        return "No tienes pedidos registrados. Si quieres comprar, <a href=\"catalogo.html\">visita nuestro catálogo</a>."
    respuesta = "📋 *Tus pedidos:*\n\n"
    for d in datos:
        estado_texto = d['estado'].replace('_', ' ').title()
        emoji = {'pendiente': '⏳', 'aceptado': '✅', 'en_camino': '🚛', 'entregado': '📦'}
        e = emoji.get(d['estado'], '📋')
        respuesta += f"{e} *Pedido #{d['id']}* - S/ {d['total']:.2f}\n   Estado: {estado_texto}\n   Fecha: {d['fecha'].strftime('%d/%m/%Y')}\n"
        if d['fecha_estimada_entrega']:
            respuesta += f"   🚛 Llegada estimada: {d['fecha_estimada_entrega'].strftime('%d/%m/%Y %I:%M %p')}\n"
        respuesta += "\n"
    respuesta += "<a href=\"pedidos.html\">Ver todos mis pedidos</a>"
    return respuesta

def consultar_pedido_llegada(cliente_id=None):
    if not cliente_id:
        return "Para consultar la llegada de tu pedido necesito que inicies sesión."
    conexion = conectar()
    cursor = conexion.cursor(dictionary=True)
    cursor.execute("""
        SELECT id, fecha_estimada_entrega, estado
        FROM pedidos
        WHERE cliente_id = %s AND estado = 'en_camino'
        ORDER BY id DESC
        LIMIT 3
    """, (cliente_id,))
    datos = cursor.fetchall()
    conexion.close()
    if not datos:
        return "No tienes pedidos en camino actualmente. Si tienes pedidos pendientes, el administrador los procesará pronto. <a href=\"pedidos.html\">Ver mis pedidos</a>"
    respuesta = "🚛 *Pedidos en camino:*\n\n"
    for d in datos:
        if d['fecha_estimada_entrega']:
            respuesta += f"📦 Pedido #{d['id']} - Llegada estimada: {d['fecha_estimada_entrega'].strftime('%d/%m/%Y %I:%M %p')}\n"
        else:
            respuesta += f"📦 Pedido #{d['id']} - En camino, fecha estimada próximamente.\n"
    return respuesta

def consultar_pedido_enviado(cliente_id=None):
    if not cliente_id:
        return "Para consultar el envío necesito que inicies sesión."
    conexion = conectar()
    cursor = conexion.cursor(dictionary=True)
    cursor.execute("""
        SELECT id, estado, fecha_estimada_entrega
        FROM pedidos
        WHERE cliente_id = %s AND (estado = 'en_camino' OR estado = 'entregado')
        ORDER BY id DESC
        LIMIT 3
    """, (cliente_id,))
    datos = cursor.fetchall()
    conexion.close()
    if not datos:
        return "Aún no tienes pedidos enviados. Cuando el administrador procese tu pedido te avisaremos."
    respuesta = ""
    for d in datos:
        if d['estado'] == 'entregado':
            respuesta += f"✅ *Pedido #{d['id']}* - ¡Ya fue entregado!\n"
        elif d['estado'] == 'en_camino':
            respuesta += f"🚛 *Pedido #{d['id']}* - ¡Sí, fue enviado! Está en camino.\n"
            if d['fecha_estimada_entrega']:
                respuesta += f"   Llegará el {d['fecha_estimada_entrega'].strftime('%d/%m/%Y %I:%M %p')}\n"
    return respuesta

def consultar_ofertas():
    conexion = conectar()
    cursor = conexion.cursor(dictionary=True)
    cursor.execute("""
        SELECT o.id, o.nombre, o.precio_oferta,
            (SELECT JSON_ARRAYAGG(
                JSON_OBJECT('producto_nombre', p.nombre, 'presentacion_nombre', c.nombre, 'cantidad', oi.cantidad)
            ) FROM oferta_items oi
                LEFT JOIN productos p ON oi.producto_id = p.id
                LEFT JOIN presentaciones pr ON oi.presentacion_id = pr.id
                LEFT JOIN categorias c ON pr.categoria_id = c.id
            WHERE oi.oferta_id = o.id) AS items
        FROM ofertas o
        WHERE o.activa = 1
        ORDER BY o.fecha_creacion DESC
    """)
    datos = cursor.fetchall()
    conexion.close()
    if not datos:
        return "Actualmente no hay ofertas vigentes. Pero puedes ver todos nuestros productos en el <a href=\"catalogo.html\">catálogo</a>."
    respuesta = "🔥 *Ofertas vigentes:*\n\n"
    for d in datos:
        respuesta += f"🎯 *{d['nombre']}* - Solo S/ {d['precio_oferta']:.2f}\n"
        items = d['items']
        if isinstance(items, list):
            for item in items:
                respuesta += f"   • {item.get('producto_nombre', 'Producto')} x{item.get('cantidad', 1)}\n"
        respuesta += "\n"
    respuesta += "¿Te interesa alguna oferta? Puedes ir al <a href=\"catalogo.html\">catálogo</a> para agregarla a tu carrito."
    return respuesta

def sugerir_producto(mensaje):
    conexion = conectar()
    cursor = conexion.cursor(dictionary=True)

    stop_words = {
        'tienen', 'cuentan', 'tiene', 'hay', 'con', 'que', 'para', 'como',
        'por', 'del', 'las', 'los', 'una', 'uno', 'sus', 'son', 'esta',
        'este', 'cual', 'donde', 'cuando', 'quiere', 'necesito', 'busco',
        'puedo', 'quiero', 'vende', 'dame', 'saber', 'sobre', 'todo',
        'todos', 'todas', 'pero', 'mas', 'más', 'sin', 'entre', 'cada',
        'ella', 'ello', 'ellos', 'muy', 'poco', 'esa', 'ese', 'eso',
        'esas', 'esos', 'eres', 'sean', 'sea', 'fue', 'era', 'ser',
        'hace', 'hacer', 'hecho', 'dice', 'dijo', 'dar', 'ver',
    }
    palabras_clave = mensaje.lower().split()
    palabras_clave = [p for p in palabras_clave if p not in stop_words]
    palabras_producto = [p for p in palabras_clave if len(p) > 2]

    if not palabras_producto:
        conexion.close()
        return "¿Qué producto estás buscando? Puedo ayudarte a encontrarlo."

    condiciones = " OR ".join(["p.nombre LIKE %s" for _ in palabras_producto])
    params = [f"%{p}%" for p in palabras_producto]

    cursor.execute(f"""
        SELECT DISTINCT p.nombre, pr.precio_venta, pr.stock, c.nombre AS categoria
        FROM productos p
        JOIN presentaciones pr ON p.id = pr.producto_id
        JOIN categorias c ON pr.categoria_id = c.id
        WHERE ({condiciones}) AND pr.nivel = 1
        ORDER BY p.nombre
        LIMIT 5
    """, params)
    datos = cursor.fetchall()
    conexion.close()

    if not datos:
        producto_ejemplo = palabras_producto[0] if palabras_producto else ""
        return f"No encontramos '{producto_ejemplo}' en nuestro catálogo. ¿Quizás buscas otro producto? <a href=\"catalogo.html\">Ver catálogo completo</a>"

    respuesta = f"✅ *Sí tenemos esos productos!* Puedes encontrarlos en nuestro <a href=\"catalogo.html\">catálogo</a>:\n\n"
    for d in datos:
        estado = "✅ En stock" if d['stock'] > 0 else "❌ Sin stock"
        respuesta += f"• {d['nombre']} ({d['categoria']}) - S/ {d['precio_venta']:.2f} - {estado}\n"
    respuesta += "\n<a href=\"catalogo.html\">🛒 Ir al catálogo ahora</a>"
    return respuesta

def mostrar_navegacion(mensaje):
    m = mensaje.lower()
    if any(p in m for p in ['catalog', 'compr', 'producto', 'ver product', 'agreg', 'compro']):
        return "🛍️ Puedes ver todos nuestros productos en el <a href=\"catalogo.html\">catálogo aquí</a>. Ahí puedes agregar productos a tu carrito."
    if any(p in m for p in ['carrito', 'pagar', 'carrit', 'pago']):
        return "🛒 Tu carrito lo encuentras <a href=\"carrito.html\">aquí</a>. Ahí puedes revisar tus productos y finalizar la compra."
    if any(p in m for p in ['pedido', 'mis pedidos', 'seguimient']):
        return "📋 Puedes ver el estado de tus pedidos <a href=\"pedidos.html\">aquí</a>."
    if any(p in m for p in ['registr', 'registrar']):
        return "📝 Para registrarte, ve a <a href=\"registro.html\">esta página</a>."
    if any(p in m for p in ['iniciar', 'login', 'sesion', 'sesión']):
        return "🔐 Inicia sesión <a href=\"index.html\">aquí</a>."
    return "Puedes navegar usando el menú lateral izquierdo. ¿A qué sección quieres ir?"
