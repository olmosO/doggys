from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query

from models.producto import ProductoIn, ProductoOut
from data.db import db_productos, seq_productos

router = APIRouter(prefix="/productos", tags=["productos"])


@router.get("", response_model=List[ProductoOut])
def listar_productos(
    q: Optional[str] = Query(default=None, description="Filtro por nombre que contenga 'q'"),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
):
    items: List[ProductoOut] = []
    for pid, prod in db_productos.items():
        if q is None or q.lower() in prod.nombre.lower():
            items.append(ProductoOut(id=pid, **prod.model_dump()))
    return items[skip : skip + limit]


@router.post("", response_model=ProductoOut, status_code=201)
def crear_producto(producto: ProductoIn):
    new_id = next(seq_productos)
    db_productos[new_id] = producto
    return ProductoOut(id=new_id, **producto.model_dump())


@router.get("/{producto_id}", response_model=ProductoOut)
def obtener_producto(producto_id: int):
    if producto_id not in db_productos:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return ProductoOut(id=producto_id, **db_productos[producto_id].model_dump())


@router.put("/{producto_id}", response_model=ProductoOut)
def actualizar_producto(producto_id: int, producto: ProductoIn):
    if producto_id not in db_productos:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    db_productos[producto_id] = producto
    return ProductoOut(id=producto_id, **producto.model_dump())


@router.delete("/{producto_id}", status_code=204)
def eliminar_producto(producto_id: int):
    if producto_id not in db_productos:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    del db_productos[producto_id]
    return None
