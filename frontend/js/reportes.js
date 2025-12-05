const API = "http://127.0.0.1:8000";
const tabla = document.querySelector("#tablaReportes tbody");
const mensaje = document.getElementById("mensaje");

// ==========================
// VALIDAR ADMIN
// ==========================
document.addEventListener("DOMContentLoaded", () => {
  const isAdmin = localStorage.getItem("is_admin") === "true";

  if (!isAdmin) {
    alert("Acceso denegado. Solo administradores.");
    window.location.href = "index.html";
    return;
  }

  cargarReporte();
});

// ==========================
// Cargar datos del backend
// ==========================
async function cargarReporte(filtros = {}) {
  tabla.innerHTML = "<tr><td colspan='4'>Cargando...</td></tr>";

  try {
    const res = await fetch(`${API}/pedidos`);
    const pedidos = await res.json();

    // Filtrar solo pedidos válidos
    const procesables = pedidos.filter(p =>
      ["pagado", "entregado"].includes(p.estado)
    );

    const filas = procesarPedidos(procesables, filtros);

    tabla.innerHTML = "";

    if (filas.length === 0) {
      mensaje.classList.remove("d-none");
      return;
    }

    mensaje.classList.add("d-none");

    filas.forEach(f => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${f.producto}</td>
        <td>${f.cantidad}</td>
        <td>$${f.subtotal}</td>
        <td>${f.fecha}</td>
      `;
      tabla.appendChild(tr);
    });

  } catch (err) {
    console.error(err);
    tabla.innerHTML = "<tr><td colspan='4'>Error al cargar datos</td></tr>";
  }
}

// ==========================
// Procesar pedidos -> reportes
// ==========================
function procesarPedidos(pedidos, filtros) {
  const { tipo, desde, hasta } = filtros;

  const filas = [];

  pedidos.forEach(pedido => {
    const fecha = pedido.fecha || pedido.fecha_pedido || "2025-01-01";

    // Filtro fecha
    if (desde && fecha < desde) return;
    if (hasta && fecha > hasta) return;

    pedido.items.forEach(item => {

      // Filtro por tipo
      if (tipo !== "todos") {
        const nombre = item.nombre.toLowerCase();
        if (!nombre.includes(tipo)) return;
      }

      filas.push({
        producto: item.nombre,
        cantidad: item.cantidad,
        subtotal: item.subtotal,
        fecha
      });
    });
  });

  return filas;
}

// ==========================
// Manejo de filtros
// ==========================
document.getElementById("formFiltros").addEventListener("submit", (e) => {
  e.preventDefault();

  const tipo = document.getElementById("tipoProducto").value.toLowerCase();
  const fechaDesde = document.getElementById("fechaDesde").value;
  const fechaHasta = document.getElementById("fechaHasta").value;

  cargarReporte({
    tipo,
    desde: fechaDesde,
    hasta: fechaHasta,
  });
});
