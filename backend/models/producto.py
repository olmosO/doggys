from typing import List, Optional
from pydantic import BaseModel, Field


class ProductoIn(BaseModel):
    nombre: str = Field(min_length=1, description="Nombre del producto")
    descripcion: Optional[str] = Field(default=None, description="Descripción del producto")
    precio: float = Field(gt=0, description="Precio del producto (CLP)")
    disponible: bool = Field(default=True, description="Si el producto está disponible para la venta")
    stock_actual: int = Field(gt=0, description="Cantidad disponible en inventario")
    tags: List[str] = Field(default_factory=list, description="Etiquetas (ej: 'completo', 'americano', 'combo')")


class ProductoOut(ProductoIn):
    id: int
