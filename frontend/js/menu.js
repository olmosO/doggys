let productosApi = [];
let carrito = [];

// =====================================================
// FUNCION GLOBAL: Mostrar Notificación (Toast)
// =====================================================
window.mostrarNotificacion = function(mensaje, tipo = 'success') {
  // Crear contenedor si no existe
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    toastContainer.style.zIndex = '1100'; // Asegurar que quede encima de todo
    document.body.appendChild(toastContainer);
  }

  // Color según tipo
  const bgClass = tipo === 'error' ? 'text-bg-danger' : 'text-bg-success';

  // HTML del Toast
  const toastHtml = `
    <div class="toast align-items-center ${bgClass} border-0" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="d-flex">
        <div class="toast-body">
          ${mensaje}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    </div>
  `;

  // Insertar y mostrar
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = toastHtml.trim();
  const toastElement = tempDiv.firstChild;
  toastContainer.appendChild(toastElement);

  const toast = new bootstrap.Toast(toastElement, { delay: 3000 }); // 3 segundos
  toast.show();

  // Limpiar DOM al ocultarse
  toastElement.addEventListener('hidden.bs.toast', () => {
    toastElement.remove();
  });
};

// =====================================================
// Cargar carrito desde localStorage
// =====================================================
function cargarCarritoDesdeStorage() {
  try {
    const data = localStorage.getItem('carrito');
    carrito = data ? JSON.parse(data) : [];
  } catch {
    carrito = [];
  }
  // Actualizar contador del navbar si existe
  if (document.getElementById("carritoCount")) {
      document.getElementById("carritoCount").textContent = carrito.length;
  }
}

// =====================================================
// Guardar carrito
// =====================================================
function guardarCarrito() {
  localStorage.setItem('carrito', JSON.stringify(carrito));
  if (document.getElementById("carritoCount")) {
      document.getElementById("carritoCount").textContent = carrito.length;
  }
}

// =====================================================
// Agregar producto al carrito
// =====================================================
function agregarAlCarrito(producto) {
  const usuarioId = localStorage.getItem('usuario_id');

  if (!usuarioId) {
    mostrarNotificacion('Debes iniciar sesión para agregar al carrito.', 'error');
    return;
  }

  // Asegurarnos de que carrito esté cargado
  cargarCarritoDesdeStorage();

  const existente = carrito.find(item => item.producto_id === producto.id);

  if (existente) {
    existente.cantidad += 1;
    existente.subtotal = existente.cantidad * existente.precio;
  } else {
    carrito.push({
      producto_id: producto.id,
      nombre: producto.nombre,
      precio: producto.precio,
      img: producto.img || "",
      cantidad: 1,
      subtotal: producto.precio
    });
  }

  guardarCarrito();
  // USAMOS LA NUEVA NOTIFICACIÓN AQUÍ
  mostrarNotificacion(`¡${producto.nombre} agregado al carrito!`);
}

// =====================================================
// Renderizar productos en el HTML
// =====================================================
function renderProductos() {
  const container = document.getElementById("productos-container");
  if (!container) return;

  container.innerHTML = "";

  productosApi.forEach(p => {
    const col = document.createElement("div");
    col.className = "col-sm-6 col-md-4 col-lg-3 d-flex justify-content-center";

    col.innerHTML = `
      <div class="product-card text-center h-100">
          <img src="${p.img || 'placeholder.jpg'}" 
               alt="${p.nombre}" 
               class="img-fluid mb-2 product-img" style="max-height: 150px; object-fit: contain;">

          <h5>${p.nombre}</h5>
          <p class="fw-bold">$${p.precio}</p>

          <button class="btn btn-success btn-sm agregar-btn">
              Agregar al carrito
          </button>
      </div>
    `;

    // Asignar evento click directamente al objeto producto
    col.querySelector(".agregar-btn").addEventListener("click", () => {
      agregarAlCarrito(p);
    });

    container.appendChild(col);
  });
}

// =====================================================
// Cargar productos desde la API
// =====================================================
async function cargarProductosApi() {
  try {
    const res = await fetch('http://127.0.0.1:8000/productos');
    if (!res.ok) return;
    productosApi = await res.json();
    renderProductos();
  } catch (err) {
    console.error('Error al obtener productos:', err);
  }
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  cargarCarritoDesdeStorage();
  cargarProductosApi();
});