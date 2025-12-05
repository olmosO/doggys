from typing import List, Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, EmailStr

from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

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


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Se ejecuta al iniciar y apagar FastAPI.
    Aquí abrimos y cerramos la conexión a MongoDB.
    """
    global client, db, usuarios_col, productos_col, pedidos_col, boletas_col
    client = AsyncIOMotorClient(MONGODB_URI)
    db = client[DB_NAME]

    usuarios_col = db["usuarios"]
    productos_col = db["productos"]
    pedidos_col = db["pedidos"]
    boletas_col = db["boletas"]

    try:
        yield
    finally:
        client.close()


app = FastAPI(title="API Doggy's - MongoDB", version="2.0.0", lifespan=lifespan)

# ---------------------------------------------------------
# CORS (para que el frontend pueda llamar a la API)
# ---------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # si quieres, luego restringes a localhost
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


# ----- Conversores de documentos Mongo a modelos de salida -----
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
    )


def pedido_doc_to_out(doc) -> "PedidoOut":
    items_out = [
        PedidoItemOut(
            producto_id=str(item["producto_id"]),
            cantidad=item["cantidad"],
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



class UsuarioOut(UsuarioIn):
    id: str


class ProductoIn(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    precio: float = Field(gt=0, description="Precio > 0")
    stock: int = Field(ge=0, description="Stock no negativo")
    # Para el menú con imágenes (Opción A):
    img: Optional[str] = Field(
        default=None,
        description="URL o ruta relativa de imagen (ej: 'img/completo_italiano.png')",
    )


class ProductoOut(ProductoIn):
    id: str


class PedidoItemIn(BaseModel):
    producto_id: str  # será un ObjectId en string
    cantidad: int = Field(gt=0)


class PedidoItemOut(PedidoItemIn):
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
    # opcional: validar que el email no exista
    existente = await usuarios_col.find_one({"email": usuario.email})
    if existente:
        raise HTTPException(status_code=400, detail="Correo ya registrado")

    res = await usuarios_col.insert_one(usuario.model_dump())
    doc = await usuarios_col.find_one({"_id": res.inserted_id})
    return usuario_doc_to_out(doc)


@app.get("/usuarios/{usuario_id}", response_model=UsuarioOut, tags=["usuarios"])
async def obtener_usuario(usuario_id: str):
    oid = ensure_objectid(usuario_id)
    doc = await usuarios_col.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return usuario_doc_to_out(doc)


@app.put("/usuarios/{usuario_id}", response_model=UsuarioOut, tags=["usuarios"])
async def actualizar_usuario(usuario_id: str, usuario: UsuarioIn):
    oid = ensure_objectid(usuario_id)
    res = await usuarios_col.update_one({"_id": oid}, {"$set": usuario.model_dump()})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    doc = await usuarios_col.find_one({"_id": oid})
    return usuario_doc_to_out(doc)


@app.post("/usuarios/login", tags=["auth"])
async def login(email: EmailStr = Body(..., embed=True)):
    """
    Mantiene el contrato que ya usa tu frontend:
    devuelve { status, usuario_id, nombre, email }
    """
    doc = await usuarios_col.find_one({"email": email})
    if not doc:
        raise HTTPException(status_code=401, detail="Correo no registrado")

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
    q: Optional[str] = Query(None, description="Filtro por nombre que contenga 'q'"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
):
    query = {}
    if q:
        query["nombre"] = {"$regex": q, "$options": "i"}

    cursor = productos_col.find(query).skip(skip).limit(limit)
    productos: List[ProductoOut] = []
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


# ---------------------------------------------------------
# PRODUCTOS: Cambiar estado de disponibilidad
# ---------------------------------------------------------
@app.patch("/productos/{producto_id}/disponible", tags=["productos"])
async def cambiar_disponibilidad(producto_id: str, nuevo_estado: bool = Query(...)):
    """
    Cambia si un producto está disponible (True) o no disponible (False)
    sin modificar precio, stock ni descripción.
    """
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
# PEDIDOS (carrito + estado)
# ---------------------------------------------------------
@app.post("/pedidos", response_model=PedidoOut, status_code=201, tags=["pedidos"])
async def crear_pedido(pedido: PedidoIn):
    usuario_oid = ensure_objectid(pedido.usuario_id)

    # Validar que exista el usuario
    usuario_doc = await usuarios_col.find_one({"_id": usuario_oid})
    if not usuario_doc:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # Calcular total y validar stock
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

    # Si pasamos a "pagado" y antes no lo estaba, descontar stock
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

    # Actualizar estado
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

    if pedido_doc["estado"].lower() != "pagado":
        raise HTTPException(status_code=400, detail="No se puede generar boleta de un pedido no pagado")

    total = float(pedido_doc["total"])

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


@app.get("/generar_pdf_boleta")
def generar_pdf_boleta(
    numero: str,
    fecha: str,
    nombre: str,
    correo: str,
    items: str,
    total: int
):
    """
    Recibe datos por query y genera un PDF simple de boleta.
    items llega como JSON string.
    """

    import json
    items = json.loads(items)

    buffer = BytesIO()
    pdf = canvas.Canvas(buffer)

    pdf.setTitle("Boleta Electrónica")

    y = 800
    pdf.drawString(50, y, f"Boleta Electrónica")
    y -= 20
    pdf.drawString(50, y, f"N°: {numero}")
    y -= 20
    pdf.drawString(50, y, f"Fecha: {fecha}")
    y -= 40

    pdf.drawString(50, y, f"Cliente: {nombre}")
    y -= 20
    pdf.drawString(50, y, f"Correo: {correo}")
    y -= 40

    pdf.drawString(50, y, "Detalle:")
    y -= 20

    for item in items:
        pdf.drawString(60, y, f"{item['producto']} - x{item['cantidad']} - ${item['precio']} - Subtotal: ${item['subtotal']}")
        y -= 20

    y -= 20
    pdf.drawString(50, y, f"TOTAL: ${total}")

    pdf.save()
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": "inline; filename=boleta.pdf"}
    )

