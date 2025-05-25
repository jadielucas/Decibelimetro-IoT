import uvicorn
import asyncio
from app import mqtt

if __name__ == "__main__":
    loop = asyncio.get_event_loop()
    mqtt.start_mqtt_client(loop)
    uvicorn.run("app.main:app", host="localhost", port=8000, reload=True)