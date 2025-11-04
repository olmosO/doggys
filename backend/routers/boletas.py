from typing import List

from fastapi import APIRouter, Body

from models.boleta import Boleta
from services import boleta_service

router = APIRouter(prefix="/boletas", tags=["boletas"])


@router.get("", response_model=List[Boleta])
def listar_boletas():
    return boleta_service.listar_boletas()


@router.post("", response_model=Boleta, status_code=201)
def crear_boleta(pedido_id: int = Body(..., embed=True)):
    """Genera una boleta para un pedido existente.

    Se utiliza típicamente desde un dashboard de administración
    una vez que el pedido ha sido pagado.
    """
    return boleta_service.generar_boleta(pedido_id)
