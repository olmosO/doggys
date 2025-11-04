from typing import List, Optional
from enum import Enum
from pydantic import BaseModel, Field


class EstadoPedido(str, Enum):
    PENDIENTE = "pendiente"
    PAGADO = "pagado"
    PREPARANDO = "preparando"
    DESPACHADO = "despachado"
    ENTREGADO = "entregado"
    ANULADO = "anulado"


class DetallePedido(BaseModel):
    producto_id: int = Field(description="ID del producto")
    cantidad: int = Field(gt=0, description="Cantidad solicitada")


class PedidoIn(BaseModel):
    usuario_id: int = Field(description="ID del usuario que realiza el pedido")
    items: List[DetallePedido]
    estado: EstadoPedido = Field(default=EstadoPedido.PENDIENTE)
    comentario: Optional[str] = Field(default=None, description="Comentarios del cliente")


class PedidoOut(PedidoIn):
    id: int
    total: float = Field(ge=0, description="Total del pedido calculado en base a los productos")
