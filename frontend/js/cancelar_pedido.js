const API = "http://127.0.0.1:8000";
const tabla = document.querySelector("#tablaPedidos tbody");
const msgExito = document.getElementById("mensajeExito");
const msgError = document.getElementById("mensajeError");

// ===============================
// Cargar pedidos del usuario
// ===============================
async function cargarPedidos() {
  tabla.innerHTML = "<tr><td colspan='4'>Cargando...</td></tr>";

  const usuarioId = localStorage.getItem("usuario_id");
  if (!usuarioId) {
    window.location.href = "login.html";
    return;
  }

  try {
    const res = await fetch(`${API}/pedidos?usuario_id=${usuarioId}`);
    const pedidos = await res.json();

    tabla.innerHTML = "";

    if (pedidos.length === 0) {
      tabla.innerHTML = "<tr><td colspan='4'>No tienes pedidos.</td></tr>";
      return;
    }

    pedidos.forEach(p => {
      const cancellable = (p.estado === "pendiente" || p.estado === "pagado");

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${p.id}</td>
        <td>${p.estado}</td>
        <td>$${p.total}</td>
        <td>
          ${
            cancellable
            ? `<button class="btn btn-danger btn-sm" onclick="cancelarPedido('${p.id}')">Cancelar</button>`
            : `<span class="text-muted">No disponible</span>`
          }
        </td>
      `;
      tabla.appendChild(tr);
    });

  } catch (err) {
    console.error(err);
    tabla.innerHTML = "<tr><td colspan='4'>Error al cargar pedidos</td></tr>";
  }
}

// ===============================
// Cancelar pedido
// ===============================
async function cancelarPedido(pedidoId) {
  try {
    const confirmacion = confirm("¿Cancelar este pedido?");
    if (!confirmacion) return;

    const res = await fetch(`${API}/pedidos/${pedidoId}/estado?nuevo_estado=cancelado`, {
      method: "PATCH"
    });

    if (!res.ok) throw new Error();

    msgExito.classList.remove("d-none");
    msgError.classList.add("d-none");

    setTimeout(() => msgExito.classList.add("d-none"), 3000);

    cargarPedidos();

  } catch (err) {
    console.error(err);
    msgError.classList.remove("d-none");
    msgExito.classList.add("d-none");
    setTimeout(() => msgError.classList.add("d-none"), 3000);
  }
}

// Inicial
document.addEventListener("DOMContentLoaded", cargarPedidos);
