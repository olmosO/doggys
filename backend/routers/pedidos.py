from typing import List

from fastapi import APIRouter

from models.pedido import PedidoIn, PedidoOut, EstadoPedido
from services import pedido_service

router = APIRouter(prefix="/pedidos", tags=["pedidos"])


@router.get("", response_model=List[PedidoOut])
def listar_pedidos():
    return pedido_service.listar_pedidos()


@router.post("", response_model=PedidoOut, status_code=201)
def crear_pedido(pedido: PedidoIn):
    # El pedido en estado PENDIENTE actúa como "carrito" inicial
    return pedido_service.crear_pedido(pedido)


@router.get("/{pedido_id}", response_model=PedidoOut)
def obtener_pedido(pedido_id: int):
    return pedido_service.obtener_pedido(pedido_id)


@router.patch("/{pedido_id}/estado", response_model=PedidoOut)
def cambiar_estado_pedido(pedido_id: int, nuevo_estado: EstadoPedido):
    return pedido_service.actualizar_estado(pedido_id, nuevo_estado)
