from typing import Optional
from pydantic import BaseModel, Field, EmailStr


class UsuarioIn(BaseModel):
    nombre: str = Field(min_length=1, description="Nombre completo del cliente")
    email: EmailStr
    direccion: Optional[str] = Field(default=None, description="Dirección de entrega")
    telefono: Optional[str] = Field(default=None, description="Teléfono de contacto")


class UsuarioOut(UsuarioIn):
    id: int
