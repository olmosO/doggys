const API_URL = "http://127.0.0.1:8000";

let estadoAnterior = null;

// =====================================================
// Obtener pedido_id desde URL o localStorage
// =====================================================
function obtenerPedidoId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("pedido_id") || localStorage.getItem("pedido_id");
}

// =====================================================
// Marcar el estado visualmente
// =====================================================
function marcarEstado(estado) {
  const todos = document.querySelectorAll("#progresoPedido li span");
  todos.forEach(b => b.classList.replace("bg-success", "bg-secondary"));

  const seleccionado = document.querySelector(`#estado-${estado} span`);
  if (seleccionado) seleccionado.classList.replace("bg-secondary", "bg-success");
}

// =====================================================
// Renderizar tabla de items
// =====================================================
function renderItems(items) {
  const tbody = document.querySelector("#tablaItems tbody");
  tbody.innerHTML = "";

  items.forEach(item => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.nombre}</td>
      <td>${item.cantidad}</td>
      <td>$${item.subtotal}</td>
    `;
    tbody.appendChild(tr);
  });
}

// =====================================================
// Cargar datos iniciales
// =====================================================
async function cargarPedido() {
  const pedidoId = obtenerPedidoId();
  if (!pedidoId) return alert("No se encontró el ID del pedido.");

  document.getElementById("pedidoIdTexto").textContent = pedidoId;

  try {
    const res = await fetch(`${API_URL}/pedidos/${pedidoId}`);
    const pedido = await res.json();

    // Nombre del cliente
    const usuarioRes = await fetch(`${API_URL}/usuarios/${pedido.usuario_id}`);
    const usuario = await usuarioRes.json();
    document.getElementById("nombreCliente").textContent = usuario.nombre;

    // Tabla y estado
    renderItems(pedido.items);
    marcarEstado(pedido.estado);

    // Detectar cambios
    if (estadoAnterior && estadoAnterior !== pedido.estado) {
      const msg = document.getElementById("msgCambio");
      msg.classList.remove("d-none");
      setTimeout(() => msg.classList.add("d-none"), 3000);
    }

    estadoAnterior = pedido.estado;

  } catch (err) {
    console.error(err);
    alert("Error al cargar el pedido.");
  }
}

// =====================================================
// Polling cada 5 segundos
// =====================================================
setInterval(cargarPedido, 5000);

// Inicial
document.addEventListener("DOMContentLoaded", cargarPedido);
