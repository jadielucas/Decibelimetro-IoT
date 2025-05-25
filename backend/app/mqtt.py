import paho.mqtt.client as mqtt
import json
import asyncio
import logging
from datetime import datetime # Útil para logging ou client_id
from typing import Optional

# Certifique-se de que AsyncSessionLocal é a factory correta para AsyncSession
# do seu arquivo database.py
from .database import AsyncSessionLocal # ou SessionLocal se esse for o nome da sua factory AsyncSession
from .models import SensorReport, Microcontroller
from sqlalchemy import select as sql_select # Para SQLAlchemy 2.0+ style.
                                         # Se estiver em 1.4 com `from sqlalchemy.future import select`
                                         # pode usar `select` diretamente se não houver conflito.

# Configuração básica de logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(module)s - %(message)s')
logger = logging.getLogger(__name__)

# Configurações MQTT (idealmente de variáveis de ambiente ou arquivo de configuração)
MQTT_BROKER_HOST = "localhost"
MQTT_BROKER_PORT = 1883
MQTT_TOPIC_SUB = "sensor/sound/pico"
MQTT_KEEPALIVE = 60

# Variável global para o loop de eventos asyncio, se necessário para run_coroutine_threadsafe
main_event_loop = None

def on_connect(client, userdata, flags, reason_code, properties): # Assinatura para Paho MQTT v2+
    if reason_code == 0:
        logger.info(f"✅ Conectado ao MQTT Broker: {MQTT_BROKER_HOST}:{MQTT_BROKER_PORT} com sucesso.")
        client.subscribe(MQTT_TOPIC_SUB)
        logger.info(f"📢 Inscrito no tópico: {MQTT_TOPIC_SUB}")
    else:
        logger.error(f"❌ Falha na conexão MQTT: {mqtt.connack_string(reason_code)}")

def on_disconnect(client, userdata, reason_code, properties):
    logger.warning(f"🔌 Desconectado do MQTT Broker: {mqtt.disconnect_string(reason_code)}. Tentando reconectar...")
    # Lógica de reconexão pode ser adicionada aqui se necessário, embora o Paho possa tentar automaticamente

def on_message(client, userdata, msg):
    try:
        logger.debug(f"📩 Mensagem recebida no tópico '{msg.topic}': {msg.payload.decode()}")
        payload_data = json.loads(msg.payload.decode())

        # Extrai o ID do microcontrolador do payload
        mc_id_from_payload = int(payload_data.get("id"))
        avg_db_from_payload = payload_data.get("avgdB")
        min_db_from_payload = payload_data.get("mindB")
        max_db_from_payload = payload_data.get("maxdB")
        latitude_from_payload = payload_data.get("latitude")
        longitude_from_payload = payload_data.get("longitude")
        # timestamp_from_payload = payload_data.get("timestamp") # Se o dispositivo envia o timestamp

        # Validação básica
        if None in [mc_id_from_payload, avg_db_from_payload, min_db_from_payload, max_db_from_payload]:
            logger.warning(f"⚠️ Mensagem descartada por falta de campos obrigatórios (id, avgdB, mindB, maxdB): {payload_data}")
            return

        if main_event_loop and main_event_loop.is_running():
            asyncio.run_coroutine_threadsafe(
                save_sensor_data_to_db(
                    mc_id=mc_id_from_payload,
                    avg_db_val=float(avg_db_from_payload),
                    min_db_val=float(min_db_from_payload),
                    max_db_val=float(max_db_from_payload),
                    latitude_val=float(latitude_from_payload) if latitude_from_payload is not None else None,
                    longitude_val=float(longitude_from_payload) if longitude_from_payload is not None else None
                    # timestamp_val=datetime.fromisoformat(timestamp_from_payload) if timestamp_from_payload else None
                ),
                main_event_loop
            )
            logger.debug(f"📥 Mensagem para mc_id {mc_id_from_payload} enfileirada para gravação no BD.")
        else:
            logger.error("⚠️ Loop de eventos asyncio (main_event_loop) não definido ou não está rodando!")

    except json.JSONDecodeError:
        logger.error(f"❌ Erro ao decodificar JSON da mensagem: {msg.payload.decode()}", exc_info=True)
    except (KeyError, ValueError) as e: # Captura erros de campos ausentes ou tipo incorreto
        logger.error(f"❌ Erro nos dados do payload: {e} - Payload: {msg.payload.decode()}", exc_info=True)
    except Exception as e:
        logger.error(f"❌ Erro inesperado ao processar mensagem MQTT: {e}", exc_info=True)

async def save_sensor_data_to_db(mc_id: int, avg_db_val: float, min_db_val: float, max_db_val: float,
                                 latitude_val: Optional[float] = None, longitude_val: Optional[float] = None,
                                 timestamp_val: Optional[datetime] = None):
    """
    Salva os dados do sensor no banco de dados.
    Primeiro, garante que o Microcontroller exista, depois cria o SensorReport.
    """
    async with AsyncSessionLocal() as session:
        async with session.begin(): # Inicia uma transação
            try:
                # 1. Encontrar ou criar o Microcontroller
                stmt_find_mc = sql_select(Microcontroller).where(Microcontroller.id == mc_id)
                result_mc = await session.execute(stmt_find_mc)
                microcontroller_obj = result_mc.scalar_one_or_none()

                if not microcontroller_obj:
                    logger.info(f"🔌 Microcontrolador com ID {mc_id} não encontrado. Criando novo...")
                    microcontroller_obj = Microcontroller(id=mc_id)
                    # Se você tiver outros campos para definir ao criar um Microcontroller, defina-os aqui.
                    # Ex: microcontroller_obj.model_name = "PicoSoundSensor" # Se tiver esse campo
                    # Ex: microcontroller_obj.installation_date = datetime.utcnow()
                    session.add(microcontroller_obj)
                    # O commit ocorrerá no final do bloco `session.begin()`.
                    # Para obter o ID ou outros valores padrão do BD imediatamente (se houver auto-incremento, etc.,
                    # o que não é o caso do mc_id que vem do payload), um flush + refresh seria necessário,
                    # mas aqui estamos usando o mc_id fornecido.
                    await session.flush() # Garante que microcontroller_obj.id está disponível se fosse auto-gerado
                                        # e antes de usá-lo na FK, embora aqui mc_id já seja conhecido.
                    await session.refresh(microcontroller_obj)


                # 2. Criar o SensorReport
                new_sensor_report = SensorReport(
                    microcontroller_id=microcontroller_obj.id, # Chave estrangeira
                    avg_db=avg_db_val,
                    min_db=min_db_val,
                    max_db=max_db_val,
                    latitude=latitude_val,
                    longitude=longitude_val
                    # timestamp é default=datetime.utcnow no modelo, mas pode ser sobrescrito:
                    # timestamp=timestamp_val if timestamp_val else datetime.utcnow()
                )
                session.add(new_sensor_report)
                
                # O commit ocorrerá automaticamente no final do bloco `session.begin()`
                logger.info(f"💾 Report salvo para microcontrolador ID {mc_id}: avg_db={avg_db_val:.2f} dB")

            except Exception as e:
                logger.error(f"❌ Erro durante a transação do banco de dados: {e}", exc_info=True)
                # A transação será automaticamente revertida (rollback) devido à exceção.
                # Você pode querer re-lançar a exceção se o chamador precisar saber.
                # raise

def start_mqtt_client(event_loop: asyncio.AbstractEventLoop):
    """
    Inicia o cliente MQTT e configura o loop de eventos para callbacks assíncronos.
    """
    global main_event_loop
    main_event_loop = event_loop

    # Gera um client_id único para evitar desconexões se outra instância rodar
    client_id = f"fastapi-mqtt-listener-{datetime.now().strftime('%Y%m%d%H%M%S%f')}"
    
    # Usar CallbackAPIVersion.VERSION2 para a nova assinatura de on_connect etc.
    mqtt_client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id=client_id)
    mqtt_client.on_connect = on_connect
    mqtt_client.on_message = on_message
    mqtt_client.on_disconnect = on_disconnect

    # Configurar credenciais se o broker MQTT exigir
    # mqtt_client.username_pw_set("username", "password")

    try:
        logger.info(f"🚀 Tentando conectar ao MQTT Broker: {MQTT_BROKER_HOST}:{MQTT_BROKER_PORT}...")
        mqtt_client.connect(MQTT_BROKER_HOST, MQTT_BROKER_PORT, MQTT_KEEPALIVE)
    except Exception as e:
        logger.error(f"❌ Falha crítica ao tentar conectar ao MQTT Broker na inicialização: {e}", exc_info=True)
        return # Não iniciar o loop se a conexão inicial falhar

    mqtt_client.loop_start() # Inicia uma thread separada para o loop de rede MQTT
    logger.info("🟢 Cliente MQTT iniciado e loop de rede rodando em segundo plano.")

# Exemplo de como você poderia iniciar isso no seu main.py do FastAPI:
# from fastapi import FastAPI
# from . import mqtt, api_router, database_module # Seus módulos
# import asyncio

# app = FastAPI()
# app.include_router(api_router.router)

# @app.on_event("startup")
# async def startup_event():
#     # Criar tabelas do banco de dados (se não existirem)
#     # async with database_module.async_engine.begin() as conn:
#     #     await conn.run_sync(database_module.Base.metadata.create_all)
#
#     loop = asyncio.get_event_loop()
#     mqtt.start_mqtt_client(loop)

# @app.on_event("shutdown")
# async def shutdown_event():
#     # Idealmente, parar o cliente MQTT de forma graciosa
#     # mqtt.mqtt_client.loop_stop()
#     # mqtt.mqtt_client.disconnect()
#     logger.info("Cliente MQTT encerrado.")