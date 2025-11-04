from datetime import datetime
from pydantic import BaseModel, Field


class Boleta(BaseModel):
    id: int
    pedido_id: int
    total: float = Field(ge=0, description="Total asociado al pedido")
    fecha_emision: datetime = Field(default_factory=datetime.now)
