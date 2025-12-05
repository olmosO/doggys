// =====================================================
// Obtener carrito desde localStorage
// =====================================================
function obtenerCarrito() {
  try {
    const data = localStorage.getItem('carrito');
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

// =====================================================
// Mostrar carrito en el checkout
// =====================================================
function mostrarCarritoEnCheckout() {
  const lista = document.getElementById("listaCarrito");
  const carrito = obtenerCarrito();

  let total = 0;
  lista.innerHTML = "";

  carrito.forEach(item => {
    total += item.subtotal;

    const li = document.createElement("li");
    li.className = "list-group-item d-flex justify-content-between";

    li.innerHTML = `
      ${item.nombre} x${item.cantidad}
      <span>$${item.subtotal}</span>
    `;

    lista.appendChild(li);
  });

  document.getElementById("totalCarrito").textContent = total;
}

// =====================================================
// Procesar pago (crear pedido + marcar pagado)
// =====================================================
async function procesarPago() {
  const mensajeExito = document.getElementById('mensajeExito');
  const mensajeError = document.getElementById('mensajeError');

  const usuarioId = localStorage.getItem('usuario_id');
  const carrito = obtenerCarrito();

  // Validaciones
  if (!usuarioId) {
    mensajeError.textContent = 'Debe iniciar sesión antes de pagar.';
    mensajeError.classList.remove('d-none');
    mensajeExito.classList.add('d-none');
    return false;
  }

  if (!carrito.length) {
    mensajeError.textContent = 'No hay productos en el carrito.';
    mensajeError.classList.remove('d-none');
    mensajeExito.classList.add('d-none');
    return false;
  }

  const items = carrito.map(item => ({
    producto_id: item.producto_id,
    cantidad: item.cantidad
  }));

  const payload = {
    usuario_id: usuarioId,
    items: items,
    estado: 'pendiente'
  };

  try {
    // Crear pedido
    const res = await fetch('http://127.0.0.1:8000/pedidos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const pedido = await res.json();

    if (!res.ok) {
      mensajeError.textContent = pedido.detail || 'Error al crear el pedido.';
      mensajeError.classList.remove('d-none');
      mensajeExito.classList.add('d-none');
      return false;
    }

    localStorage.setItem('pedido_id', pedido.id);

    // Cambiar estado a pagado (descuenta stock)
    const resEstado = await fetch(
      `http://127.0.0.1:8000/pedidos/${pedido.id}/estado?nuevo_estado=pagado`,
      { method: 'PATCH' }
    );

    if (!resEstado.ok) {
      const err = await resEstado.json();
      mensajeError.textContent = err.detail || 'Error al cambiar estado del pedido.';
      mensajeError.classList.remove('d-none');
      mensajeExito.classList.add('d-none');
      return false;
    }

    // Limpiar carrito local
    localStorage.removeItem('carrito');

    mensajeExito.textContent = `Pago realizado con éxito. Pedido N° ${pedido.id}`;
    mensajeExito.classList.remove('d-none');
    mensajeError.classList.add('d-none');

    // Redirigir a la boleta
    setTimeout(() => {
      window.location.href = `boleta.html?pedido_id=${pedido.id}`;
    }, 1500);

  } catch (err) {
    console.error(err);
    mensajeError.textContent = 'Pago rechazado, intente nuevamente.';
    mensajeError.classList.remove('d-none');
    mensajeExito.classList.add('d-none');
  }

  return false;
}

// =====================================================
// Inicializar
// =====================================================
document.addEventListener('DOMContentLoaded', () => {
  mostrarCarritoEnCheckout();

  const formPago = document.getElementById('formPago');
  if (formPago) {
    formPago.addEventListener('submit', (e) => {
      e.preventDefault();
      procesarPago();
    });
  }
});
