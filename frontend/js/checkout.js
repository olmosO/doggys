function obtenerCarrito() {
  try {
    const data = localStorage.getItem('carrito');
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

async function procesarPago() {
  const mensajeExito = document.getElementById('mensajeExito');
  const mensajeError = document.getElementById('mensajeError');

  const usuarioId = localStorage.getItem('usuario_id');
  const carrito = obtenerCarrito();

  if (!usuarioId) {
    if (mensajeError) {
      mensajeError.textContent = 'Debe iniciar sesión antes de pagar.';
      mensajeError.classList.remove('d-none');
    }
    if (mensajeExito) mensajeExito.classList.add('d-none');
    return false;
  }

  if (!carrito.length) {
    if (mensajeError) {
      mensajeError.textContent = 'No hay productos en el carrito.';
      mensajeError.classList.remove('d-none');
    }
    if (mensajeExito) mensajeExito.classList.add('d-none');
    return false;
  }

  const items = carrito.map(item => ({
    producto_id: item.producto_id,
    cantidad: item.cantidad
  }));

  const payload = {
    usuario_id: parseInt(usuarioId, 10),
    items: items,
    estado: 'pendiente'
  };

  try {
    // Crear pedido (carrito) en backend
    const res = await fetch('http://127.0.0.1:8000/pedidos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error('Error al crear pedido');
    const pedido = await res.json();
    localStorage.setItem('pedido_id', pedido.id);

    // Marcar como pagado (descuenta stock)
    const resEstado = await fetch(`http://127.0.0.1:8000/pedidos/${pedido.id}/estado?nuevo_estado=pagado`, {
      method: 'PATCH'
    });
    if (!resEstado.ok) throw new Error('Error al cambiar estado del pedido');

    // Limpiar carrito local
    localStorage.removeItem('carrito');

    if (mensajeExito) {
      mensajeExito.textContent = 'Pago realizado con éxito. Pedido N° ' + pedido.id;
      mensajeExito.classList.remove('d-none');
    }
    if (mensajeError) mensajeError.classList.add('d-none');

    // Opcional: redirigir a estado_pedido o boleta
    // setTimeout(() => { window.location.href = 'estado_pedido.html'; }, 1500);
  } catch (err) {
    console.error(err);
    if (mensajeError) {
      mensajeError.textContent = 'Pago rechazado, intente nuevamente.';
      mensajeError.classList.remove('d-none');
    }
    if (mensajeExito) mensajeExito.classList.add('d-none');
  }

  return false; // evitar submit real
}

// Si el formulario existe, evitar envío real
document.addEventListener('DOMContentLoaded', () => {
  const formPago = document.getElementById('formPago');
  if (formPago) {
    formPago.addEventListener('submit', (e) => {
      e.preventDefault();
      procesarPago();
    });

    // Opcional: podríamos renderizar el carrito en #listaCarrito usando localStorage
  }
});
