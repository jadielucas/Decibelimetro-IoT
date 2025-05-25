from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select # Para SQLAlchemy 1.4. Se SQLAlchemy 2.0+, use from sqlalchemy import select
from sqlalchemy import desc, select as sql_select # Use sql_select para evitar conflito de nome se necessário
from typing import List, Optional

# Importe os modelos e a função de sessão do seu módulo de database
from .database import get_async_session, Base # Supondo que Base também está aqui se precisar criar tabelas
from .models import SensorReport, Microcontroller # Importe ambos os modelos

router = APIRouter()

# --- Endpoints para Sensor Reports ---

@router.get("/api/reports", response_model=List[dict]) # response_model pode ser mais específico com Pydantic
async def get_sensor_reports(
    session: AsyncSession = Depends(get_async_session),
    microcontroller_id: Optional[int] = Query(None, description="Filtrar relatórios por ID do microcontrolador"),
    limit: int = Query(100, gt=0, le=1000, description="Número máximo de relatórios a retornar"),
    offset: int = Query(0, ge=0, description="Número de relatórios a pular para paginação")
):
    """
    Retorna uma lista de relatórios de sensores, opcionalmente filtrada por ID do microcontrolador,
    com ordenação pelos mais recentes e paginação.
    """
    stmt = sql_select(SensorReport).order_by(desc(SensorReport.timestamp))

    if microcontroller_id is not None:
        # Verificar se o microcontrolador existe antes de filtrar os relatórios
        mc_exists_stmt = sql_select(Microcontroller.id).where(Microcontroller.id == microcontroller_id)
        mc_result = await session.execute(mc_exists_stmt)
        if mc_result.scalar_one_or_none() is None:
            raise HTTPException(status_code=404, detail=f"Microcontrolador com ID {microcontroller_id} não encontrado.")
        stmt = stmt.where(SensorReport.microcontroller_id == microcontroller_id)

    stmt = stmt.limit(limit).offset(offset)

    result = await session.execute(stmt)
    reports = result.scalars().all()

    return [
        {
            "report_id": report.id,  # ID do próprio registro de SensorReport
            "microcontroller_id": report.microcontroller_id, # ID do microcontrolador que enviou
            "avg_db": report.avg_db,
            "min_db": report.min_db,
            "max_db": report.max_db,
            "latitude": report.latitude,
            "longitude": report.longitude,
            "timestamp": report.timestamp.isoformat() # Usar .isoformat() para padronização
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