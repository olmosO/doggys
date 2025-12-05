const API = "http://127.0.0.1:8000";
const tabla = document.querySelector("#tablaProductos tbody");
const msg = document.getElementById("mensaje");

// ============================
// Validar Rol (admin o empleado)
// ============================
document.addEventListener("DOMContentLoaded", () => {
  const rol = localStorage.getItem("usuario_rol");
  if (rol !== "admin" && rol !== "empleado") {
    alert("Acceso denegado. Solo personal autorizado.");
    window.location.href = "index.html";
    return;
  }

  cargarProductos();
});

// ============================
// Cargar productos
// ============================
async function cargarProductos() {
  tabla.innerHTML = "<tr><td colspan='5'>Cargando...</td></tr>";

  try {
    const res = await fetch(`${API}/productos`);
    const productos = await res.json();

    tabla.innerHTML = "";

    productos.forEach(prod => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${prod.nombre}</td>
        <td>$${prod.precio}</td>
        <td>${prod.stock}</td>
        <td>${prod.disponible ? "Sí" : "No"}</td>
        <td>
          <button class="btn btn-warning btn-sm" onclick="toggleDisponibilidad('${prod.id}', ${prod.disponible})">
            Cambiar
          </button>
        </td>
      `;

      tabla.appendChild(tr);
    });

  } catch (err) {
    console.error(err);
    tabla.innerHTML = "<tr><td colspan='5'>Error al cargar productos</td></tr>";
  }
}

// ============================
// Cambiar disponibilidad
// ============================
async function toggleDisponibilidad(id, estadoActual) {
  try {
    const nuevoEstado = !estadoActual;

    const res = await fetch(`${API}/productos/${id}/disponible?nuevo_estado=${nuevoEstado}`, {
      method: "PATCH"
    });

    if (!res.ok) throw new Error("Error en backend");

    msg.classList.remove("d-none");
    setTimeout(() => msg.classList.add("d-none"), 3000);

    cargarProductos();

  } catch (err) {
    console.error(err);
    alert("Error al actualizar disponibilidad.");
  }
}
