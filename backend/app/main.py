from fastapi import FastAPI
from . import api, mqtt
from .database import Base
from .database import engine
from fastapi.middleware.cors import CORSMiddleware
import asyncio

app = FastAPI()
app.include_router(api.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # ou ["*"] para permitir todos os domínios (útil para desenvolvimento)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    # Cria as tabelas no banco de dados
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Obtém o event loop principal e inicia o MQTT
    loop = asyncio.get_running_loop()
    mqtt.start_mqtt_client(loop)