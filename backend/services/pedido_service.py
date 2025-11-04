from typing import List

from fastapi import HTTPException

from models.pedido import PedidoIn, PedidoOut, DetallePedido, EstadoPedido
from data.db import db_pedidos, seq_pedidos, db_usuarios, db_productos
from models.producto import ProductoIn


def calcular_total(items: List[DetallePedido]) -> float:
    total = 0.0
    for item in items:
        producto: ProductoIn | None = db_productos.get(item.producto_id)
        if not producto:
            raise HTTPException(status_code=400, detail=f"Producto {item.producto_id} no existe")
        total += producto.precio * item.cantidad
    return total


def crear_pedido(pedido_in: PedidoIn) -> PedidoOut:
    # Validar usuario
    if pedido_in.usuario_id not in db_usuarios:
        raise HTTPException(status_code=400, detail="Usuario no existe")
    # Validar que haya items
    if not pedido_in.items:
        raise HTTPException(status_code=400, detail="El pedido debe tener al menos un producto")

    total = calcular_total(pedido_in.items)
    new_id = next(seq_pedidos)
    db_pedidos[new_id] = pedido_in
    return PedidoOut(id=new_id, total=total, **pedido_in.model_dump())


def obtener_pedido(pedido_id: int) -> PedidoOut:
    pedido: PedidoIn | None = db_pedidos.get(pedido_id)
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    total = calcular_total(pedido.items)
    return PedidoOut(id=pedido_id, total=total, **pedido.model_dump())


def listar_pedidos() -> list[PedidoOut]:
    resultados: list[PedidoOut] = []
    for pid, pedido in db_pedidos.items():
        total = calcular_total(pedido.items)
        resultados.append(PedidoOut(id=pid, total=total, **pedido.model_dump()))
    return resultados


def actualizar_estado(pedido_id: int, nuevo_estado: EstadoPedido) -> PedidoOut:
    pedido: PedidoIn | None = db_pedidos.get(pedido_id)
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")

    # Si el pedido pasa a PAGADO por primera vez, validar y descontar stock
    if nuevo_estado == EstadoPedido.PAGADO and pedido.estado != EstadoPedido.PAGADO:
        # Validar stock
        for item in pedido.items:
            producto: ProductoIn | None = db_productos.get(item.producto_id)
            if not producto:
                raise HTTPException(status_code=400, detail=f"Producto {item.producto_id} no existe")
            if producto.stock_actual < item.cantidad:
                raise HTTPException(
                    status_code=400,
                    detail=f"Stock insuficiente para el producto {item.producto_id}",
                )
        # Descontar stock
        for item in pedido.items:
            producto = db_productos[item.producto_id]
            producto.stock_actual -= item.cantidad
            db_productos[item.producto_id] = producto

    pedido.estado = nuevo_estado
    db_pedidos[pedido_id] = pedido
    total = calcular_total(pedido.items)
    return PedidoOut(id=pedido_id, total=total, **pedido.model_dump())
