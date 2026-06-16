async function registrar() {
  const nombres = document.getElementById('nombres').value.trim();
  const apellidos = document.getElementById('apellidos').value.trim();
  const dni = document.getElementById('dni').value.trim();
  const ruc = document.getElementById('ruc') ? document.getElementById('ruc').value.trim() : '';
  const telefono = document.getElementById('telefono').value.trim();
  const correo = document.getElementById('correo').value.trim();
  const direccion = document.getElementById('direccion') ? document.getElementById('direccion').value.trim() : '';
  const usuario = document.getElementById('usuario').value.trim();
  const password = document.getElementById('password').value.trim();

  if (!nombres || !apellidos || !dni || !telefono || !correo || !usuario || !password) {
    Swal.fire({ icon: 'warning', title: 'Complete todos los campos obligatorios', timer: 1500, showConfirmButton: false });
    return;
  }

  if (!/^\d{8}$/.test(dni)) {
    Swal.fire({ icon: 'warning', title: 'El DNI debe tener 8 dígitos', timer: 1500, showConfirmButton: false });
    return;
  }

  if (ruc && !/^\d{11}$/.test(ruc)) {
    Swal.fire({ icon: 'warning', title: 'El RUC debe tener 11 dígitos', timer: 1500, showConfirmButton: false });
    return;
  }

  if (password.length < 4) {
    Swal.fire({ icon: 'warning', title: 'La contraseña es muy corta', timer: 1500, showConfirmButton: false });
    return;
  }

  try {
    const res = await fetch('/api/registro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombres, apellidos, dni, ruc: ruc || null,
        telefono, correo, direccion: direccion || null,
        usuario, password, rol: 'cliente'
      })
    });
    const data = await res.json();
    if (data.success) {
      Swal.fire({ icon: 'success', title: 'Usuario registrado', timer: 1500, showConfirmButton: false })
      .then(() => { window.location = 'index.html'; });
    } else {
      Swal.fire({ icon: 'error', title: 'Error', text: data.message || 'No se pudo registrar' });
    }
  } catch (error) {
    Swal.fire({ icon: 'error', title: 'Error de conexión', timer: 1500, showConfirmButton: false });
  }
}
