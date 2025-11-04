from fastapi import HTTPException

from models.boleta import Boleta
from data.db import db_boletas, seq_boletas, db_pedidos
from .pedido_service import calcular_total


def generar_boleta(pedido_id: int) -> Boleta:
    pedido = db_pedidos.get(pedido_id)
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")

    total = calcular_total(pedido.items)
    new_id = next(seq_boletas)
    boleta = Boleta(id=new_id, pedido_id=pedido_id, total=total)
    db_boletas[new_id] = boleta
    return boleta


def obtener_boleta(boleta_id: int) -> Boleta:
    boleta = db_boletas.get(boleta_id)
    if not boleta:
        raise HTTPException(status_code=404, detail="Boleta no encontrada")
    return boleta


def listar_boletas() -> list[Boleta]:
    return list(db_boletas.values())
