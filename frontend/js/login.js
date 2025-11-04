const loginForm = document.getElementById('loginForm');
const loginAlertSuccess = document.getElementById('alert-success');
const loginAlertError = document.getElementById('alert-error');

if (loginForm) {
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!email) {
      if (loginAlertError) {
        loginAlertError.textContent = 'Debe ingresar un correo.';
        loginAlertError.classList.remove('d-none');
      }
      if (loginAlertSuccess) loginAlertSuccess.classList.add('d-none');
      return;
    }

    try {
      const res = await fetch('http://127.0.0.1:8000/usuarios/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (!res.ok) {
        throw new Error('Credenciales inválidas');
      }

      const data = await res.json();

      // Guardar datos de sesión
      localStorage.setItem('usuario_id', data.usuario_id);
      localStorage.setItem('usuario_nombre', data.nombre);
      localStorage.setItem('usuario_email', data.email);

      if (loginAlertSuccess) {
        loginAlertSuccess.textContent = 'Inicio de sesión exitoso. ¡Bienvenido, ' + data.nombre + '!';
        loginAlertSuccess.classList.remove('d-none');
      }
      if (loginAlertError) loginAlertError.classList.add('d-none');

      setTimeout(() => {
        window.location.href = 'perfil.html';
      }, 1500);
    } catch (err) {
      console.error(err);
      if (loginAlertError) {
        loginAlertError.textContent = 'Correo o contraseña incorrectos.';
        loginAlertError.classList.remove('d-none');
      }
      if (loginAlertSuccess) loginAlertSuccess.classList.add('d-none');
    }
  });
}
