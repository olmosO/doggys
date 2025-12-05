// =====================================================
// Obtener parámetro pedido_id desde la URL
// =====================================================
function obtenerPedidoId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("pedido_id") || localStorage.getItem("pedido_id");
}

// =====================================================
// Cargar datos del pedido y mostrarlos en pantalla
// =====================================================
async function cargarDatosBoleta() {
  const mensajeError = document.getElementById("mensajeError");
  const pedidoId = obtenerPedidoId();

  if (!pedidoId) {
    mensajeError.textContent = "No se encontró el ID del pedido.";
    mensajeError.classList.remove("d-none");
    return;
  }

  try {
    // ===== 1. OBTENER PEDIDO =====
    const resPedido = await fetch(`http://127.0.0.1:8000/pedidos/${pedidoId}`);
    if (!resPedido.ok) throw new Error("Error al cargar pedido.");

    const pedido = await resPedido.json();

    document.getElementById("fechaBoleta").textContent = new Date().toLocaleString();

    // ===== 2. OBTENER INFO DEL USUARIO =====
    const usuarioRes = await fetch(`http://127.0.0.1:8000/usuarios/${pedido.usuario_id}`);
    const usuario = await usuarioRes.json();

    document.getElementById("nombreCliente").value = usuario.nombre || "";
    document.getElementById("correoCliente").value = usuario.email || "";

    // ===== 3. OBTENER INFO COMPLETA DE CADA PRODUCTO =====
    const tbody = document.getElementById("tablaPedido").querySelector("tbody");
    tbody.innerHTML = "";

    let total = 0;

    for (const item of pedido.items) {
      // Obtener información del producto
      const resProd = await fetch(`http://127.0.0.1:8000/productos/${item.producto_id}`);
      const producto = await resProd.json();

      const nombre = producto.nombre || "Producto";
      const precio = producto.precio || 0;
      const cantidad = item.cantidad;
      const subtotal = precio * cantidad;

      total += subtotal;

      // Agregar fila
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${nombre}</td>
        <td>${cantidad}</td>
        <td>$${precio}</td>
        <td>$${subtotal}</td>
      `;
      tbody.appendChild(tr);
    }

    document.getElementById("totalPedido").textContent = total;

    // Guardar para generar boleta después
    window.__pedidoData = { pedido, total };

  } catch (err) {
    console.error(err);
    mensajeError.textContent = "Error al cargar datos de boleta.";
    mensajeError.classList.remove("d-none");
  }
}

// =====================================================
// Generar boleta final en el backend
// =====================================================
async function generarBoleta() {
  const mensajeExito = document.getElementById("mensajeExito");
  const mensajeError = document.getElementById("mensajeError");
  const mensajeCampos = document.getElementById("mensajeCampos");

  const nombreCliente = document.getElementById("nombreCliente").value.trim();
  const correoCliente = document.getElementById("correoCliente").value.trim();
  const pedidoId = obtenerPedidoId();

  if (!nombreCliente || !correoCliente) {
    mensajeCampos.classList.remove("d-none");
    return;
  } else {
    mensajeCampos.classList.add("d-none");
  }

  try {
    const res = await fetch("http://127.0.0.1:8000/boletas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pedido_id: pedidoId })
    });

    const data = await res.json();

    if (!res.ok) {
      mensajeError.textContent = data.detail || "Error al generar boleta.";
      mensajeError.classList.remove("d-none");
      mensajeExito.classList.add("d-none");
      return;
    }

    // Mostrar número de boleta
    document.getElementById("numBoleta").textContent = data.id;

    mensajeExito.textContent = `Boleta #${data.id} generada correctamente por un total de $${data.total}. Será enviada a su correo electrónico.`;
    mensajeExito.classList.remove("d-none");
    mensajeError.classList.add("d-none");

  } catch (err) {
    console.error(err);
    mensajeError.textContent = "Error inesperado al generar la boleta.";
    mensajeError.classList.remove("d-none");
    mensajeExito.classList.add("d-none");
  }
}

// =====================================================
// Evento inicial
// =====================================================
document.addEventListener("DOMContentLoaded", () => {
  cargarDatosBoleta();

  const btnGenerar = document.getElementById("btnGenerar");
  if (btnGenerar) {
    btnGenerar.addEventListener("click", generarBoleta);
  }
});
