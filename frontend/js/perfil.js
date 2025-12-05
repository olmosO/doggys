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

    // Rellenar inputs
    document.getElementById('nombre').value = data.nombre || '';
    document.getElementById('telefono').value = data.telefono || '';
    document.getElementById('direccion').value = data.direccion || '';

    // Guardar email si viene desde la API
    if (data.email) {
      localStorage.setItem('usuario_email', data.email);
    }

    // Guardar también el rol del usuario
    if (data.is_admin !== undefined) {
      localStorage.setItem('is_admin', data.is_admin);
    }

  } catch (err) {
    console.error('Error al cargar perfil:', err);
  }
}

if (perfilForm) {
  perfilForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const usuarioId = localStorage.getItem('usuario_id');
    const email = localStorage.getItem('usuario_email');
    const is_admin = localStorage.getItem('is_admin') === 'true';  // conservar el rol

    const nombre = document.getElementById('nombre').value.trim();
    const telefono = document.getElementById('telefono').value.trim();
    const direccion = document.getElementById('direccion').value.trim();

    const telefonoValido = /^\+?[\d\s-]{8,20}$/;

    if (!nombre || !direccion || !telefonoValido.test(telefono)) {
      perfilMsgError.classList.remove('d-none');
      perfilMsgExito.classList.add('d-none');
      return;
    }

    const payload = { 
      nombre, 
      telefono, 
      direccion, 
      email,
      is_admin  // ← MUY IMPORTANTE para no perder privilegios
    };

    try {
      const res = await fetch(`http://127.0.0.1:8000/usuarios/${usuarioId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Error al actualizar');

      perfilMsgExito.classList.remove('d-none');
      perfilMsgError.classList.add('d-none');

    } catch (err) {
      console.error('Error al actualizar el perfil:', err);
      perfilMsgError.classList.remove('d-none');
      perfilMsgExito.classList.add('d-none');
    }
  });

  // Cargar datos al entrar a la página
  cargarPerfil();
}
