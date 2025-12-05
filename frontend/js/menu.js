let productosApi = [];
let carrito = [];

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
}

// =====================================================
// Guardar carrito
// =====================================================
function guardarCarrito() {
  localStorage.setItem('carrito', JSON.stringify(carrito));
}

// =====================================================
// Agregar producto al carrito
// =====================================================
function agregarAlCarrito(producto) {
  const usuarioId = localStorage.getItem('usuario_id');

  if (!usuarioId) {
    alert('Debes iniciar sesión antes de agregar al carrito.');
    return;
  }

  const existente = carrito.find(item => item.producto_id === producto.id);

  if (existente) {
    existente.cantidad += 1;
    existente.subtotal = existente.cantidad * existente.precio;
  } else {
    carrito.push({
      producto_id: producto.id,
      nombre: producto.nombre,
      precio: producto.precio,
      img: producto.img || "",  // opcional
      cantidad: 1,
      subtotal: producto.precio
    });
  }

  guardarCarrito();
  alert(`"${producto.nombre}" agregado al carrito`);
}

// =====================================================
// Renderizar productos en el HTML
// =====================================================
function renderProductos() {
  const container = document.getElementById("productos-container");

  if (!container) return;

  container.innerHTML = ""; // limpiar

  productosApi.forEach(p => {
    const col = document.createElement("div");
    col.className = "col-sm-6 col-md-4 col-lg-3 d-flex justify-content-center";

    col.innerHTML = `
      <div class="product-card text-center">
          <img src="${p.img || 'placeholder.jpg'}" 
               alt="${p.nombre}" 
               class="img-fluid mb-2 product-img">

          <h5>${p.nombre}</h5>
          <p>$${p.precio}</p>

          <button class="btn btn-success btn-sm agregar-btn">
              Agregar al carrito
          </button>
      </div>
    `;

    // Botón agregar
    col.querySelector(".agregar-btn").addEventListener("click", () => {
      agregarAlCarrito(p);
    });

    container.appendChild(col);
  });
}

// =====================================================
// Cargar productos desde la API y renderizar
// =====================================================
async function cargarProductosApi() {
  try {
    const res = await fetch('http://127.0.0.1:8000/productos');

    if (!res.ok) {
      console.warn('No se pudieron cargar productos desde la API');
      return;
    }

    productosApi = await res.json();
    renderProductos();

  } catch (err) {
    console.error('Error al obtener productos:', err);
  }
}

// =====================================================
// Inicialización
// =====================================================
document.addEventListener('DOMContentLoaded', () => {
  cargarCarritoDesdeStorage();
  cargarProductosApi();
});
