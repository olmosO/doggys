const loginForm = document.getElementById('loginForm');
const loginAlertSuccess = document.getElementById('alert-success');
const loginAlertError = document.getElementById('alert-error');

if (loginForm) {
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim(); // NUEVO

    // Validación
    if (!email || !password) {
      loginAlertError.textContent = 'Debe ingresar correo y contraseña.';
      loginAlertError.classList.remove('d-none');
      loginAlertSuccess.classList.add('d-none');
      return;
    }

    try {
      const res = await fetch('http://127.0.0.1:8000/usuarios/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Enviamos email y password
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) {
        throw new Error('Credenciales incorrectas');
      }

      const data = await res.json();

      // Guardar datos de sesión
      localStorage.setItem('usuario_id', data.usuario_id);
      localStorage.setItem('usuario_nombre', data.nombre || "");
      localStorage.setItem('usuario_email', data.email || "");

      const adminFlag = data.is_admin === true;
      localStorage.setItem('is_admin', adminFlag);

      loginAlertSuccess.textContent =
        `Inicio de sesión exitoso. ¡Bienvenido, ${data.nombre}!`;
      loginAlertSuccess.classList.remove('d-none');
      loginAlertError.classList.add('d-none');

      // Redirección según rol
      setTimeout(() => {
        if (adminFlag) {
          window.location.href = 'dashboard_productos.html';
        } else {
          window.location.href = 'menu.html';
        }
      }, 800);

    } catch (err) {
      console.error(err);
      loginAlertError.textContent = 'Correo o contraseña incorrectos.';
      loginAlertError.classList.remove('d-none');
      loginAlertSuccess.classList.add('d-none');
    }
  });
}