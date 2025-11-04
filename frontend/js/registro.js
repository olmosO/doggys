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
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('passwordConfirm').value;

    // Validación simple de contraseña igual
    if (password !== passwordConfirm) {
      if (alertError) {
        alertError.textContent = 'Las contraseñas no coinciden. Intente de nuevo.';
        alertError.classList.remove('d-none');
      }
      if (alertSuccess) alertSuccess.classList.add('d-none');
      return;
    }

    const payload = {
      nombre: (nombre + ' ' + apellido).trim(),
      email,
      telefono,
      direccion
    };

    try {
      const res = await fetch('http://127.0.0.1:8000/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error('Error en la respuesta del servidor');
      }

      const data = await res.json();

      // Guardar usuario en localStorage
      localStorage.setItem('usuario_id', data.id);
      localStorage.setItem('usuario_nombre', data.nombre);
      localStorage.setItem('usuario_email', data.email || email);

      if (alertSuccess) {
        alertSuccess.textContent = 'Registro exitoso. ¡Bienvenido, ' + data.nombre + '!';
        alertSuccess.classList.remove('d-none');
      }
      if (alertError) alertError.classList.add('d-none');

      // Redirigir al menú luego de un momento
      setTimeout(() => {
        window.location.href = 'menu.html';
      }, 1500);
    } catch (err) {
      console.error(err);
      if (alertError) {
        alertError.textContent = 'Ocurrió un error al registrar. Intente nuevamente.';
        alertError.classList.remove('d-none');
      }
      if (alertSuccess) alertSuccess.classList.add('d-none');
    }
  });
}
