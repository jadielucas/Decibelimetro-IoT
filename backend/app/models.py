from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, String
from sqlalchemy.orm import relationship
from .database import Base
from datetime import datetime

class Microcontroller(Base):
    __tablename__ = "microcontrollers"

    id = Column(Integer, primary_key=True, index=True, unique=True)
    
    reports = relationship("SensorReport", back_populates="microcontroller_device")

    def __repr__(self):
        return f"<Microcontroller(id={self.id})>"

class SensorReport(Base):
    __tablename__ = "sensor_reports"

    id = Column(Integer, primary_key=True, index=True)
    
    microcontroller_id = Column(Integer, ForeignKey("microcontrollers.id"), index=True)
    
    avg_db = Column(Float)
    min_db = Column(Float)
    max_db = Column(Float)
    latitude = Column(Float)
    longitude = Column(Float)
    timestamp = Column(DateTime, nullable=False)

    microcontroller_device = relationship("Microcontroller", back_populates="reports")

    def __repr__(self):
        return f"<SensorReport(id={self.id}, microcontroller_id={self.microcontroller_id}, timestamp='{self.timestamp}')>"
    
class LogEntry(Base):
    __tablename__ = "log_entries"

    id = Column(Integer, primary_key=True, index=True)
    
    # Nível do log (ex: "INFO", "ALERTA") para fácil filtragem e coloração no frontend
    level = Column(String, index=True, nullable=False) 
    
    # A mensagem do log (ex: "Novo sensor detectado com ID 101")
    message = Column(String, nullable=False)
    
    # Timestamp de quando o log foi criado
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Chave estrangeira opcional para associar um log a um microcontrolador específico
    microcontroller_id = Column(Integer, ForeignKey("microcontrollers.id"), nullable=True)
    
    microcontroller = relationship("Microcontroller", back_populates="logs")

    def __repr__(self):
        return f"<LogEntry(id={self.id}, level='{self.level}', message='{self.message}')>"