const API = "http://127.0.0.1:8000/productos";

const tabla = document.querySelector("#tablaProductos tbody");
const form = document.getElementById("formProducto");
const modalTitulo = document.getElementById("modalTitulo");

// =======================================================
// VALIDAR ADMIN
// =======================================================
document.addEventListener("DOMContentLoaded", () => {
  const isAdmin = localStorage.getItem("is_admin") === "true";

  if (!isAdmin) {
    alert("Acceso denegado. Solo administradores.");
    window.location.href = "index.html";
    return;
  }

  cargarProductos();
});

// =======================================================
// LIMPIAR FORMULARIO AL ABRIR “AGREGAR PRODUCTO”
// =======================================================

document.querySelector("[data-bs-target='#modalProducto']").addEventListener("click", () => {
  modalTitulo.textContent = "Nuevo Producto";

  // Limpiar todos los campos
  document.getElementById("producto_id").value = "";
  document.getElementById("nombreProducto").value = "";
  document.getElementById("precioProducto").value = "";
  document.getElementById("stockProducto").value = "";
  if (document.getElementById("imgProducto"))
    document.getElementById("imgProducto").value = "";
});

// =======================================================
// CARGAR PRODUCTOS
// =======================================================
async function cargarProductos() {
  tabla.innerHTML = "<tr><td colspan='5'>Cargando...</td></tr>";

  try {
    const res = await fetch(API);
    const productos = await res.json();

    tabla.innerHTML = "";

    productos.forEach(prod => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${prod.id}</td>
        <td>${prod.nombre}</td>
        <td>$${prod.precio}</td>
        <td>${prod.stock}</td>
        <td>
          <button class="btn btn-primary btn-sm" onclick="editarProducto('${prod.id}')">Editar</button>
          <button class="btn btn-danger btn-sm" onclick="eliminarProducto('${prod.id}')">Eliminar</button>
        </td>
      `;

      tabla.appendChild(tr);
    });

  } catch (err) {
    console.error(err);
    tabla.innerHTML = "<tr><td colspan='5'>Error al cargar productos</td></tr>";
  }
}

// =======================================================
// AGREGAR O EDITAR PRODUCTO
// =======================================================
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const id = document.getElementById("producto_id").value;
  const nombre = document.getElementById("nombreProducto").value.trim();
  const precio = Number(document.getElementById("precioProducto").value);
  const stock = Number(document.getElementById("stockProducto").value);
  const img = document.getElementById("imgProducto")?.value.trim() || null;

  const payload = { nombre, precio, stock, img };

  try {
    let res;

    if (id) {
      // EDITAR (PUT)
      res = await fetch(`${API}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      // CREAR (POST)
      res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    if (!res.ok) throw new Error("Error guardando producto");

    // Cerrar modal
    document.querySelector("#modalProducto .btn-close").click();

    // Recargar lista
    cargarProductos();

  } catch (err) {
    alert("Error al guardar producto.");
    console.error(err);
  }
});

// =======================================================
// CARGAR DATOS EN MODAL PARA EDITAR
// =======================================================
async function editarProducto(id) {
  modalTitulo.textContent = "Editar Producto";

  try {
    const res = await fetch(`${API}/${id}`);
    const prod = await res.json();

    document.getElementById("producto_id").value = prod.id;
    document.getElementById("nombreProducto").value = prod.nombre;
    document.getElementById("precioProducto").value = prod.precio;
    document.getElementById("stockProducto").value = prod.stock;
    document.getElementById("imgProducto").value = prod.img || "";

    new bootstrap.Modal("#modalProducto").show();

  } catch (err) {
    console.error(err);
    alert("Error al cargar producto.");
  }
}

// =======================================================
// ELIMINAR PRODUCTO
// =======================================================
async function eliminarProducto(id) {
  if (!confirm("¿Eliminar producto?")) return;

  try {
    const res = await fetch(`${API}/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error();

    cargarProductos();
  } catch (err) {
    alert("Error al eliminar producto.");
    console.error(err);
  }
}
