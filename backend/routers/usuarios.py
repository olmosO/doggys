from typing import List, Optional

from fastapi import APIRouter, Body, HTTPException, Query
from pydantic import EmailStr

from models.usuario import UsuarioIn, UsuarioOut
from data.db import db_usuarios, seq_usuarios

router = APIRouter(prefix="/usuarios", tags=["usuarios"])


@router.get("", response_model=List[UsuarioOut])
def listar_usuarios(
    q: Optional[str] = Query(default=None, description="Filtro por nombre que contenga 'q'"),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
):
    items: List[UsuarioOut] = []
    for uid, usr in db_usuarios.items():
        if q is None or q.lower() in usr.nombre.lower():
            items.append(UsuarioOut(id=uid, **usr.model_dump()))
    return items[skip : skip + limit]


@router.post("", response_model=UsuarioOut, status_code=201)
def crear_usuario(usuario: UsuarioIn):
    new_id = next(seq_usuarios)
    db_usuarios[new_id] = usuario
    return UsuarioOut(id=new_id, **usuario.model_dump())


@router.get("/{usuario_id}", response_model=UsuarioOut)
def obtener_usuario(usuario_id: int):
    if usuario_id not in db_usuarios:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return UsuarioOut(id=usuario_id, **db_usuarios[usuario_id].model_dump())


@router.put("/{usuario_id}", response_model=UsuarioOut)
def actualizar_usuario(usuario_id: int, usuario: UsuarioIn):
    if usuario_id not in db_usuarios:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    db_usuarios[usuario_id] = usuario
    return UsuarioOut(id=usuario_id, **usuario.model_dump())


@router.delete("/{usuario_id}", status_code=204)
def eliminar_usuario(usuario_id: int):
    if usuario_id not in db_usuarios:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    del db_usuarios[usuario_id]
    return None


@router.post("/login", tags=["auth"])
def login(email: EmailStr = Body(..., embed=True)):
    for uid, usr in db_usuarios.items():
        if usr.email == email:
            return {
                "status": "ok",
                "usuario_id": uid,
                "nombre": usr.nombre,
                "email": usr.email,
            }
    raise HTTPException(status_code=401, detail="Correo no registrado")
