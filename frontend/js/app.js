const usuario = localStorage.getItem('usuario');

const rol = localStorage.getItem('rol');

const rutaActual =
window.location.pathname
.split('/')
.pop();

function aplicarPermisos(){

  const rol =
  localStorage.getItem('rol');

  if(rol === 'cliente'){

    ocultarMenu('menuDashboard');

    ocultarMenu('menuProductos');

    ocultarMenu('menuUsuarios');

    ocultarMenu('menuProveedores');

    ocultarMenu('menuOfertas');

    const columnaId =
      document.getElementById(
        'columnaId'
      );

      if(columnaId){

        columnaId.remove();

      }

    const paginasBloqueadas = [
      'dashboard.html',
      'productos.html',
      'usuarios.html',
      'proveedores.html'
    ];

    if(
      paginasBloqueadas.includes(rutaActual)
    ){
      window.location = 'inicio.html';
  }

  const menuInicio = document.getElementById('menuInicio');
  if (menuInicio) menuInicio.style.display = rol === 'cliente' ? '' : 'none';

}

}

function ocultarMenu(id){

  const menu =
  document.getElementById(id);

  if(menu){

    menu.style.display =
    'none';

  }

}

function mostrarMenu(id){
  const menu = document.getElementById(id);
  if (menu) menu.style.display = '';
}

let categorias = [];

let paginaProductos = 1;
let paginaUsuarios = 1;
let paginaProveedores = 1;
let paginaDashboard = 1;
let paginaPedidos = 1;
let ultimoCheckPedidos = new Date().toISOString();
let intervaloPedidos = null;

const limiteTabla = 10;

function protegerRuta(){

  if(!usuario){

    window.location = 'index.html';

    return;

  }

  const rol =
  localStorage.getItem('rol');

  const ruta =
  window.location.pathname
  .split('/')
  .pop();

  const rutasAdmin = [

    'dashboard.html',

    'productos.html',

    'usuarios.html',

    'proveedores.html'

  ];

  if(

    rol === 'cliente'
    &&
    rutasAdmin.includes(ruta)

  ){

    window.location =
    'inicio.html';

  }

}


function mostrarUsuario(){

  const user=document.getElementById('usuario');

  const rolBox=document.getElementById('rol');

  if(user){

    user.innerText=usuario;

  }

  if(rolBox){

    rolBox.innerText=rol;

  }

}


function logout(){

  localStorage.clear();

  window.location='index.html';

}


function ir(ruta){

  window.location=ruta;

}


function cargarCategorias(){

  fetch('/api/categorias')

  .then(res => res.json())

  .then(data => {

    categorias = data;

    const editId =
    obtenerIdProducto();

    if(editId){

      cargarProductoEditar();
      return;

    }

    limpiar();

    const container =
    document.getElementById(
      'productosContainer'
    );

    if(container){

      crearProducto();

    }

    cargarProductos();

  });

}

let contadorProductos = 0;

let contadorTemp = 0;

function crearProducto(){

  const container =
  document.getElementById(
    'productosContainer'
  );

  const productoId =
  contadorProductos++;

  const div =
  document.createElement('div');

  div.className =
  'producto-card';

  div.dataset.producto =
  productoId;

  div.innerHTML = `

    <div class="producto-header">

      <h3>

        <i class="fa-solid fa-box"></i>

        Producto

      </h3>

      <button
      class="btn-delete"
      onclick="eliminarProductoCard(this)">

        X

      </button>

    </div>

    <label>
      Nombre Producto
    </label>

    <input
      type="text"
      class="nombre-producto"
      placeholder="Ej: Agua Cielo"
    >

    <div
    class="presentaciones-tree">

    </div>

  `;

      if(container){

      container.appendChild(div);

    }

  const tree =
  div.querySelector(
    '.presentaciones-tree'
  );

  crearPresentacion(
    null,
    1,
    tree
  );

}

function eliminarProductoCard(btn){

  const card =
  btn.closest('.producto-card');

  card.remove();

}

function crearNivelPrincipal(productoId){

  const producto =
  document.querySelector(

    `[data-producto="${productoId}"]`

  );

  const container =
  producto.querySelector(
    '.presentaciones-tree'
  );

  crearPresentacion(
    null,
    1,
    container
  );

}

function crearPresentacion(
  padreTemp = null,
  nivel = 1,
  containerCustom = null
){

  const container =
  document.getElementById(
    'presentacionesContainer'
  );

  const tempId =
  contadorTemp++;

  const optionsCategorias = '<option value="" disabled selected>Seleccione la categoría</option>' + categorias.map(cat => `
    <option value="${cat.id}" data-factor="${cat.factor}">${cat.nombre}</option>
  `).join('');

  const div =
  document.createElement('div');

  div.className =
  'presentacion-card';

  div.dataset.temp =
  tempId;

  div.dataset.padre =
  padreTemp;

  div.dataset.nivel =
  nivel;

  div.innerHTML = `

<div class="presentacion-top">

  <div class="nivel-badge nivel-${nivel}">
    Nivel ${nivel}
  </div>

  <button
    class="btn-delete"
    onclick="eliminarPresentacion(this)"
  >
    ×
  </button>

</div>

<div class="presentacion-grid">

  <div>

    <label>Categoría</label>

    <div class="categoria-box">

      <select class="categoria" onchange="autoFillValor(this)">
        ${optionsCategorias}
      </select>

      <button
        type="button"
        class="btn-categoria"
        onclick="abrirModalCategorias()"
      >

        <i class="fa-solid fa-plus"></i>

      </button>

    </div>

  </div>

  ${
    true ? `
    <div class="factor-group">

      <label>
        Valor
      </label>

      <input
        type="number"
        class="factor"
        value="1"

        oninput="
          recalcularSubniveles(this)
        "
      >

    </div>
    ` : ''
  }

  <div>

    <label>
      Stock
    </label>

    <input
      type="number"
      class="stock"

      ${
        nivel > 1
        ? 'readonly'
        : ''
      }

      oninput="
        recalcularSubniveles(this)
      "
    >

  </div>

  ${
    nivel === 1 ? `
    <div>

      <label>
        Precio Compra
      </label>

      <input
        type="number"
        class="precio_compra"
        placeholder="1.00"
      >

    </div>
    ` : ''
  }

  <div>

    <label>
      Precio Venta
    </label>

    <input
      type="number"
      class="precio_venta"
      placeholder="1.20"
    >

  </div>

</div>

<div class="subniveles"></div>

${
  true ? `

  <button
    class="
      btn-subnivel
      btn-nivel-${nivel}
    "
    onclick="
      agregarSubnivel(
        ${tempId},
        ${nivel + 1}
      )
    "
  >

    + Agregar Subnivel

  </button>

  ` : ''
}
`;

    if(padreTemp !== null){

      const padreCard =
      document.querySelector(
        `[data-temp="${padreTemp}"]`
      );

      const subniveles =
      padreCard.querySelector('.subniveles');

      subniveles.appendChild(div);

      recalcularHijos(padreCard);

    }else{

      if(containerCustom){

        containerCustom.appendChild(div);

      }else{

        container.appendChild(div);

      }

    }

}

function agregarSubnivel(
  padreTemp,
  nivel
){

  crearPresentacion(
    padreTemp,
    nivel
  );

  const padreCard =
  document.querySelector(
    `[data-temp="${padreTemp}"]`
  );

  if(!padreCard) return;

  const factorGroup =
  padreCard.querySelector(
    '.factor-group'
  );

  if(factorGroup){

    factorGroup.classList.remove(
      'oculto'
    );

  }

}

function eliminarPresentacion(btn){

  const card =
  btn.closest('.presentacion-card');

  const padreTemp =
  card.dataset.padre;

  card.remove();

  if(padreTemp !== "null"){

    const padre =
    document.querySelector(
      `[data-temp="${padreTemp}"]`
    );

    if(padre){

      const subniveles =
      padre.querySelector('.subniveles');

      /* SI YA NO HAY HIJOS */

      if(subniveles.children.length === 0){

        const factorContainer =
        padre.querySelector(
          '.factor-group'
        );

        factorContainer.classList.add(
          'oculto'
        );

      }

      recalcularHijos(padre);

    }

  }

}

function recalcularSubniveles(input){

  const card =
  input.closest('.presentacion-card');

  if(!card) return;

  recalcularHijos(card);

}

function recalcularHijos(card){

  const stockPadre =
  parseInt(

    card.querySelector('.stock').value

  ) || 0;

  const hijosContainer =
  card.querySelector('.subniveles');

  if(!hijosContainer) return;

  const hijos =
  hijosContainer.children;

  Array.from(hijos)
  .forEach(hijo => {

    const contiene =
    parseInt(

      card.querySelector('.factor').value

    ) || 1;

    const nuevoStock =
    stockPadre * contiene;

    hijo.querySelector('.stock').value =
    nuevoStock;

    recalcularHijos(hijo);

  });

}

function cargarProductos(page = 1){

  paginaProductos = page;

  const tabla =
  document.getElementById('tabla');

  if(!tabla) return;

  fetch(`/api/productos?page=${page}`)

  .then(res => res.json())

  .then(response => {

    const data = response.data;

    tabla.innerHTML = '';

    const agrupados = {};

    data.forEach(item => {

      if(!agrupados[item.producto_id]){

        agrupados[item.producto_id] = {

          id:
          item.producto_id,

          nombre:
          item.producto_nombre,

          proveedor:
          item.proveedor,

          presentaciones: []

        };

      }

      agrupados[item.producto_id]
      .presentaciones.push({

        categoria:
        item.categoria,

        contiene:
        item.contiene,

        stock:
        item.stock,

        precio_venta:
        item.precio_venta,

        nivel:
        item.nivel

      });

    });

    Object.values(agrupados)
    .forEach(producto => {

      let htmlPresentaciones = '';

      producto.presentaciones
      .forEach(p => {

        htmlPresentaciones += `

        <div class="
          presentacion-lista
          nivel-${p.nivel}
        ">

          <strong>
            ${p.categoria}
          </strong>

          ${
            p.contiene > 1
            ? `x${p.contiene}`
            : ''
          }

          <br>

          Stock:
          ${p.stock}

          <br>

          Venta:
          S/ ${p.precio_venta}

        </div>

        `;

      });

      const stockTotal =
      producto.presentaciones.length > 0
      ? producto.presentaciones[
          producto.presentaciones.length - 1
        ].stock
      : 0;

      tabla.innerHTML += `

      <tr>

        <td>
          <strong>
            ${producto.nombre}
          </strong>
        </td>

        <td>
          ${htmlPresentaciones}
        </td>

        <td>
          ${producto.proveedor}
        </td>

        <td>
          ${stockTotal}
        </td>

<td class="td-acciones">
  <div class="acciones-tabla">

    <button
    class="btn-edit"
    onclick="editarProducto(${producto.id})">

      <i class="fa-solid fa-pen"></i>

    </button>

    <button
    class="btn-delete-table"
    onclick="eliminarProducto(${producto.id})">

      <i class="fa-solid fa-trash"></i>

    </button>

  </div>

</td>

      </tr>

      `;

    });

    renderPagination(
      response.totalPages,
      response.currentPage
    );

  });

}

function renderPagination(
  totalPages,
  currentPage
){

  const pagination =
  document.getElementById(
    'pagination'
  );

  if(!pagination) return;

  pagination.innerHTML = '';

  pagination.innerHTML += `

    <button

      ${
        currentPage === 1
        ? 'disabled'
        : ''
      }

      onclick="
        cargarProductos(
          ${currentPage - 1}
        )
      "

    >

      ←

    </button>

  `;

  for(let i = 1; i <= totalPages; i++){

    pagination.innerHTML += `

      <button

        class="
          ${
            i === currentPage
            ? 'active-page'
            : ''
          }
        "

        onclick="
          cargarProductos(${i})
        "

      >

        ${i}

      </button>

    `;

  }

  pagination.innerHTML += `

    <button

      ${
        currentPage === totalPages
        ? 'disabled'
        : ''
      }

      onclick="
        cargarProductos(
          ${currentPage + 1}
        )
      "

    >

      →

    </button>

  `;

}

function cargarPedidos(page = paginaPedidos){
  const tabla = document.getElementById('tablaPedidos');
  if (!tabla) return;

  const rol = localStorage.getItem('rol');
  const cliente_id = localStorage.getItem('id');

  fetch(`/api/pedidos?rol=${rol}&cliente_id=${cliente_id}&page=${page}`)
  .then(res => res.json())
  .then(response => {
    const data = Array.isArray(response) ? response : response.data || [];
    const totalPages = response.totalPages || 1;
    const total = response.total || data.length;

    tabla.innerHTML = '';

    data.forEach(p => {
      let claseEstado = '';
      if (p.estado === 'pendiente') claseEstado = 'estado-pendiente';
      if (p.estado === 'aceptado') claseEstado = 'estado-aceptado';
      if (p.estado === 'en_camino') claseEstado = 'estado-camino';
      if (p.estado === 'entregado') claseEstado = 'estado-entregado';

      let textoEstado = p.estado === 'en_camino'
        ? 'En Camino'
        : p.estado.charAt(0).toUpperCase() + p.estado.slice(1);

      let fechaBadge = '';
      if (p.fecha_estimada_entrega) {
        const f = new Date(p.fecha_estimada_entrega);
        fechaBadge = `<br><small style="color:#475569">📅 ${f.toLocaleDateString()} ${f.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</small>`;
      }

      let accionesAdmin = '';
      if (rol === 'admin' && p.estado !== 'entregado') {
        accionesAdmin = `<button class="btn-camino" onclick="cambiarEstado(${p.id})"><i class="fa-solid fa-truck"></i> Programar Entrega</button>`;
      }

      tabla.innerHTML += `
        <tr>
          ${rol !== 'cliente' ? `<td class="td-id">#${p.id}</td>` : ''}
          <td>${p.cliente || 'Cliente'}</td>
          <td><strong>S/ ${p.total}</strong></td>
          <td>${p.metodo_pago}</td>
          <td><span class="${claseEstado}">${textoEstado}</span>${fechaBadge}</td>
          <td>${new Date(p.fecha).toLocaleDateString()}</td>
          <td>
            <div class="acciones-pedido">
              <button class="btn-edit" onclick="verDetalle(${p.id})" title="Ver detalle"><i class="fa-solid fa-eye"></i></button>
              <button class="btn-pdf" title="Descargar Boleta" onclick="descargarPDF(${p.id})"><i class="fa-solid fa-receipt"></i></button>
              <button class="btn-pdf" title="Descargar Factura" style="background:#dc2626;color:white" onclick="descargarFacturaPDF(${p.id})"><i class="fa-solid fa-file-invoice"></i></button>
              ${accionesAdmin}
            </div>
          </td>
        </tr>`;
    });

    document.getElementById('totalPedidos').innerText = total;
    document.getElementById('pedidosPendientes').innerText = data.filter(p => p.estado === 'pendiente').length;
    document.getElementById('pedidosCamino').innerText = data.filter(p => p.estado === 'en_camino').length;
    document.getElementById('pedidosEntregados').innerText = data.filter(p => p.estado === 'entregado').length;

    const pagDiv = document.getElementById('paginationPedidos');
    if (pagDiv) {
      pagDiv.innerHTML = '';
      pagDiv.innerHTML += `<button ${page <= 1 ? 'disabled' : ''} onclick="cargarPedidos(${page - 1})">←</button>`;
      for (let i = 1; i <= totalPages; i++) {
        pagDiv.innerHTML += `<button class="${i === page ? 'active-page' : ''}" onclick="cargarPedidos(${i})">${i}</button>`;
      }
      pagDiv.innerHTML += `<button ${page >= totalPages ? 'disabled' : ''} onclick="cargarPedidos(${page + 1})">→</button>`;
    }

    // Polling para clientes
    if (rol === 'cliente') {
      if (intervaloPedidos) clearInterval(intervaloPedidos);
      intervaloPedidos = setInterval(() => {
        fetch(`/api/pedidos/check-updates?cliente_id=${cliente_id}&desde=${ultimoCheckPedidos}`)
        .then(r => r.json())
        .then(resp => {
          if (resp.cambios && resp.cambios.length > 0) {
            ultimoCheckPedidos = new Date().toISOString();
            resp.cambios.forEach(c => {
              const emoji = c.estado === 'en_camino' ? '🚛' : c.estado === 'entregado' ? '✅' : '📋';
              Swal.fire({
                icon: c.estado === 'entregado' ? 'success' : 'info',
                title: `${emoji} Pedido #${c.id} ${c.estado === 'en_camino' ? 'en camino' : c.estado}`,
                toast: true, position: 'top-end', timer: 5000, showConfirmButton: false
              });
            });
          }
        });
      }, 5000);
    }
  });
}

function registrarProveedor(){

  const rol = localStorage.getItem('rol');

  if(rol !== 'admin'){
    Swal.fire({ icon: 'warning', title: 'Solo administradores', timer: 1500, showConfirmButton: false });
    return;
  }

  const nombreEmpresa = document.getElementById('nombreEmpresa').value.trim();
  const ruc = document.getElementById('ruc').value.trim();
  const telefono = document.getElementById('telefonoProveedor').value.trim();
  const correo = document.getElementById('correoProveedor').value.trim();
  const direccion = document.getElementById('direccionProveedor').value.trim();

  if (!nombreEmpresa) {
    Swal.fire({ icon: 'warning', title: 'Ingrese el nombre de la empresa' });
    return;
  }

  if (ruc && !/^\d{11}$/.test(ruc)) {
    Swal.fire({ icon: 'warning', title: 'RUC debe tener 11 dígitos numéricos' });
    return;
  }

  if (telefono && !/^\d{9}$/.test(telefono)) {
    Swal.fire({ icon: 'warning', title: 'Teléfono debe tener 9 dígitos numéricos' });
    return;
  }

  if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    Swal.fire({ icon: 'warning', title: 'Correo electrónico no válido' });
    return;
  }

  fetch('/api/proveedores', {
    method:'POST',
    headers:{ 'Content-Type':'application/json' },
    body:JSON.stringify({ nombreEmpresa, ruc, telefono, correo, direccion })
  })
  .then(res => res.json())
  .then(data => {
    if(data.success){
      Swal.fire({ icon: 'success', title: 'Proveedor registrado', timer: 1500, showConfirmButton: false });
      document.getElementById('nombreEmpresa').value = '';
      document.getElementById('ruc').value = '';
      document.getElementById('telefonoProveedor').value = '';
      document.getElementById('correoProveedor').value = '';
      document.getElementById('direccionProveedor').value = '';
      cargarProveedores();
    } else {
      Swal.fire({ icon: 'error', title: 'Error', text: data.message || 'No se pudo registrar' });
    }
  });
}

function cargarProveedores(){

  const tabla =
  document.getElementById(
    'tablaProveedores'
  );

  if(!tabla) return;

  fetch(

    `/api/proveedores?page=${paginaProveedores}&limit=${limiteTabla}`

  )

  .then(res => res.json())

  .then(response => {

    tabla.innerHTML = '';

    response.data.forEach(p => {

      tabla.innerHTML += `

      <tr>

        <td>
          ${p.nombre_empresa}
        </td>

        <td>
          ${p.ruc}
        </td>

        <td>
          ${p.telefono || '-'}
        </td>

        <td>
          ${p.correo || '-'}
        </td>

        <td>
          ${p.direccion || '-'}
        </td>

        <td style="display:flex;gap:6px">
          <button onclick="editarProveedor(${p.id})" class="btn-edit" title="Editar">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button onclick="eliminarProveedor(${p.id})" class="btn-delete-table" title="Eliminar">
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>

      </tr>

      `;

    });

    const totalPaginas =
    Math.ceil(
      response.total / limiteTabla
    );

    const paginacion =
    document.getElementById(
      'paginationProveedores'
    );

    if(!paginacion) return;

    paginacion.innerHTML = '';

    for(
      let i = 1;
      i <= totalPaginas;
      i++
    ){

      paginacion.innerHTML += `

        <button
        class="${
          i === paginaProveedores
          ? 'active-page'
          : ''
        }"

        onclick="
          paginaProveedores=${i};
          cargarProveedores();
        ">

          ${i}

        </button>

      `;

    }

  });

}

function editarProveedor(id){

  fetch('/api/proveedores/' + id)
  .then(res => res.json())
  .then(p => {
    if (!p) {
      Swal.fire({ icon: 'error', title: 'Error al obtener proveedor' });
      return;
    }

    document.getElementById('editarProveedorId').value = p.id;
    document.getElementById('editarNombreEmpresa').value = p.nombre_empresa || '';
    document.getElementById('editarRuc').value = p.ruc || '';
    document.getElementById('editarTelefono').value = p.telefono || '';
    document.getElementById('editarCorreo').value = p.correo || '';
    document.getElementById('editarDireccion').value = p.direccion || '';

    document.getElementById('modalEditarProveedor').style.display = 'flex';
  });
}

function cerrarModalEditarProveedor(){
  document.getElementById('modalEditarProveedor').style.display = 'none';
  document.getElementById('editarProveedorId').value = '';
  document.getElementById('editarNombreEmpresa').value = '';
  document.getElementById('editarRuc').value = '';
  document.getElementById('editarTelefono').value = '';
  document.getElementById('editarCorreo').value = '';
  document.getElementById('editarDireccion').value = '';
}

function guardarEdicionProveedor(){

  const id = document.getElementById('editarProveedorId').value;
  const nombreEmpresa = document.getElementById('editarNombreEmpresa').value.trim();
  const ruc = document.getElementById('editarRuc').value.trim();
  const telefono = document.getElementById('editarTelefono').value.trim();
  const correo = document.getElementById('editarCorreo').value.trim();
  const direccion = document.getElementById('editarDireccion').value.trim();

  if (!nombreEmpresa) {
    Swal.fire({ icon: 'warning', title: 'Ingrese el nombre de la empresa' });
    return;
  }

  if (ruc && !/^\d{11}$/.test(ruc)) {
    Swal.fire({ icon: 'warning', title: 'RUC debe tener 11 dígitos numéricos' });
    return;
  }

  if (telefono && !/^\d{9}$/.test(telefono)) {
    Swal.fire({ icon: 'warning', title: 'Teléfono debe tener 9 dígitos numéricos' });
    return;
  }

  if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    Swal.fire({ icon: 'warning', title: 'Correo electrónico no válido' });
    return;
  }

  fetch('/api/proveedores/' + id, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombreEmpresa, ruc, telefono, correo, direccion })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      Swal.fire({ icon: 'success', title: 'Proveedor actualizado', timer: 1500, showConfirmButton: false });
      cerrarModalEditarProveedor();
      cargarProveedores();
    } else {
      Swal.fire({ icon: 'error', title: 'Error', text: data.message || 'No se pudo actualizar' });
    }
  });
}

function eliminarProveedor(id){

  Swal.fire({
    title: '¿Eliminar proveedor?',
    text: 'Esta acción no se puede deshacer',
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  })
  .then(result => {
    if (!result.isConfirmed) return;

    fetch('/api/proveedores/' + id, { method: 'DELETE' })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        Swal.fire({ icon: 'success', title: 'Proveedor eliminado', timer: 1500, showConfirmButton: false });
        cargarProveedores();
      } else {
        Swal.fire({ icon: 'error', title: 'Error', text: data.message || 'No se pudo eliminar' });
      }
    });
  });
}

function cargarUsuarios(){

  const tabla =
  document.getElementById(
    'tablaUsuarios'
  );

  if(!tabla) return;

  fetch(

    `/api/usuarios?page=${paginaUsuarios}&limit=${limiteTabla}`

  )

  .then(res => res.json())

  .then(response => {

    tabla.innerHTML = '';

    response.data.forEach(u => {

      tabla.innerHTML += `

      <tr>

        <td>
          ${u.nombres} ${u.apellidos || ''}
        </td>

        <td>
          ${u.usuario}
        </td>

        <td>
          ${u.rol}
        </td>

        <td>
          ${u.ruc || '-'}
        </td>

        <td>
          ${u.correo}
        </td>

        <td>
          ${u.telefono}
        </td>

      </tr>

      `;

    });

    const totalPaginas =
    Math.ceil(
      response.total / limiteTabla
    );

    const paginacion =
    document.getElementById(
      'paginationUsuarios'
    );

    if(!paginacion) return;

    paginacion.innerHTML = '';

    for(
      let i = 1;
      i <= totalPaginas;
      i++
    ){

      paginacion.innerHTML += `

        <button
        class="${
          i === paginaUsuarios
          ? 'active-page'
          : ''
        }"

        onclick="
          paginaUsuarios=${i};
          cargarUsuarios();
        ">

          ${i}

        </button>

      `;

    }

  });

}

function obtenerIdProducto(){

  const params =
  new URLSearchParams(window.location.search);

  return params.get('id');

}

function cargarSelectProveedores(){

  const select =
  document.getElementById('proveedor');

  if(!select) return;

  fetch('/api/proveedores')

  .then(res => res.json())

  .then(response => {

    const data =
    response.data || response;

    select.innerHTML =
    '<option value="">Seleccionar proveedor</option>';

    data.forEach(p => {

      select.innerHTML +=
      `<option value="${p.id}">${p.nombre_empresa}</option>`;

    });

  });

}

function autoFillValor(select){
  const selected = select.options[select.selectedIndex];
  const card = select.closest('.presentacion-card');
  const factorInput = card.querySelector('.factor');
  if(factorInput){
    factorInput.value = selected.dataset.factor;
    recalcularSubniveles(factorInput);
  }
}

function abrirModalProveedor(){
  document.getElementById('modalProveedorRapido').style.display = 'flex';
}

function cerrarModalProveedor(){
  document.getElementById('modalProveedorRapido').style.display = 'none';
  document.getElementById('rapidoNombre').value = '';
  document.getElementById('rapidoRuc').value = '';
  document.getElementById('rapidoTelefono').value = '';
  document.getElementById('rapidoCorreo').value = '';
}

function guardarProveedorRapido(){
  const nombre = document.getElementById('rapidoNombre').value.trim();
  const ruc = document.getElementById('rapidoRuc').value.trim();
  const telefono = document.getElementById('rapidoTelefono').value.trim();
  const correo = document.getElementById('rapidoCorreo').value.trim();

  if (!nombre) {
    Swal.fire({ icon: 'warning', title: 'Ingrese el nombre de la empresa' });
    return;
  }

  fetch('/api/proveedores', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nombreEmpresa: nombre,
      ruc,
      telefono,
      correo,
      direccion: ''
    })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      Swal.fire({ icon: 'success', title: 'Proveedor registrado', timer: 1200, showConfirmButton: false });
      cerrarModalProveedor();
      const select = document.getElementById('proveedor');
      if (select) {
        select.innerHTML = '<option value="">Seleccionar proveedor</option>';
        cargarSelectProveedores();
      }
    } else {
      Swal.fire({ icon: 'error', title: 'Error', text: data.message || 'No se pudo registrar' });
    }
  });
}

function agregarCarrito(productoId, presentacionId, nombre, categoria, precio, stock, btn){

  const carrito =
  JSON.parse(
    localStorage.getItem('carrito')
  ) || [];

  const existe =
  carrito.find(i =>
    i.tipo === 'producto' &&
    i.producto_id === productoId &&
    i.presentacion_id === presentacionId
  );

  if(existe){

    if(existe.cantidad < stock){

      existe.cantidad++;

    }else{

      Swal.fire({
        icon:'warning',
        title:'Stock máximo alcanzado',
        timer:1200,
        showConfirmButton:false
      });

      return;

    }

  }else{

    carrito.push({
      tipo:'producto',
      producto_id: productoId,
      presentacion_id: presentacionId,
      nombre: nombre,
      categoria: categoria,
      precio: parseFloat(precio),
      stock: stock,
      cantidad: 1
    });

  }

  localStorage.setItem(
    'carrito',
    JSON.stringify(carrito)
  );

  actualizarContadorCarrito();

  if(btn){

    const original = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-check"></i> Agregado';
    btn.style.background = '#16a34a';
    setTimeout(() => {
      btn.innerHTML = original;
      btn.style.background = '';
    }, 1500);

  }

}

function cargarCarrito(){

  const tbody =
  document.getElementById(
    'tablaCarrito'
  );

  if(!tbody) return;

  const carrito =
  JSON.parse(
    localStorage.getItem('carrito')
  ) || [];

  if(carrito.length === 0){

    tbody.innerHTML =
    '<tr><td colspan="5" style="text-align:center;padding:32px;color:var(--text-muted)">Carrito vacío</td></tr>';

    document.getElementById('totalCarrito').innerText = 'S/ 0.00';
    return;

  }

  let html = '';
  let total = 0;

  carrito.forEach((item, index) => {

    // Ocultar items expandidos de oferta (solo controlan stock)
    if (item.es_oferta && item.precio === 0) return;

    const subtotal =
    item.precio * item.cantidad;

    total += subtotal;

    html += `

    <tr>

      <td>
        <strong>${item.nombre}</strong>
        <br>
        <small style="color:var(--text-muted)">${item.categoria}</small>
      </td>

      <td>
        ${item.categoria || ''}
      </td>

      <td>
        S/ ${parseFloat(item.precio).toFixed(2)}
      </td>

      <td>
        <div class="cantidad-box">
          <button onclick="restarCantidadCarrito(${index})">-</button>
          <input type="number" value="${item.cantidad}" min="1" max="${item.stock}" class="cantidad-input" onchange="actualizarCantidadCarrito(${index}, this)">
          <button onclick="sumarCantidadCarrito(${index}, ${item.stock})">+</button>
        </div>
      </td>

      <td>
        <strong>S/ ${subtotal.toFixed(2)}</strong>
      </td>

      <td>
        <button class="btn-delete-table" onclick="eliminarItemCarrito(${index})">
          <i class="fa-solid fa-trash"></i>
        </button>
      </td>

    </tr>

    `;

  });

  tbody.innerHTML = html;

  document.getElementById(
    'totalCarrito'
  ).innerText = 'S/ ' + total.toFixed(2);

}

function eliminarItemCarrito(index){

  const carrito =
  JSON.parse(
    localStorage.getItem('carrito')
  ) || [];

  carrito.splice(index, 1);

  localStorage.setItem(
    'carrito',
    JSON.stringify(carrito)
  );

  cargarCarrito();
  actualizarContadorCarrito();

}

function actualizarCantidadCarrito(index, input){

  const carrito =
  JSON.parse(
    localStorage.getItem('carrito')
  ) || [];

  let valor =
  parseInt(input.value);

  if(isNaN(valor) || valor < 1){

    valor = 1;

  }

  if(valor > carrito[index].stock){

    valor = carrito[index].stock;

  }

  carrito[index].cantidad = valor;
  input.value = valor;

  localStorage.setItem(
    'carrito',
    JSON.stringify(carrito)
  );

  cargarCarrito();

}

function sumarCantidadCarrito(index, stock){

  const carrito =
  JSON.parse(
    localStorage.getItem('carrito')
  ) || [];

  if(carrito[index].cantidad < stock){

    carrito[index].cantidad++;

    localStorage.setItem(
      'carrito',
      JSON.stringify(carrito)
    );

    cargarCarrito();

  }

}

function restarCantidadCarrito(index){

  const carrito =
  JSON.parse(
    localStorage.getItem('carrito')
  ) || [];

  if(carrito[index].cantidad > 1){

    carrito[index].cantidad--;

    localStorage.setItem(
      'carrito',
      JSON.stringify(carrito)
    );

    cargarCarrito();

  }

}

function finalizarCompra(){

  const carrito =
  JSON.parse(
    localStorage.getItem('carrito')
  ) || [];

  if(!carrito.length){
    Swal.fire({
      icon:'warning',
      title:'Carrito vacío',
      timer:1200,
      showConfirmButton:false
    });
    return;
  }

  const cliente_id =
  localStorage.getItem('id') || 1;

  const metodo_pago =
  document.getElementById('metodoPago').value;

  let total = 0;
  carrito.forEach(item => {
    total += item.precio * item.cantidad;
  });

  Swal.fire({
    title:'¿Confirmar compra?',
    text:'Total: S/ ' + total.toFixed(2),
    icon:'question',
    showCancelButton:true,
    confirmButtonText:'Sí, comprar',
    cancelButtonText:'Cancelar'
  }).then(r => {
    if(!r.isConfirmed) return;
    fetch('/api/pedidos', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({ cliente_id, metodo_pago, total, carrito })
    })
    .then(res => res.json())
    .then(data => {
      if(data.success){
        localStorage.removeItem('carrito');
        actualizarContadorCarrito();
        Swal.fire({
          icon:'success',
          title:'Compra registrada',
          text:'Pedido #' + data.pedidoId,
          timer:1500,
          showConfirmButton:false
        });
        setTimeout(() => { window.location = 'pedidos.html'; }, 1600);
      } else {
        Swal.fire({
          icon:'error',
          title:'Error',
          text: data.message || 'Error al procesar la compra'
        });
      }
    })
    .catch(() => {
      Swal.fire({
        icon:'error',
        title:'Error de conexión',
        text:'No se pudo conectar con el servidor'
      });
    });
  });
}

function eliminarProducto(id){

Swal.fire({

  title:'¿Eliminar producto?',

  text:'Esta acción no se puede deshacer',

  icon:'warning',

  showCancelButton:true,

  confirmButtonColor:'#ef4444',

  cancelButtonColor:'#64748b',

  confirmButtonText:'Sí, eliminar',

  cancelButtonText:'Cancelar'

})
.then((result)=>{

  if(!result.isConfirmed) return;

  fetch('/api/productos/' + id, {

    method:'DELETE'

  })

  .then(res => res.json())

  .then(data => {

    if(data.success){

      Swal.fire({
        icon:'success',
        title:'Producto eliminado',
        timer:1500,
        showConfirmButton:false
      });

      cargarProductos();

    }else{

      Swal.fire({
        icon:'error',
        title:'Error',
        text: data.message || 'No se pudo eliminar el producto'
      });

    }

  })

  .catch(() => {
    Swal.fire({
      icon:'error',
      title:'Error de conexión',
      text:'No se pudo conectar con el servidor'
    });
  });

});
}

function editarProducto(id){

  window.location =
  'editar.html?id=' + id;

}

function cargarProductoEditar(){

  const id = obtenerIdProducto();

  if(!id) return;

  fetch('/api/productos/' + id)

  .then(res => res.json())

  .then(data => {

    if(data.length === 0) return;

    limpiar();

    const proveedor =
    document.getElementById(
      'proveedor'
    );

    if(proveedor){
      proveedor.value =
      data[0].proveedor_id;
    }

    const proveedorNombre =
    document.getElementById(
      'proveedorNombre'
    );

    if(proveedorNombre){
      proveedorNombre.textContent =
      data[0].proveedor_nombre || 'Proveedor #' + data[0].proveedor_id;
    }


    crearProducto();

    const productoCard =
    document.querySelector(
      '.producto-card'
    );

    if(!productoCard){
      return;
    }

    productoCard.querySelector(
      '.nombre-producto'
    ).value = data[0].producto_nombre;

    const tree =
    productoCard.querySelector(
      '.presentaciones-tree'
    );

    tree.innerHTML = '';

    const mapaTemp = {};

    data
    .sort((a,b)=>a.nivel-b.nivel)
    .forEach(pr => {

      let padreTemp = null;

      if(pr.padre_id){

        padreTemp =
        mapaTemp[pr.padre_id];

      }

      crearPresentacion(
        padreTemp,
        pr.nivel,
        tree
      );

      const cards =
      document.querySelectorAll(
        '.presentacion-card'
      );

      const ultima =
      cards[cards.length - 1];

      /* GUARDAR RELACION */
      mapaTemp[pr.presentacion_id] =
      ultima.dataset.temp;

      ultima.querySelector(
        '.categoria'
      ).value = pr.categoria_id;

      if(
        ultima.querySelector('.factor')
      ){

        ultima.querySelector(
          '.factor'
        ).value = pr.factor;

      }

      ultima.querySelector(
        '.stock'
      ).value = pr.stock;

      if(
        ultima.querySelector('.precio_compra')
      ){

        ultima.querySelector(
          '.precio_compra'
        ).value = pr.precio_compra;

      }

      ultima.querySelector(
        '.precio_venta'
      ).value = pr.precio_venta;

    });

    document.querySelectorAll('.presentacion-card').forEach(card => {
      if (card.dataset.nivel === '1') recalcularHijos(card);
    });

});

}

function limpiar(){

  const proveedor =
  document.getElementById('proveedor');

  if(proveedor){

    proveedor.value = "";

  }

  const container =
  document.getElementById(
    "productosContainer"
  );

  if(container){

    container.innerHTML = "";

  }

}

function cambiarEstado(id){
  Swal.fire({
    title: 'Programar entrega',
    width: '90%',
    html: `<input type="datetime-local" id="fechaEntrega" class="swal2-input" style="width:100%;box-sizing:border-box;padding:12px 16px;font-size:16px;border-radius:10px;border:1.5px solid var(--border);margin-top:8px">`,
    confirmButtonText: 'Marcar como En Camino',
    showCancelButton: true,
    cancelButtonText: 'Cancelar',
    preConfirm: () => {
      const val = document.getElementById('fechaEntrega').value;
      if (!val) { Swal.showValidationMessage('Seleccione una fecha'); return; }
      return val;
    }
  }).then(result => {
    if (result.isConfirmed) {
      enviarCambioEstado(id, 'en_camino', result.value);
    }
  });
}

function enviarCambioEstado(id, estado, fecha){
  const body = { estado };
  if (fecha) body.fecha_estimada_entrega = fecha;

  fetch('/api/pedidos/' + id, {
    method:'PUT',
    headers:{ 'Content-Type':'application/json' },
    body: JSON.stringify(body)
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      Swal.fire({ icon:'success', title:'Estado actualizado', toast:true, position:'top-end', timer:1500, showConfirmButton:false });
    }
    cargarPedidos();
  });
}

function verDetalle(id){
  fetch('/api/pedidos/' + id)
  .then(res => res.json())
  .then(data => {
    let html = `<table style="width:100%;border-collapse:collapse;font-size:14px">
      <thead>
        <tr style="background:#0f172a;color:white">
          <th style="padding:10px 12px;text-align:left">Producto</th>
          <th style="padding:10px 12px;text-align:center">Cant.</th>
          <th style="padding:10px 12px;text-align:right">Precio</th>
          <th style="padding:10px 12px;text-align:right">Subtotal</th>
        </tr>
      </thead>
      <tbody>`;

    // Ocultar items de oferta que son solo para stock (precio 0 con nombre_oferta)
    const itemsVisibles = data.filter(item => !(item.nombre_oferta && parseFloat(item.precio) === 0));

    itemsVisibles.forEach((item, i) => {
      const bg = i % 2 === 0 ? '#f8fafc' : 'white';
      const esOferta = item.nombre_oferta;
      const nombreProducto = esOferta
        ? `<span style="display:flex;align-items:center;gap:6px"><span style="background:#ef4444;color:white;font-size:10px;font-weight:800;padding:2px 8px;border-radius:100px">OFERTA</span> ${item.nombre_oferta}</span>`
        : item.nombre;
      html += `<tr style="background:${bg}">
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0">${nombreProducto}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:center">${item.cantidad}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:600">S/ ${parseFloat(item.precio).toFixed(2)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:700;color:#2563eb">S/ ${parseFloat(item.subtotal).toFixed(2)}</td>
      </tr>`;
    });
    html += '</tbody></table>';
    Swal.fire({
      title: 'Detalle del Pedido #' + id,
      html,
      width: 650,
      confirmButtonColor: '#2563eb',
      confirmButtonText: 'Cerrar'
    });
  })
  .catch(() => {
    Swal.fire({ icon:'error', title:'Error', text:'No se pudo cargar el detalle' });
  });
}

function guardarProducto(){

  const proveedor = document.getElementById('proveedor').value;
  if (!proveedor) {
    Swal.fire({ icon: 'warning', title: 'Seleccione un proveedor' });
    return;
  }

  const productos = document.querySelectorAll('.producto-card');
  if (productos.length === 0) {
    Swal.fire({ icon: 'warning', title: 'Agregue al menos un producto' });
    return;
  }

  let errores = [];

  productos.forEach(producto => {
    const nombre = producto.querySelector('.nombre-producto').value.trim();
    if (!nombre) {
      errores.push('Complete el nombre del producto');
      return;
    }

    const cards = producto.querySelectorAll('.presentacion-card');
    if (cards.length === 0) {
      errores.push(`"${nombre}" no tiene presentaciones`);
      return;
    }

    cards.forEach(card => {
      const catVal = card.querySelector('.categoria').value;
      if (!catVal) {
        errores.push(`"${nombre}" - seleccione una categoría`);
        return;
      }
      const stock = parseInt(card.querySelector('.stock').value);
      if (!stock || stock <= 0) {
        errores.push(`"${nombre}" - stock debe ser mayor a 0`);
        return;
      }
      const precioVenta = parseFloat(card.querySelector('.precio_venta').value);
      if (!precioVenta || precioVenta <= 0) {
        errores.push(`"${nombre}" - precio venta debe ser mayor a 0`);
        return;
      }
    });
  });

  if (errores.length > 0) {
    Swal.fire({ icon: 'warning', title: 'Corrija los errores', text: errores[0] });
    return;
  }

  let totalGuardados = 0;

  productos.forEach(producto => {

    const nombre = producto.querySelector('.nombre-producto').value;
    if (!nombre) return;

    const presentaciones = [];
    const cards = producto.querySelectorAll('.presentacion-card');

    cards.forEach(card => {
      presentaciones.push({
        temp_id: parseInt(card.dataset.temp),
        padre_temp: card.dataset.padre === "null" ? null : parseInt(card.dataset.padre),
        nivel: parseInt(card.dataset.nivel),
        categoria_id: parseInt(card.querySelector('.categoria').value),
        factor: card.querySelector('.factor') ? parseInt(card.querySelector('.factor').value) || 1 : 1,
        stock: parseInt(card.querySelector('.stock').value) || 0,
        precio_compra: card.querySelector('.precio_compra') ? parseFloat(card.querySelector('.precio_compra').value) || 0 : 0,
        precio_venta: parseFloat(card.querySelector('.precio_venta').value) || 0
      });
    });

    const idEditar = obtenerIdProducto();

    fetch(idEditar ? '/api/productos/' + idEditar : '/api/productos', {
      method: idEditar ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, proveedor_id: proveedor, presentaciones })
    })
    .then(res => res.json())
    .then(data => {
      totalGuardados++;

      if(
        totalGuardados === productos.length
      ){

      const idEditar =
      obtenerIdProducto();

      Swal.fire({

        icon:'success',

        title:
          idEditar
          ? 'Producto actualizado'
          : 'Productos guardados',

        text:
          idEditar
          ? 'Los cambios fueron guardados'
          : 'Se registraron correctamente',

        confirmButtonColor:'#2563eb'

      })
      .then(()=>{

        if(idEditar){

          window.location =
          'productos.html';

        }
        else{

          limpiar();

          crearProducto();

          cargarProductos();

        }

      });

      }

    });

  });

}

function abrirModalCategorias(){

  document
  .getElementById('modalCategorias')
  .classList.remove('oculto');

  cargarTablaCategorias();

}

function cerrarModalCategorias(){

  document
  .getElementById('modalCategorias')
  .classList.add('oculto');

}

function cargarTablaCategorias(){

  fetch('/api/categorias')

  .then(res => res.json())

  .then(data => {

    const tabla =
    document.getElementById(
      'tablaCategorias'
    );

    tabla.innerHTML = '';

    data.forEach(cat => {

      tabla.innerHTML += `

        <tr>

          <td>
            ${cat.nombre}
          </td>

          <td>
            ${cat.factor}
          </td>

          <td>

            <button class="btn-edit" onclick="editarCategoria(${cat.id}, '${cat.nombre}', ${cat.factor})">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button class="btn-delete-table" onclick="eliminarCategoria(${cat.id})">
              <i class="fa-solid fa-trash"></i>
            </button>

          </td>

        </tr>

      `;

    });

  });

}

function editarCategoria(
  id,
  nombre,
  factor
){

  document.getElementById(
    'nombreCategoria'
  ).value = nombre;

  document.getElementById(
    'factorCategoria'
  ).value = factor;

  window.categoriaEditando = id;

}

function eliminarCategoria(id){

  Swal.fire({

    title:'¿Eliminar categoría?',

    icon:'warning',

    showCancelButton:true,

    confirmButtonColor:'#ef4444',

    confirmButtonText:'Eliminar',

    cancelButtonText:'Cancelar'

  })

  .then(result => {

    if(result.isConfirmed){

      fetch('/api/categorias/' + id, {

        method:'DELETE'

      })

      .then(res => res.json())

      .then(data => {

        cargarTablaCategorias();

        cargarCategorias();

      });

    }

  });

}

function guardarCategoria(){

  const nombre =
  document.getElementById(
    'nombreCategoria'
  ).value;

  const factor =
  document.getElementById(
    'factorCategoria'
  ).value;

  if(!nombre || !factor){

    Swal.fire({

      icon:'warning',

      title:'Complete los campos'

    });

    return;

  }

  const id =
  window.categoriaEditando;

  fetch(

    id
    ? '/api/categorias/' + id
    : '/api/categorias',

    {

      method:
      id
      ? 'PUT'
      : 'POST',

      headers:{
        'Content-Type':'application/json'
      },

      body:JSON.stringify({

        nombre,
        factor

      })

    }

  )

  .then(res => res.json())

  .then(data => {

    Swal.fire({

      icon:'success',

      title:
        id
        ? 'Categoría actualizada'
        : 'Categoría registrada',

      timer:1500,

      showConfirmButton:false

    });

    document.getElementById(
      'nombreCategoria'
    ).value = '';

    document.getElementById(
      'factorCategoria'
    ).value = '';

    window.categoriaEditando = null;

    cargarTablaCategorias();

    cargarCategorias();

  });

}

function cargarDashboard(){
  fetch(`/api/dashboard?page=${paginaDashboard}`)
  .then(res => res.json())
  .then(data => {
    const el = id => document.getElementById(id);
    if (el('totalProductos')) el('totalProductos').innerText = data.totalProductos;
    if (el('totalUsuarios')) el('totalUsuarios').innerText = data.totalUsuarios;
    if (el('totalPedidosCard')) el('totalPedidosCard').innerText = data.totalPedidos;
    if (el('totalVentas')) el('totalVentas').innerText = 'S/ ' + parseFloat(data.totalVentas).toFixed(2);

    const ventas = data.ventasProducto || [];

    const canvas = document.getElementById('ventasChart');
    if (canvas && ventas.length > 0) {
      const ctx = canvas.getContext('2d');
      if (window._ventasChart) window._ventasChart.destroy();

      const labels = ventas.map(v => v.nombre);
      const values = ventas.map(v => parseFloat(v.total_ingreso));
      const colores = ['#2563eb','#7c3aed','#f59e0b','#ef4444','#16a34a','#06b6d4','#ec4899','#f97316'];

      window._ventasChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [{
            data: values,
            backgroundColor: colores.slice(0, labels.length),
            borderWidth: 3,
            borderColor: '#fff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { padding: 16, usePointStyle: true, font: { size: 12 } }
            },
            tooltip: {
              callbacks: {
                label: ctx => {
                  const total = values.reduce((a, b) => a + b, 0);
                  const pct = ((ctx.raw / total) * 100).toFixed(1);
                  return ` ${ctx.label}: S/ ${ctx.raw.toFixed(2)} (${pct}%)`;
                }
              }
            }
          }
        }
      });

      const best = ventas[0];
      document.getElementById('bsNombre').innerText = best.nombre;
      document.getElementById('bsUnidades').innerText = best.total_vendido;
      document.getElementById('bsIngreso').innerText = 'S/ ' + parseFloat(best.total_ingreso).toFixed(2);
    } else if (canvas) {
      document.getElementById('bestSellerCard').innerHTML = `
        <div class="bs-header" style="text-align:center;padding:32px 0;color:var(--text-muted)">
          <i class="fa-solid fa-chart-simple" style="font-size:40px;display:block;margin-bottom:12px"></i>
          <p style="font-weight:400">No hay datos de ventas aún</p>
        </div>`;
    }
  });
}


function cargarCatalogo(){
  const grid = document.getElementById('catalogoGrid');
  if (!grid) return;

  const buscar = document.getElementById('buscarProducto').value.toLowerCase();
  const empty = document.getElementById('catalogoEmpty');
  const stats = document.getElementById('totalProductosCatalogo');

  fetch('/api/catalogo')
  .then(res => res.json())
  .then(data => {
    grid.innerHTML = '';

    const agrupados = {};
    data.forEach(item => {
      if (!agrupados[item.producto_id]) {
        agrupados[item.producto_id] = {
          nombre: item.nombre,
          presentaciones: []
        };
      }
      agrupados[item.producto_id].presentaciones.push(item);
    });

    const filtrados = Object.values(agrupados).filter(p =>
      p.nombre.toLowerCase().includes(buscar)
    );

    if (stats) stats.innerText = filtrados.length;

    if (filtrados.length === 0) {
      if (empty) empty.classList.remove('oculto');
      return;
    }
    if (empty) empty.classList.add('oculto');

    filtrados.forEach(producto => {
      let html = '<div class="catalogo-card-body">';

      producto.presentaciones.forEach(pr => {
        const enStock = pr.stock > 0;
        html += `
        <div class="catalogo-presentacion">
          <div class="presentacion-row">
            <div class="presentacion-info">
              <span class="presentacion-badge">${pr.categoria}</span>
              <div class="stock-indicator ${enStock ? 'in-stock' : 'out-of-stock'}">
                <i class="fa-solid ${enStock ? 'fa-circle' : 'fa-circle-xmark'}"></i>
                ${enStock ? pr.stock + ' en stock' : 'Sin stock'}
              </div>
            </div>
            <div class="presentacion-price">
              <span class="currency">S/</span> ${parseFloat(pr.precio_venta).toFixed(2)}
            </div>
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;gap:10px">
            <div class="cantidad-box">
              <button onclick="restarCantidad(this)">-</button>
              <input type="number" value="1" min="1" max="${pr.stock}"
                class="cantidad-input"
                oninput="validarCantidad(this, ${pr.stock})">
              <button onclick="sumarCantidad(this, ${pr.stock})">+</button>
            </div>
            <button class="btn-add-cart" ${!enStock ? 'disabled' : ''}
              onclick="agregarCarrito(
                ${pr.producto_id}, ${pr.presentacion_id},
                '${producto.nombre.replace(/'/g, "\\'")}',
                '${pr.categoria.replace(/'/g, "\\'")}',
                ${pr.precio_venta}, ${pr.stock}, this
              )">
              <i class="fa-solid fa-cart-plus"></i>
              ${enStock ? 'Agregar' : 'Sin stock'}
            </button>
          </div>
        </div>`;
      });

      html += '</div>';

      grid.innerHTML += `
      <div class="catalogo-card">
        <div class="catalogo-card-header">
          <div class="product-icon"><i class="fa-solid fa-box"></i></div>
          <h3>${producto.nombre}</h3>
        </div>
        ${html}
      </div>`;
    });
  });
}

function actualizarContadorCarrito(){

  const badge =
  document.getElementById(
    'contadorCarrito'
  );

  if(!badge) return;

  const carrito =
  JSON.parse(
    localStorage.getItem('carrito')
  ) || [];

  badge.innerText =
  carrito.filter(i => !(i.es_oferta && i.precio === 0)).length;

}

function sumarCantidad(btn, stock){

  const input =
  btn.parentElement
  .querySelector('.cantidad-input');

  let valor =
  parseInt(input.value);

  if(valor < stock){

    input.value = valor + 1;

  }

}

function restarCantidad(btn){

  const input =
  btn.parentElement
  .querySelector('.cantidad-input');

  let valor =
  parseInt(input.value);

  if(valor > 1){

    input.value = valor - 1;

  }

}

function validarCantidad(input, stock){

  let valor =
  parseInt(input.value);

  if(isNaN(valor) || valor < 1){

    input.value = 1;

  }

  if(valor > stock){

    input.value = stock;

  }

}

function descargarPDF(id){
  window.open('/api/pedidos-pdf/' + id, '_blank');
}

function descargarFacturaPDF(id){
  window.open('/api/pedidos-factura/' + id, '_blank');
}

/* ============================
   OFERTAS
   ============================ */
function cargarOfertasAdmin(){
  fetch('/api/ofertas')
  .then(res => res.json())
  .then(data => {
    const tabla = document.getElementById('tablaOfertas');
    if (!tabla) return;
    tabla.innerHTML = '';
    data.forEach(o => {
      const itemsStr = (o.items || []).map(i =>
        `${i.producto_nombre} (${i.presentacion_nombre}) x${i.cantidad}`
      ).join('<br>');
      tabla.innerHTML += `
        <tr>
          <td><strong>${o.nombre}</strong></td>
          <td>S/ ${parseFloat(o.precio_oferta).toFixed(2)}</td>
          <td>${itemsStr}</td>
          <td><span class="rol-badge ${o.activa ? 'admin' : 'cliente'}">${o.activa ? 'Activa' : 'Inactiva'}</span></td>
          <td>
            <button class="btn-delete-table" onclick="eliminarOferta(${o.id})"><i class="fa-solid fa-trash"></i></button>
          </td>
        </tr>`;
    });
  });
}

function guardarOferta(){
  const nombre = document.getElementById('ofertaNombre').value.trim();
  const precio = parseFloat(document.getElementById('ofertaPrecio').value);
  const items = [];
  document.querySelectorAll('.oferta-item-row').forEach(row => {
    const prod = row.querySelector('.oferta-producto').value;
    const pres = row.querySelector('.oferta-presentacion').value;
    const cant = parseInt(row.querySelector('.oferta-cantidad').value) || 1;
    if (prod && pres) items.push({ producto_id: parseInt(prod), presentacion_id: parseInt(pres), cantidad: cant });
  });

  if (!nombre || !precio || items.length === 0) {
    Swal.fire({ icon: 'warning', title: 'Complete nombre, precio y agregue al menos un producto' });
    return;
  }

  fetch('/api/ofertas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre, precio_oferta: precio, items })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      Swal.fire({ icon: 'success', title: 'Oferta creada', timer: 1500, showConfirmButton: false });
      document.getElementById('ofertaNombre').value = '';
      document.getElementById('ofertaPrecio').value = '';
      document.getElementById('ofertasItemsContainer').innerHTML = '';
      cargarOfertasAdmin();
      cargarOfertasCatalogo();
    } else {
      Swal.fire({ icon: 'error', title: 'Error', text: data.message });
    }
  })
  .catch(() => {
    Swal.fire({ icon:'error', title:'Error de conexión', text:'No se pudo conectar con el servidor' });
  });
}

function eliminarOferta(id){
  Swal.fire({
    title: '¿Eliminar oferta?', icon: 'warning', showCancelButton: true,
    confirmButtonColor: '#ef4444', confirmButtonText: 'Eliminar', cancelButtonText: 'Cancelar'
  }).then(r => {
    if (r.isConfirmed) {
      fetch('/api/ofertas/' + id, { method: 'DELETE' })
      .then(() => { cargarOfertasAdmin(); cargarOfertasCatalogo(); });
    }
  });
}

function agregarItemOferta(){
  const container = document.getElementById('ofertasItemsContainer');
  if (!container) return;
  const div = document.createElement('div');
  div.className = 'oferta-item-row';
  div.style.cssText = 'display:flex;gap:8px;align-items:center;margin-bottom:8px';
  div.innerHTML = `
    <select class="oferta-producto" style="flex:2;height:40px;border-radius:8px;border:1.5px solid var(--border);padding:0 10px;font-size:13px" onchange="cargarPresentacionesOferta(this)">
      <option value="">Producto</option>
    </select>
    <select class="oferta-presentacion" style="flex:2;height:40px;border-radius:8px;border:1.5px solid var(--border);padding:0 10px;font-size:13px">
      <option value="">Presentación</option>
    </select>
    <input type="number" class="oferta-cantidad" value="1" min="1" style="width:60px;height:40px;border-radius:8px;border:1.5px solid var(--border);text-align:center;font-size:13px">
    <button onclick="this.parentElement.remove()" style="width:36px;height:36px;padding:0;border-radius:8px;background:var(--danger-light);color:var(--danger);border:none;cursor:pointer;font-size:16px">×</button>
  `;
  container.appendChild(div);
  fetch('/api/productos?all=1')
  .then(r => r.json())
  .then(data => {
    const select = div.querySelector('.oferta-producto');
    const productos = data.data || data || [];
    const unicos = new Map();
    productos.forEach(p => {
      const key = p.producto_id || p.id;
      if (!unicos.has(key)) {
        unicos.set(key, p.nombre || p.producto_nombre);
      }
    });
    unicos.forEach((nombre, id) => {
      select.innerHTML += `<option value="${id}">${nombre}</option>`;
    });
  });
}

function cargarPresentacionesOferta(select){
  const prodId = select.value;
  const presSelect = select.closest('.oferta-item-row').querySelector('.oferta-presentacion');
  presSelect.innerHTML = '<option value="">Presentación</option>';
  if (!prodId) return;
  fetch('/api/catalogo')
  .then(r => r.json())
  .then(data => {
    data.filter(i => i.producto_id == prodId).forEach(pr => {
      presSelect.innerHTML += `<option value="${pr.presentacion_id}">${pr.categoria} - S/ ${pr.precio_venta} (stock: ${pr.stock})</option>`;
    });
  });
}

function cargarOfertasCatalogo(){
  const container = document.getElementById('ofertasCatalogo');
  if (!container) return;
  fetch('/api/ofertas/catalogo')
  .then(res => res.json())
  .then(data => {
    if (data.length === 0) { container.innerHTML = ''; return; }
    let html = '<div class="ofertas-section"><h3 class="ofertas-titulo"><i class="fa-solid fa-fire"></i> Ofertas Especiales</h3><div class="ofertas-grid">';
    data.forEach(o => {
      const itemsHtml = (o.items || []).map(i =>
        `<span class="oferta-item-nombre">${i.producto_nombre} (${i.presentacion_nombre}) x${i.cantidad}</span>`
      ).join('');
      html += `
        <div class="oferta-card">
          <div class="oferta-badge">OFERTA</div>
          <div class="oferta-card-body">
            <h4>${o.nombre}</h4>
            <div class="oferta-items-list">${itemsHtml}</div>
            <div class="oferta-precio">S/ ${parseFloat(o.precio_oferta).toFixed(2)}</div>
            <button class="btn-add-cart" onclick="agregarOfertaCarrito(${o.id}, '${o.nombre.replace(/'/g, "\\'")}', ${o.precio_oferta})">
              <i class="fa-solid fa-cart-plus"></i> Agregar al carrito
            </button>
          </div>
        </div>`;
    });
    html += '</div></div>';
    container.innerHTML = html;
  });
}

function agregarOfertaCarrito(ofertaId, nombre, precio){
  fetch('/api/ofertas/catalogo')
  .then(r => r.json())
  .then(ofertas => {
    const oferta = ofertas.find(o => o.id === ofertaId);
    if (!oferta) return;

    const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    const existe = carrito.find(i => i.tipo === 'oferta' && i.oferta_id === ofertaId);
    if (existe) {
      Swal.fire({ icon: 'info', title: 'Ya está en el carrito', timer: 1500, showConfirmButton: false });
      return;
    }

    const items = oferta.items || [];
    const primerItem = items[0] || {};

    // Item resumen de la oferta (visible en el pedido, no descuenta stock)
    carrito.push({
      es_oferta: true,
      es_resumen: true,
      tipo: 'oferta',
      oferta_id: ofertaId,
      nombre_oferta: oferta.nombre,
      nombre: '🔥 ' + oferta.nombre,
      categoria: 'Promoción',
      producto_id: primerItem.producto_id,
      presentacion_id: primerItem.presentacion_id,
      cantidad: 1,
      precio: parseFloat(oferta.precio_oferta),
      stock: 999
    });

    // Items expandidos (controlan stock, precio 0 para no afectar total)
    items.forEach(item => {
      carrito.push({
        es_oferta: true,
        tipo: 'oferta',
        oferta_id: ofertaId,
        nombre_oferta: oferta.nombre,
        producto_id: item.producto_id,
        presentacion_id: item.presentacion_id,
        cantidad: item.cantidad,
        nombre: item.producto_nombre,
        categoria: item.presentacion_nombre,
        precio: 0,
        stock: 999
      });
    });

    localStorage.setItem('carrito', JSON.stringify(carrito));
    actualizarContadorCarrito();
    Swal.fire({
      icon: 'success', title: 'Oferta agregada al carrito', text: oferta.nombre,
      timer: 1200, showConfirmButton: false, toast: true, position: 'top-end'
    });
  });
}

window.onload = () => {
  protegerRuta();
  aplicarPermisos();
  document.body.style.visibility = 'visible';
  mostrarUsuario();
  actualizarContadorCarrito();

  const page = window.location.pathname.split('/').pop();

  const bienvenido = document.getElementById('bienvenidoUsuario');
  if (bienvenido) bienvenido.innerText = localStorage.getItem('usuario') || 'Usuario';

  if (page === 'inicio.html') return;

  cargarCategorias();
  cargarProductos();
  cargarProveedores();
  cargarSelectProveedores();
  cargarUsuarios();
  cargarCarrito();
  cargarPedidos();
  if (page === 'dashboard.html') cargarDashboard();
  if (page === 'catalogo.html') { cargarCatalogo(); cargarOfertasCatalogo(); }
  if (page === 'ofertas.html') { cargarOfertasAdmin(); agregarItemOferta(); }
}