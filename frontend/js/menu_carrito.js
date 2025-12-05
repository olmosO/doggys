let carrito = [];

// =====================================================
// Cargar carrito desde localStorage
// =====================================================
function cargarCarrito() {
  try {
    const data = localStorage.getItem('carrito');
    carrito = data ? JSON.parse(data) : [];
  } catch {
    carrito = [];
  }

  renderCarrito();
}

// =====================================================
// Guardar carrito en localStorage
// =====================================================
function guardarCarrito() {
  localStorage.setItem('carrito', JSON.stringify(carrito));
}

// =====================================================
// Eliminar un producto por índice
// =====================================================
function eliminarDelCarrito(index) {
  carrito.splice(index, 1);
  guardarCarrito();
  renderCarrito();
}

// =====================================================
// Renderizar tabla del carrito
// =====================================================
function renderCarrito() {
  const tbody = document
    .getElementById('tablaCarrito')
    .querySelector('tbody');

  tbody.innerHTML = '';

  let total = 0;

  carrito.forEach((item, index) => {
    total += item.subtotal;

    const tr = document.createElement('tr');

    tr.innerHTML = `
      <td>${item.nombre}</td>
      <td>${item.cantidad}</td>
      <td>$${item.subtotal}</td>
      <td>
        <button class="btn btn-danger btn-sm" onclick="eliminarDelCarrito(${index})">
          Eliminar
        </button>
      </td>
    `;

    tbody.appendChild(tr);
  });

  document.getElementById('totalCarrito').textContent = total;
}

// =====================================================
// Botón "Continuar con la compra"
// =====================================================
function configurarBotonContinuar() {
  const btn = document.getElementById('btnContinuar');

  btn.addEventListener('click', () => {
    if (carrito.length === 0) {
      alert('Tu carrito está vacío');
      return;
    }

    // Simplemente redirigimos al checkout
    window.location.href = 'checkout.html';
  });
}

// =====================================================
// Inicializar
// =====================================================
document.addEventListener('DOMContentLoaded', () => {
  cargarCarrito();
  configurarBotonContinuar();
});
