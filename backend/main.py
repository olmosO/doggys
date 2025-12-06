from typing import List, Optional
from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI, HTTPException, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, EmailStr

from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

import bcrypt  # Importamos la librería directa para seguridad

# ---------------------------------------------------------
# SEGURIDAD (Hashing de contraseñas)
# ---------------------------------------------------------
def get_password_hash(password: str) -> str:
    """Encripta la contraseña usando bcrypt."""
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica si la contraseña coincide con el hash."""
    try:
        pwd_bytes = plain_password.encode('utf-8')
        hash_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(pwd_bytes, hash_bytes)
    except Exception:
        return False


# ---------------------------------------------------------
# Configuración MongoDB
# ---------------------------------------------------------
MONGODB_URI = "mongodb://localhost:27017"
DB_NAME = "Doggys"

client: AsyncIOMotorClient | None = None
db = None
usuarios_col = None
productos_col = None
pedidos_col = None
boletas_col = None


# ---------------------------------------------------------
# DATOS SEMILLA (Carga inicial automática)
# ---------------------------------------------------------
async def cargar_datos_iniciales():
    """Carga usuario admin y productos si las colecciones están vacías."""
    print("--- Verificando datos iniciales ---")

    # 1. Verificar/Crear ADMIN
    if await usuarios_col.count_documents({}) == 0:
        admin_user = {
            "nombre": "Administrador",
            "email": "admin@doggys.com",
            "telefono": "+56912345678",
            "direccion": "Sucursal Central",
            "is_admin": True,
            # Contraseña encriptada por defecto: admin123
            "password": get_password_hash("admin123")
        }
        await usuarios_col.insert_one(admin_user)
        print("✅ Usuario Admin creado: admin@doggys.com / Pass: admin123")
    
    # 2. Verificar/Crear PRODUCTOS
    if await productos_col.count_documents({}) == 0:
        productos_iniciales = [
            {
                "nombre": "Hot Dog Americano",
                "descripcion": "Clásico americano con ketchup y mostaza",
                "precio": 2500.0,
                "stock": 100,
                "img": "hotdog1.jpg",
                "disponible": True
            },
            {
                "nombre": "Hot Dog Especial",
                "descripcion": "Con salsa de queso y tocino crispy",
                "precio": 3200.0,
                "stock": 80,
                "img": "hotdog2.jpg",
                "disponible": True
            },
            {
                "nombre": "Completo Italiano",
                "descripcion": "Palta, tomate y mayo casera",
                "precio": 2800.0,
                "stock": 120,
                "img": "completo1.jpg",
                "disponible": True
            },
            {
                "nombre": "Completo Dinámico",
                "descripcion": "Palta, tomate, mayo, chucrut y salsa americana",
                "precio": 3000.0,
                "stock": 90,
                "img": "completo2.jpg",
                "disponible": True
            }
        ]
        await productos_col.insert_many(productos_iniciales)
        print("✅ 4 Productos iniciales cargados")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Se ejecuta al iniciar y apagar FastAPI.
    Aquí abrimos la conexión y cargamos datos semilla.
    """
    global client, db, usuarios_col, productos_col, pedidos_col, boletas_col
    
    # 1. Conectar a Mongo
    client = AsyncIOMotorClient(MONGODB_URI)
    db = client[DB_NAME]

    usuarios_col = db["usuarios"]
    productos_col = db["productos"]
    pedidos_col = db["pedidos"]
    boletas_col = db["boletas"]

    # 2. Cargar datos iniciales
    await cargar_datos_iniciales()

    try:
        yield
    finally:
        client.close()


app = FastAPI(title="API Doggy's - MongoDB", version="2.0.0", lifespan=lifespan)

# ---------------------------------------------------------
# CORS
# ---------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------
# Helpers
# ---------------------------------------------------------
def ensure_objectid(id_str: str) -> ObjectId:
    if not ObjectId.is_valid(id_str):
        raise HTTPException(status_code=400, detail="ID inválido")
    return ObjectId(id_str)


# ----- Conversores -----
def usuario_doc_to_out(doc) -> "UsuarioOut":
    return UsuarioOut(
        id=str(doc["_id"]),
        nombre=doc["nombre"],
        email=doc["email"],
        telefono=doc.get("telefono"),
        direccion=doc.get("direccion"),
        is_admin=doc.get("is_admin", False),
    )


def producto_doc_to_out(doc) -> "ProductoOut":
    return ProductoOut(
        id=str(doc["_id"]),
        nombre=doc["nombre"],
        descripcion=doc.get("descripcion"),
        precio=doc["precio"],
        stock=doc.get("stock", 0),
        img=doc.get("img"),
        disponible=doc.get("disponible", True)
    )


def pedido_doc_to_out(doc) -> "PedidoOut":
    items_out = [
        PedidoItemOut(
            producto_id=str(item["producto_id"]),
            cantidad=item["cantidad"],
            # Protección para pedidos antiguos sin nombre
            nombre=item.get("nombre", "Producto sin nombre"),
            precio_unitario=item["precio_unitario"],
            subtotal=item["subtotal"],
        )
        for item in doc.get("items", [])
    ]

    return PedidoOut(
        id=str(doc["_id"]),
        usuario_id=str(doc["usuario_id"]),
        items=items_out,
        estado=doc["estado"],
        # Protección para pedidos antiguos sin fecha
        fecha=doc.get("fecha", doc.get("fecha_pedido")),
        total=doc["total"],
    )


def boleta_doc_to_out(doc) -> "BoletaOut":
    return BoletaOut(
        id=str(doc["_id"]),
        pedido_id=str(doc["pedido_id"]),
        total=doc["total"],
    )


# ---------------------------------------------------------
# Modelos Pydantic
# ---------------------------------------------------------
class UsuarioIn(BaseModel):
    nombre: str
    email: EmailStr
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    is_admin: bool = False
    password: str  # Obligatoria para registro

# --- NUEVO MODELO PARA ACTUALIZAR (Password opcional) ---
class UsuarioUpdate(BaseModel):
    nombre: Optional[str] = None
    email: Optional[EmailStr] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    is_admin: Optional[bool] = None
    password: Optional[str] = None # Opcional al editar

class UsuarioOut(BaseModel):
    id: str
    nombre: str
    email: EmailStr
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    is_admin: bool = False

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class ProductoIn(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    precio: float = Field(gt=0, description="Precio > 0")
    stock: int = Field(ge=0, description="Stock no negativo")
    img: Optional[str] = Field(default=None)
    disponible: bool = True

class ProductoOut(ProductoIn):
    id: str

class PedidoItemIn(BaseModel):
    producto_id: str
    cantidad: int = Field(gt=0)

class PedidoItemOut(PedidoItemIn):
    nombre: Optional[str] = None
    precio_unitario: float
    subtotal: float

class PedidoIn(BaseModel):
    usuario_id: str
    items: List[PedidoItemIn]
    estado: str = "pendiente"

class PedidoOut(BaseModel):
    id: str
    usuario_id: str
    items: List[PedidoItemOut]
    estado: str
    fecha: Optional[str] = None
    total: float

class BoletaIn(BaseModel):
    pedido_id: str

class BoletaOut(BaseModel):
    id: str
    pedido_id: str
    total: float


# ---------------------------------------------------------
# Endpoints de sistema
# ---------------------------------------------------------
@app.get("/health", tags=["sistema"])
async def health():
    return {"status": "ok"}


# ---------------------------------------------------------
# USUARIOS
# ---------------------------------------------------------
@app.post("/usuarios", response_model=UsuarioOut, status_code=201, tags=["usuarios"])
async def crear_usuario(usuario: UsuarioIn):
    # Validar email único
    existente = await usuarios_col.find_one({"email": usuario.email})
    if existente:
        raise HTTPException(status_code=400, detail="Correo ya registrado")

    # Hashear contraseña
    user_dict = usuario.model_dump()
    user_dict["password"] = get_password_hash(user_dict["password"])

    res = await usuarios_col.insert_one(user_dict)
    doc = await usuarios_col.find_one({"_id": res.inserted_id})
    return usuario_doc_to_out(doc)


@app.get("/usuarios/{usuario_id}", response_model=UsuarioOut, tags=["usuarios"])
async def obtener_usuario(usuario_id: str):
    oid = ensure_objectid(usuario_id)
    doc = await usuarios_col.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return usuario_doc_to_out(doc)


# --- ACTUALIZAR USUARIO MEJORADO (Soporta edición parcial) ---
@app.put("/usuarios/{usuario_id}", response_model=UsuarioOut, tags=["usuarios"])
async def actualizar_usuario(usuario_id: str, usuario: UsuarioUpdate):
    oid = ensure_objectid(usuario_id)
    
    # 1. Filtramos los datos: Solo usamos lo que no sea None
    user_dict = {k: v for k, v in usuario.model_dump().items() if v is not None}

    # 2. Si enviaron password nueva, la encriptamos
    if "password" in user_dict:
        user_dict["password"] = get_password_hash(user_dict["password"])

    if not user_dict:
        raise HTTPException(status_code=400, detail="No se enviaron datos para actualizar")

    # 3. Actualizamos en Mongo (usando $set)
    res = await usuarios_col.update_one({"_id": oid}, {"$set": user_dict})
    
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
    doc = await usuarios_col.find_one({"_id": oid})
    return usuario_doc_to_out(doc)


@app.post("/usuarios/login", tags=["auth"])
async def login(credentials: LoginRequest):
    """
    Login seguro verificando hash de contraseña.
    """
    doc = await usuarios_col.find_one({"email": credentials.email})
    
    # 1. Verificar usuario
    if not doc:
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")

    # 2. Verificar contraseña
    # Usamos .get() por compatibilidad con usuarios antiguos sin pass
    if not verify_password(credentials.password, doc.get("password", "")):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")

    u = usuario_doc_to_out(doc)
    return {
        "status": "ok",
        "usuario_id": u.id,
        "nombre": u.nombre,
        "email": u.email,
        "is_admin": u.is_admin
    }


# ---------------------------------------------------------
# PRODUCTOS
# ---------------------------------------------------------
@app.get("/productos", response_model=List[ProductoOut], tags=["productos"])
async def listar_productos(
    q: Optional[str] = Query(None, description="Filtro por nombre"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
):
    query = {}
    if q:
        query["nombre"] = {"$regex": q, "$options": "i"}

    cursor = productos_col.find(query).skip(skip).limit(limit)
    productos = []
    async for doc in cursor:
        productos.append(producto_doc_to_out(doc))
    return productos


@app.post("/productos", response_model=ProductoOut, status_code=201, tags=["productos"])
async def crear_producto(producto: ProductoIn):
    res = await productos_col.insert_one(producto.model_dump())
    doc = await productos_col.find_one({"_id": res.inserted_id})
    return producto_doc_to_out(doc)


@app.get("/productos/{producto_id}", response_model=ProductoOut, tags=["productos"])
async def obtener_producto(producto_id: str):
    oid = ensure_objectid(producto_id)
    doc = await productos_col.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return producto_doc_to_out(doc)


@app.put("/productos/{producto_id}", response_model=ProductoOut, tags=["productos"])
async def actualizar_producto(producto_id: str, producto: ProductoIn):
    oid = ensure_objectid(producto_id)
    res = await productos_col.update_one({"_id": oid}, {"$set": producto.model_dump()})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    doc = await productos_col.find_one({"_id": oid})
    return producto_doc_to_out(doc)


@app.delete("/productos/{producto_id}", status_code=204, tags=["productos"])
async def eliminar_producto(producto_id: str):
    oid = ensure_objectid(producto_id)
    res = await productos_col.delete_one({"_id": oid})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return None


@app.patch("/productos/{producto_id}/disponible", tags=["productos"])
async def cambiar_disponibilidad(producto_id: str, nuevo_estado: bool = Query(...)):
    oid = ensure_objectid(producto_id)
    res = await productos_col.update_one(
        {"_id": oid},
        {"$set": {"disponible": nuevo_estado}}
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    return {
        "status": "ok",
        "producto_id": producto_id,
        "disponible": nuevo_estado
    }


# ---------------------------------------------------------
# PEDIDOS (Carrito + Estado + Reportes)
# ---------------------------------------------------------
@app.get("/pedidos", response_model=List[PedidoOut], tags=["pedidos"])
async def listar_pedidos(usuario_id: Optional[str] = Query(None)):
    """
    Lista pedidos. Si se da usuario_id, filtra por usuario.
    Recupera nombres de productos para reportes históricos.
    """
    query = {}
    if usuario_id:
        query["usuario_id"] = ensure_objectid(usuario_id)
    
    cursor = pedidos_col.find(query)
    pedidos_lista = []
    
    async for doc in cursor:
        pedidos_lista.append(pedido_doc_to_out(doc))
        
    return pedidos_lista


@app.post("/pedidos", response_model=PedidoOut, status_code=201, tags=["pedidos"])
async def crear_pedido(pedido: PedidoIn):
    usuario_oid = ensure_objectid(pedido.usuario_id)

    usuario_doc = await usuarios_col.find_one({"_id": usuario_oid})
    if not usuario_doc:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    items_db = []
    total = 0.0

    for item in pedido.items:
        prod_oid = ensure_objectid(item.producto_id)
        prod_doc = await productos_col.find_one({"_id": prod_oid})
        if not prod_doc:
            raise HTTPException(status_code=404, detail=f"Producto {item.producto_id} no encontrado")

        stock_actual = prod_doc.get("stock", 0)
        if stock_actual < item.cantidad:
            raise HTTPException(
                status_code=400,
                detail=f"Stock insuficiente para {prod_doc['nombre']}. Disponible: {stock_actual}",
            )

        precio = float(prod_doc["precio"])
        subtotal = precio * item.cantidad
        total += subtotal

        items_db.append(
            {
                "producto_id": prod_oid,
                "nombre": prod_doc["nombre"], # Guardamos nombre
                "cantidad": item.cantidad,
                "precio_unitario": precio,
                "subtotal": subtotal,
            }
        )

    doc_insert = {
        "usuario_id": usuario_oid,
        "items": items_db,
        "estado": pedido.estado,
        "total": total,
        "fecha": datetime.now().isoformat()
    }

    res = await pedidos_col.insert_one(doc_insert)
    doc = await pedidos_col.find_one({"_id": res.inserted_id})

    return pedido_doc_to_out(doc)


@app.get("/pedidos/{pedido_id}", response_model=PedidoOut, tags=["pedidos"])
async def obtener_pedido(pedido_id: str):
    oid = ensure_objectid(pedido_id)
    doc = await pedidos_col.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    return pedido_doc_to_out(doc)


@app.patch("/pedidos/{pedido_id}/estado", response_model=PedidoOut, tags=["pedidos"])
async def cambiar_estado_pedido(pedido_id: str, nuevo_estado: str = Query(...)):
    oid = ensure_objectid(pedido_id)
    doc = await pedidos_col.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")

    estado_anterior = doc["estado"]

    # Si pasa a PAGADO, descontar stock
    if nuevo_estado.lower() == "pagado" and estado_anterior.lower() != "pagado":
        for item in doc.get("items", []):
            prod_oid = item["producto_id"]
            cantidad = item["cantidad"]
            prod_doc = await productos_col.find_one({"_id": prod_oid})
            if not prod_doc:
                continue
            
            stock_actual = prod_doc.get("stock", 0)
            nuevo_stock = stock_actual - cantidad
            if nuevo_stock < 0:
                raise HTTPException(
                    status_code=400,
                    detail=f"Stock insuficiente al pagar. Producto: {prod_doc['nombre']}",
                )
            await productos_col.update_one(
                {"_id": prod_oid},
                {"$set": {"stock": nuevo_stock}},
            )

    await pedidos_col.update_one({"_id": oid}, {"$set": {"estado": nuevo_estado}})
    doc_actualizado = await pedidos_col.find_one({"_id": oid})
    return pedido_doc_to_out(doc_actualizado)


# ---------------------------------------------------------
# BOLETAS
# ---------------------------------------------------------
@app.post("/boletas", response_model=BoletaOut, status_code=201, tags=["boletas"])
async def crear_boleta(boleta_in: BoletaIn):
    pedido_oid = ensure_objectid(boleta_in.pedido_id)
    pedido_doc = await pedidos_col.find_one({"_id": pedido_oid})

    if not pedido_doc:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")

    estado_actual = pedido_doc.get("estado", "pendiente")
    if estado_actual.lower() != "pagado":
        raise HTTPException(status_code=400, detail=f"No se puede generar boleta de un pedido no pagado (Estado: {estado_actual})")

    total = float(pedido_doc.get("total", 0.0))

    doc_insert = {
        "pedido_id": pedido_oid,
        "total": total,
    }

    res = await boletas_col.insert_one(doc_insert)
    doc = await boletas_col.find_one({"_id": res.inserted_id})

    return boleta_doc_to_out(doc)


@app.get("/boletas/{boleta_id}", response_model=BoletaOut, tags=["boletas"])
async def obtener_boleta(boleta_id: str):
    oid = ensure_objectid(boleta_id)
    doc = await boletas_col.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Boleta no encontrada")
    return boleta_doc_to_out(doc)