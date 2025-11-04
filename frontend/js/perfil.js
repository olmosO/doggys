const perfilForm = document.getElementById('perfilForm');
const perfilMsgExito = document.getElementById('mensajeExito');
const perfilMsgError = document.getElementById('mensajeError');

async function cargarPerfil() {
  const usuarioId = localStorage.getItem('usuario_id');
  const usuarioEmail = localStorage.getItem('usuario_email');

  if (!usuarioId) {
    console.warn('No hay usuario logueado, redirigiendo a login...');
    window.location.href = 'login.html';
    return;
  }

  try {
    const res = await fetch(`http://127.0.0.1:8000/usuarios/${usuarioId}`);
    if (!res.ok) throw new Error('No se pudo obtener el usuario');
    const data = await res.json();

    const nombreInput = document.getElementById('nombre');
    const telefonoInput = document.getElementById('telefono');
    const direccionInput = document.getElementById('direccion');

    if (nombreInput) nombreInput.value = data.nombre || '';
    if (telefonoInput) telefonoInput.value = data.telefono || '';
    if (direccionInput) direccionInput.value = data.direccion || '';

    // Guardar email si viene desde la API
    if (data.email) {
      localStorage.setItem('usuario_email', data.email);
    } else if (usuarioEmail) {
      // mantener el existente
    }
  } catch (err) {
    console.error(err);
  }
}

if (perfilForm) {
  perfilForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const usuarioId = localStorage.getItem('usuario_id');
    const email = localStorage.getItem('usuario_email');

    const nombre = document.getElementById('nombre').value.trim();
    const telefono = document.getElementById('telefono').value.trim();
    const direccion = document.getElementById('direccion').value.trim();

    const telefonoValido = /^\+?[\d\s-]{8,20}$/;

    if (!nombre || !direccion || !telefonoValido.test(telefono)) {
      if (perfilMsgError) perfilMsgError.classList.remove('d-none');
      if (perfilMsgExito) perfilMsgExito.classList.add('d-none');
      return;
    }

    const payload = { nombre, telefono, direccion, email };

    try {
      const res = await fetch(`http://127.0.0.1:8000/usuarios/${usuarioId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Error al actualizar');

      if (perfilMsgExito) perfilMsgExito.classList.remove('d-none');
      if (perfilMsgError) perfilMsgError.classList.add('d-none');
    } catch (err) {
      console.error(err);
      if (perfilMsgError) perfilMsgError.classList.remove('d-none');
      if (perfilMsgExito) perfilMsgExito.classList.add('d-none');
    }
  });

  // cargar datos al entrar a la página
  cargarPerfil();
}
