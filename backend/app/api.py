from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import desc, select as sql_select
from typing import List, Optional
from datetime import date, datetime, timedelta # Verifique se timedelta está importado

from .database import get_async_session
from .models import SensorReport, Microcontroller

router = APIRouter()

# --- Endpoints para Sensor Reports ---

@router.get("/api/reports", response_model=List[dict])
async def get_sensor_reports(
    session: AsyncSession = Depends(get_async_session),
    microcontroller_id: Optional[int] = Query(None, description="Filtrar por ID do microcontrolador"),
    limit: int = Query(1000, gt=0, le=2000),
    offset: int = Query(0, ge=0),
    start_date: Optional[date] = Query(None, description="Data de início do filtro (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="Data de fim do filtro (YYYY-MM-DD)")
):
    stmt = sql_select(SensorReport).order_by(desc(SensorReport.timestamp))

    if microcontroller_id is not None:
        stmt = stmt.where(SensorReport.microcontroller_id == microcontroller_id)

    # Lógica de filtro de data
    if start_date:
        stmt = stmt.where(SensorReport.timestamp >= datetime.combine(start_date, datetime.min.time()))
    
    if end_date:
        stmt = stmt.where(SensorReport.timestamp < datetime.combine(end_date + timedelta(days=1), datetime.min.time()))

    # ✨ NOVO: Se NENHUM filtro de data for fornecido, aplica o padrão de 1 ano.
    if start_date is None and end_date is None:
        one_year_ago = datetime.now() - timedelta(days=365)
        stmt = stmt.where(SensorReport.timestamp >= one_year_ago)

    stmt = stmt.limit(limit).offset(offset)
    result = await session.execute(stmt)
    reports = result.scalars().all()
    
    # O retorno continua o mesmo
    return [
        {
            "report_id": report.id,
            "microcontroller_id": report.microcontroller_id,
            "avg_db": report.avg_db,
            "min_db": report.min_db,
            "max_db": report.max_db,
            "latitude": report.latitude,
            "longitude": report.longitude,
            "timestamp": report.timestamp.isoformat()
        }
        for report in reports
    ]

@router.get("/api/reports/{report_id}", response_model=dict)
async def get_sensor_report_details(
    report_id: int,
    session: AsyncSession = Depends(get_async_session)
):
    """
    Retorna os detalhes de um relatório de sensor específico.
    """
    stmt = sql_select(SensorReport).where(SensorReport.id == report_id)
    result = await session.execute(stmt)
    report = result.scalar_one_or_none()

    if report is None:
        raise HTTPException(status_code=404, detail="Relatório não encontrado")

    return {
        "report_id": report.id,
        "microcontroller_id": report.microcontroller_id,
        "avg_db": report.avg_db,
        "min_db": report.min_db,
        "max_db": report.max_db,
        "latitude": report.latitude,
        "longitude": report.longitude,
        "timestamp": report.timestamp.isoformat()
    }

# --- Endpoints para Microcontrollers ---

@router.get("/api/microcontrollers", response_model=List[dict])
async def list_microcontrollers(
    session: AsyncSession = Depends(get_async_session),
    limit: int = Query(100, gt=0, le=1000),
    offset: int = Query(0, ge=0)
):
    """
    Retorna uma lista de microcontroladores registrados.
    """
    stmt = sql_select(Microcontroller).order_by(Microcontroller.id).limit(limit).offset(offset)
    result = await session.execute(stmt)
    microcontrollers = result.scalars().all()
    return [
        {
            "id": mc.id,
            # Adicione outros campos do Microcontroller que você queira expor
            # Ex: "model_name": mc.model_name (se você adicionou esse campo ao modelo)
        }
        for mc in microcontrollers
    ]

@router.get("/api/microcontrollers/{microcontroller_id}", response_model=dict)
async def get_microcontroller_details(
    microcontroller_id: int,
    session: AsyncSession = Depends(get_async_session)
):
    """
    Retorna detalhes de um microcontrolador específico.
    """
    stmt = sql_select(Microcontroller).where(Microcontroller.id == microcontroller_id)
    result = await session.execute(stmt)
    mc = result.scalar_one_or_none()
    if mc is None:
        raise HTTPException(status_code=404, detail="Microcontrolador não encontrado")
    return {
        "id": mc.id,
        # Adicione outros campos
    }