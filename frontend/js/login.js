const loginForm = document.getElementById('loginForm');
const loginAlertSuccess = document.getElementById('alert-success');
const loginAlertError = document.getElementById('alert-error');

if (loginForm) {
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = document.getElementById('email').value.trim();

    if (!email) {
      loginAlertError.textContent = 'Debe ingresar un correo.';
      loginAlertError.classList.remove('d-none');
      loginAlertSuccess.classList.add('d-none');
      return;
    }

    try {
      const res = await fetch('http://127.0.0.1:8000/usuarios/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (!res.ok) {
        throw new Error('Correo no registrado');
      }

      const data = await res.json();

      // Verificación extra
      if (!data.usuario_id) {
        throw new Error("El backend no envió el usuario_id");
      }

      // Guardar datos de sesión
      localStorage.setItem('usuario_id', data.usuario_id);
      localStorage.setItem('usuario_nombre', data.nombre || "");
      localStorage.setItem('usuario_email', data.email || "");

      // Si no viene "is_admin", asumimos false
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
      loginAlertError.textContent = 'Correo incorrecto o no registrado.';
      loginAlertError.classList.remove('d-none');
      loginAlertSuccess.classList.add('d-none');
    }
  });
}
