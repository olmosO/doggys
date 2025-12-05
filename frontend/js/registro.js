const registroForm = document.getElementById('registroForm');
const alertSuccess = document.getElementById('alert-success');
const alertError = document.getElementById('alert-error');

if (registroForm) {
  registroForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const nombre = document.getElementById('nombre').value.trim();
    const apellido = document.getElementById('apellido').value.trim();
    const email = document.getElementById('email').value.trim();
    const telefono = document.getElementById('telefono').value.trim();
    const direccion = document.getElementById('direccion').value.trim();

    // Validación mínima
    if (!nombre || !apellido || !email || !direccion) {
      alertError.textContent = 'Debe completar todos los campos obligatorios.';
      alertError.classList.remove('d-none');
      alertSuccess.classList.add('d-none');
      return;
    }

    const telefonoValido = /^\+?[\d\s-]{8,20}$/;
    if (telefono && !telefonoValido.test(telefono)) {
      alertError.textContent = 'Ingrese un teléfono válido.';
      alertError.classList.remove('d-none');
      alertSuccess.classList.add('d-none');
      return;
    }

    const payload = {
      nombre: (nombre + ' ' + apellido).trim(),
      email,
      telefono,
      direccion,
      is_admin: false   // Importante para mantener consistencia con Pydantic
    };

    try {
      const res = await fetch('http://127.0.0.1:8000/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        let msg = 'Ocurrió un error al registrar.';

        if (errData.detail === 'Correo ya registrado') {
          msg = 'Este correo ya está registrado.';
        }

        alertError.textContent = msg;
        alertError.classList.remove('d-none');
        alertSuccess.classList.add('d-none');
        return;
      }

      const data = await res.json();

      // Guardar usuario en localStorage
      localStorage.setItem('usuario_id', data.id);
      localStorage.setItem('usuario_nombre', data.nombre);
      localStorage.setItem('usuario_email', data.email);
      localStorage.setItem('is_admin', data.is_admin);  // <-- Nuevo
      localStorage.setItem('usuario_direccion', data.direccion || direccion);
      localStorage.setItem('usuario_telefono', data.telefono || telefono);

      alertSuccess.textContent = 'Registro exitoso. ¡Bienvenido, ' + data.nombre + '!';
      alertSuccess.classList.remove('d-none');
      alertError.classList.add('d-none');

      // Redirigir al perfil después de registrarse
      setTimeout(() => {
        window.location.href = 'perfil.html';
      }, 1500);

    } catch (err) {
      console.error(err);
      alertError.textContent = 'Error inesperado. Intente nuevamente.';
      alertError.classList.remove('d-none');
      alertSuccess.classList.add('d-none');
    }
  });
}
