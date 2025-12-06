Doggy's - Sistema de Gestión de Pedidos Web Móvil

Proyecto final para la asignatura de Desarrollo Web Móvil. Este sistema permite la gestión de pedidos de comida rápida (hot dogs) con una arquitectura moderna separada en Backend (FastAPI) y Frontend (HTML/JS/Bootstrap).

Características Principales:
* Catálogo de Productos: Visualización dinámica desde base de datos.
* Carrito de Compras: Gestión de estado local y persistencia.
* Checkout y Pedidos: Flujo completo de compra con validación de stock.
* Seguridad: Autenticación de usuarios y administradores con contraseñas encriptadas (Hashing Bcrypt).
* Panel de Administración: Dashboard para gestión de productos y reportes de ventas.
* Simulación de Estado: Seguimiento en tiempo real del estado del pedido (Web Socket simulado).

Stack Tecnológico:
* Backend: Python 3.10+ con FastAPI.
* Base de Datos: MongoDB (Motor driver).
* Frontend: HTML5, CSS3, JavaScript (Vanilla), Bootstrap 5.
* Seguridad: Librería `bcrypt` para hashing.

Requisitos Previos
1.  Tener Python 3.10 o superior instalado.
2.  Tener MongoDB instalado y corriendo localmente en el puerto `27017` (URI: `mongodb://localhost:27017`).

Instalación y Ejecución:

1. Backend:
Desde la terminal, navega a la carpeta `backend`:
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

El servidor iniciará en http://127.0.0.1:8000
Nota: Al iniciar por primera vez, el sistema cargará automáticamente datos semilla (Admin y Productos) si la base de datos está vacía.

2. Frontend:
Simplemente abrir el archivo frontend/index.html en el navegador web o utilizar una extensión como "Live Server" de VS Code.

3. Credenciales:
- Usuario Administrador (Precargado):
Email: admin@doggys.com
Contraseña: admin123

- Usuario Cliente:
Puede registrar un usuario nuevo desde la opción "Registrarse".
