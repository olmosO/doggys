from typing import Any, Dict
from itertools import count

# Simulación de base de datos en memoria.
# Se almacenan instancias de modelos Pydantic (ProductoIn, UsuarioIn, PedidoIn, Boleta).

db_productos: Dict[int, Any] = {}
seq_productos = count(start=1)

db_usuarios: Dict[int, Any] = {}
seq_usuarios = count(start=1)

db_pedidos: Dict[int, Any] = {}
seq_pedidos = count(start=1)

db_boletas: Dict[int, Any] = {}
seq_boletas = count(start=1)
