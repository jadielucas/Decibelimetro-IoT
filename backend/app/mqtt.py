import paho.mqtt.client as mqtt
import json
import asyncio
import logging
from datetime import datetime, timezone # timezone é útil para conversões explícitas
from typing import Optional

# Certifique-se de que SessionLocal é a factory correta para AsyncSession
# do seu arquivo database.py
from .database import AsyncSessionLocal
from .models import SensorReport, Microcontroller
from sqlalchemy import select as sql_select

# Configuração básica de logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(module)s - %(message)s')
logger = logging.getLogger(__name__)

# Configurações MQTT
MQTT_BROKER_HOST = "localhost"
MQTT_BROKER_PORT = 1883
MQTT_TOPIC_SUB = "sensor/sound/pico"
MQTT_KEEPALIVE = 60

# Variável global para o loop de eventos asyncio
main_event_loop = None

def on_connect(client, userdata, flags, reason_code, properties):
    if reason_code == 0:
        logger.info(f"✅ Conectado ao MQTT Broker: {MQTT_BROKER_HOST}:{MQTT_BROKER_PORT} com sucesso.")
        client.subscribe(MQTT_TOPIC_SUB)
        logger.info(f"📢 Inscrito no tópico: {MQTT_TOPIC_SUB}")
    else:
        logger.error(f"❌ Falha na conexão MQTT: {mqtt.connack_string(reason_code)}")

def on_disconnect(client, userdata, reason_code, properties):
    logger.warning(f"🔌 Desconectado do MQTT Broker: {mqtt.disconnect_string(reason_code)}.")
    # Adicionar lógica de reconexão se necessário

def on_message(client, userdata, msg):
    try:
        logger.debug(f"📩 Mensagem recebida no tópico '{msg.topic}': {msg.payload.decode()}")
        payload_data = json.loads(msg.payload.decode())

        mc_id_from_payload = int(payload_data.get("id"))
        avg_db_from_payload = payload_data.get("avgdB")
        min_db_from_payload = payload_data.get("mindB")
        max_db_from_payload = payload_data.get("maxdB")
        latitude_from_payload = payload_data.get("latitude")
        longitude_from_payload = payload_data.get("longitude")
        timestamp_str_from_payload = payload_data.get("timestamp") # Chave do JSON

        # Validação básica, incluindo o timestamp
        if None in [mc_id_from_payload, avg_db_from_payload, min_db_from_payload,
                      max_db_from_payload, timestamp_str_from_payload]:
            logger.warning(f"⚠️ Mensagem descartada por falta de campos obrigatórios (id, avgdB, mindB, maxdB, timestamp): {payload_data}")
            return

        # Converter a string do timestamp para um objeto datetime
        # Formato esperado do microcontrolador: "YYYY-MM-DD HH:MM:SS"
        try:
            parsed_datetime_obj = datetime.strptime(timestamp_str_from_payload, "%Y-%m-%d %H:%M:%S")
            
            datetime_to_save = parsed_datetime_obj

        except ValueError:
            logger.error(f"❌ Formato de timestamp inválido ('{timestamp_str_from_payload}'). Esperado 'YYYY-MM-DD HH:MM:SS'. Payload: {payload_data}", exc_info=True)
            return

        if main_event_loop and main_event_loop.is_running():
            asyncio.run_coroutine_threadsafe(
                save_sensor_data_to_db(
                    mc_id=mc_id_from_payload,
                    avg_db_val=float(avg_db_from_payload),
                    min_db_val=float(min_db_from_payload),
                    max_db_val=float(max_db_from_payload),
                    latitude_val=float(latitude_from_payload) if latitude_from_payload is not None else None,
                    longitude_val=float(longitude_from_payload) if longitude_from_payload is not None else None,
                    timestamp_val=datetime_to_save # Passa o objeto datetime processado
                ),
                main_event_loop
            )
            logger.debug(f"📥 Mensagem para mc_id {mc_id_from_payload} enfileirada para gravação no BD com timestamp {datetime_to_save}.")
        else:
            logger.error("⚠️ Loop de eventos asyncio (main_event_loop) não definido ou não está rodando!")

    except json.JSONDecodeError:
        logger.error(f"❌ Erro ao decodificar JSON da mensagem: {msg.payload.decode()}", exc_info=True)
    except (KeyError, ValueError) as e: # Captura erros de campos ausentes ou tipo incorreto
        logger.error(f"❌ Erro nos dados do payload: {e} - Payload: {msg.payload.decode()}", exc_info=True)
    except Exception as e:
        logger.error(f"❌ Erro inesperado ao processar mensagem MQTT: {e}", exc_info=True)

async def save_sensor_data_to_db(mc_id: int, avg_db_val: float, min_db_val: float, max_db_val: float,
                                 timestamp_val: datetime, # Timestamp agora é um parâmetro datetime obrigatório
                                 latitude_val: Optional[float] = None, longitude_val: Optional[float] = None):
    """
    Salva os dados do sensor no banco de dados.
    Primeiro, garante que o Microcontroller exista, depois cria o SensorReport.
    """
    async with AsyncSessionLocal() as session:
        async with session.begin():
            try:
                # 1. Encontrar ou criar o Microcontroller
                stmt_find_mc = sql_select(Microcontroller).where(Microcontroller.id == mc_id)
                result_mc = await session.execute(stmt_find_mc)
                microcontroller_obj = result_mc.scalar_one_or_none()

                if not microcontroller_obj:
                    logger.info(f"🔌 Microcontrolador com ID {mc_id} não encontrado. Criando novo...")
                    microcontroller_obj = Microcontroller(id=mc_id)
                    session.add(microcontroller_obj)
                    await session.flush()
                    await session.refresh(microcontroller_obj)

                # 2. Criar o SensorReport
                new_sensor_report = SensorReport(
                    microcontroller_id=microcontroller_obj.id, # Chave estrangeira
                    avg_db=avg_db_val,
                    min_db=min_db_val,
                    max_db=max_db_val,
                    latitude=latitude_val,
                    longitude=longitude_val,
                    timestamp=timestamp_val # Usa o timestamp fornecido e processado
                )
                session.add(new_sensor_report)
                
                logger.info(f"💾 Report salvo para microcontrolador ID {mc_id} com timestamp {timestamp_val}: avg_db={avg_db_val:.2f} dB")

            except Exception as e:
                logger.error(f"❌ Erro durante a transação do banco de dados: {e}", exc_info=True)
                # A transação será automaticamente revertida (rollback) devido à exceção.

def start_mqtt_client(event_loop: asyncio.AbstractEventLoop):
    """
    Inicia o cliente MQTT e configura o loop de eventos para callbacks assíncronos.
    """
    global main_event_loop
    main_event_loop = event_loop

    client_id = f"fastapi-mqtt-listener-{datetime.now().strftime('%Y%m%d%H%M%S%f')}"
    
    mqtt_client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id=client_id)
    mqtt_client.on_connect = on_connect
    mqtt_client.on_message = on_message
    mqtt_client.on_disconnect = on_disconnect

    try:
        logger.info(f"🚀 Tentando conectar ao MQTT Broker: {MQTT_BROKER_HOST}:{MQTT_BROKER_PORT}...")
        mqtt_client.connect(MQTT_BROKER_HOST, MQTT_BROKER_PORT, MQTT_KEEPALIVE)
    except Exception as e:
        logger.error(f"❌ Falha crítica ao tentar conectar ao MQTT Broker na inicialização: {e}", exc_info=True)
        return

    mqtt_client.loop_start() # Inicia uma thread separada para o loop de rede MQTT
    logger.info("🟢 Cliente MQTT iniciado e loop de rede rodando em segundo plano.")