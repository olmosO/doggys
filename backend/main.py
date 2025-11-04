from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import productos, usuarios, pedidos, boletas

app = FastAPI(
    title="Doggy's API",
    version="1.0.0",
    description="""API de ejemplo para el sistema de ventas online de Hot Dogs Doggy's.
Incluye gestión de usuarios, productos, pedidos, boletas y estados de pedido,
utilizando una base de datos simulada en memoria para fines académicos.""",  # noqa: E501
)

# CORS simple para permitir llamadas desde el frontend en localhost
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["sistema"])
def health():
    return {"status": "ok"}


# Incluir routers de la API
app.include_router(productos.router)
app.include_router(usuarios.router)
app.include_router(pedidos.router)
app.include_router(boletas.router)
