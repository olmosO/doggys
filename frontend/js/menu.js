let productosApi = [];
let carrito = [];

function cargarCarritoDesdeStorage() {
  try {
    const data = localStorage.getItem('carrito');
    carrito = data ? JSON.parse(data) : [];
  } catch {
    carrito = [];
  }
}

async function cargarProductosApi() {
  try {
    const res = await fetch('http://127.0.0.1:8000/productos');
    if (!res.ok) {
      console.warn('No se pudieron cargar productos desde la API');
      return;
    }
    productosApi = await res.json();
  } catch (err) {
    console.error('Error al obtener productos:', err);
  }
}

function guardarCarrito() {
  localStorage.setItem('carrito', JSON.stringify(carrito));
}

function agregarAlCarrito(nombre) {
  const usuarioId = localStorage.getItem('usuario_id');
  if (!usuarioId) {
    alert('Debes iniciar sesión antes de agregar al carrito.');
    return;
  }

  // Buscar el producto en la API por nombre
  const producto = productosApi.find(p => p.nombre === nombre);
  if (!producto) {
    alert('Producto no encontrado en el sistema. Asegúrate de haberlo creado en el backend.');
    return;
  }

  const existente = carrito.find(item => item.producto_id === producto.id);
  if (existente) {
    existente.cantidad += 1;
    existente.subtotal = existente.precio * existente.cantidad;
  } else {
    carrito.push({
      producto_id: producto.id,
      nombre: producto.nombre,
      precio: producto.precio,
      cantidad: 1,
      subtotal: producto.precio
    });
  }

  guardarCarrito();
  alert('Producto agregado al carrito');
}

// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', () => {
  cargarCarritoDesdeStorage();
  cargarProductosApi();
});
