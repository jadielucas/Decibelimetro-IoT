from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey
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