async function generarBoleta() {
  const mensajeExito = document.getElementById('mensajeExito');
  const mensajeError = document.getElementById('mensajeError');
  const mensajeCampos = document.getElementById('mensajeCampos');

  const nombreCliente = document.getElementById('nombreCliente')?.value.trim();
  const correoCliente = document.getElementById('correoCliente')?.value.trim();

  if (!nombreCliente || !correoCliente) {
    if (mensajeCampos) mensajeCampos.classList.remove('d-none');
    if (mensajeExito) mensajeExito.classList.add('d-none');
    if (mensajeError) mensajeError.classList.add('d-none');
    return;
  } else {
    if (mensajeCampos) mensajeCampos.classList.add('d-none');
  }

  let pedidoId = localStorage.getItem('pedido_id');
  if (!pedidoId) {
    // Si no hay pedido en localStorage, pedirlo al usuario
    pedidoId = prompt('Ingrese el ID del pedido para generar la boleta:');
  }

  if (!pedidoId) {
    if (mensajeError) {
      mensajeError.textContent = 'Debe indicar un pedido válido.';
      mensajeError.classList.remove('d-none');
    }
    if (mensajeExito) mensajeExito.classList.add('d-none');
    return;
  }

  try {
    const res = await fetch('http://127.0.0.1:8000/boletas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pedido_id: parseInt(pedidoId, 10) })
    });

    if (!res.ok) throw new Error('Error al generar boleta');
    const boleta = await res.json();

    if (mensajeExito) {
      mensajeExito.textContent = `Boleta N° ${boleta.id} generada exitosamente por un total de $${boleta.total}.`;
      mensajeExito.classList.remove('d-none');
    }
    if (mensajeError) mensajeError.classList.add('d-none');
  } catch (err) {
    console.error(err);
    if (mensajeError) {
      mensajeError.textContent = 'Error al generar la boleta. Intente nuevamente.';
      mensajeError.classList.remove('d-none');
    }
    if (mensajeExito) mensajeExito.classList.add('d-none');
  }
}
