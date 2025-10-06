/* inactividad.js - Cierre de sesión por inactividad */

let segundos = 0;
const limite = 1800; // 30 minutos (1800 segundos)

function actualizarContador() {
  segundos++;
  if (segundos >= limite) {
    alert('Sesión expirada por inactividad. Redirigiendo a login.');
    window.location.href = 'login.html'; // redirige al login
  }
}

function reiniciarContador() {
  segundos = 0;
}

// Ejecutar actualización cada segundo
setInterval(actualizarContador, 1000);

// Reiniciar contador con cualquier interacción
['mousemove', 'keydown', 'click', 'scroll'].forEach(evt => {
  document.body.addEventListener(evt, reiniciarContador);
});
