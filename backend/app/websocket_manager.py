import asyncio
from typing import List
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        # Envia a mensagem para todos os clientes conectados
        for connection in self.active_connections:
            await connection.send_text(message)

# Cria uma instância única que será usada em toda a aplicação
manager = ConnectionManager()