let carrito = [];

// =====================================================
// Cargar carrito
// =====================================================
function cargarCarrito() {
  try {
    const data = localStorage.getItem('carrito');
    carrito = data ? JSON.parse(data) : [];
  } catch {
    carrito = [];
  }
  renderCarrito();
  actualizarContadorNavbar();
}

function actualizarContadorNavbar() {
    if (document.getElementById("carritoCount")) {
        document.getElementById("carritoCount").textContent = carrito.length;
    }
}

// =====================================================
// Guardar carrito
// =====================================================
function guardarCarrito() {
  localStorage.setItem('carrito', JSON.stringify(carrito));
  actualizarContadorNavbar();
}

// =====================================================
// CAMBIAR CANTIDAD (+ o -)
// =====================================================
function cambiarCantidad(index, delta) {
  const item = carrito[index];
  
  // Actualizar cantidad
  item.cantidad += delta;

  // Evitar que baje de 1 (para eliminar usar el botón eliminar)
  if (item.cantidad < 1) {
    item.cantidad = 1;
  }

  // Recalcular subtotal del item
  item.subtotal = item.cantidad * item.precio;

  guardarCarrito();
  renderCarrito();
}

// =====================================================
// Eliminar producto
// =====================================================
function eliminarDelCarrito(index) {
  if(confirm("¿Seguro que deseas eliminar este producto?")) {
      carrito.splice(index, 1);
      guardarCarrito();
      renderCarrito();
  }
}

// =====================================================
// Renderizar Tabla
// =====================================================
function renderCarrito() {
  const tbody = document.getElementById('tablaCarrito').querySelector('tbody');
  tbody.innerHTML = '';

  let total = 0;

  if (carrito.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="text-center">Tu carrito está vacío.</td></tr>';
      document.getElementById('totalCarrito').textContent = '0';
      return;
  }

  carrito.forEach((item, index) => {
    total += item.subtotal;

    const tr = document.createElement('tr');
    tr.className = "align-middle"; // Centrar verticalmente

    tr.innerHTML = `
      <td>
        <div class="d-flex align-items-center">
            ${item.img ? `<img src="${item.img}" width="50" class="me-2 rounded">` : ''}
            <span>${item.nombre}</span>
        </div>
      </td>
      <td>
        <div class="btn-group btn-group-sm" role="group">
            <button class="btn btn-outline-secondary" onclick="cambiarCantidad(${index}, -1)">-</button>
            <button class="btn btn-outline-secondary disabled" style="width: 40px; color: black; border-color: #6c757d;">${item.cantidad}</button>
            <button class="btn btn-outline-secondary" onclick="cambiarCantidad(${index}, 1)">+</button>
        </div>
      </td>
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
// Inicializar
// =====================================================
document.addEventListener('DOMContentLoaded', () => {
  cargarCarrito();
  
  const btnContinuar = document.getElementById('btnContinuar');
  if(btnContinuar){
      btnContinuar.addEventListener('click', () => {
        if (carrito.length === 0) {
          // Usamos la notificación si está disponible, si no alert
          if(window.mostrarNotificacion) window.mostrarNotificacion('Tu carrito está vacío', 'error');
          else alert('Tu carrito está vacío');
          return;
        }
        window.location.href = 'checkout.html';
      });
  }
});