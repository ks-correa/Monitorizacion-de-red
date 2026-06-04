"""
Endpoints de API para Alertas de Sobre-gasto

Este archivo contiene todos los endpoints REST para manejar operaciones
relacionadas con alertas de sobre-gasto en GastoSmart.
Implementa el requerimiento RQF-011.
"""

from fastapi import APIRouter, HTTPException, Depends, status, Query
from typing import List, Optional
from database.connection import get_async_database
from database.alert_operations import AlertOperations
from models.alert import (
    AlertThresholdConfigResponse, AlertHistoryResponse, AlertThresholdConfigCreate
)
from motor.motor_asyncio import AsyncIOMotorDatabase
from services.auth_service import get_current_user

# Crear router para alertas
router = APIRouter(prefix="/api/alerts", tags=["alertas"])

def get_alert_operations(db: AsyncIOMotorDatabase = Depends(get_async_database)) -> AlertOperations:
    """
    Obtener instancia de operaciones de alertas
    
    Args:
        db: Base de datos MongoDB
        
    Returns:
        AlertOperations: Instancia para operaciones de alertas
    """
    alerts_collection = db.alert_thresholds
    alert_history_collection = db.alert_history
    return AlertOperations(alerts_collection, alert_history_collection)

@router.get("/threshold-config", response_model=AlertThresholdConfigResponse)
async def get_alert_threshold_config(
    current_user: dict = Depends(get_current_user),
    alert_ops: AlertOperations = Depends(get_alert_operations)
):
    """
    Obtener configuración de umbral de alerta del usuario
    
    Returns:
        AlertThresholdConfigResponse: Configuración de umbral
    """
    config = await alert_ops.get_alert_threshold_config(current_user["id"])
    
    if not config:
        # Si no existe configuración, devolver una por defecto (80%)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se ha configurado un umbral de alerta. Por favor, configura uno primero."
        )
    
    return config

@router.post("/threshold-config", response_model=AlertThresholdConfigResponse)
async def create_or_update_alert_threshold_config(
    config_data: AlertThresholdConfigCreate,
    current_user: dict = Depends(get_current_user),
    alert_ops: AlertOperations = Depends(get_alert_operations)
):
    """
    Crear o actualizar configuración de umbral de alerta
    
    Implementa CA-01 y CA-02 del requerimiento RQF-011
    
    Args:
        config_data: Datos de configuración de umbral
        
    Returns:
        AlertThresholdConfigResponse: Configuración guardada
    """
    try:
        config = await alert_ops.create_or_update_alert_threshold_config(
            current_user["id"],
            config_data
        )
        return config
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor"
        )

@router.get("/history", response_model=List[AlertHistoryResponse])
async def get_alert_history(
    current_user: dict = Depends(get_current_user),
    skip: int = Query(0, ge=0, description="Número de alertas a saltar"),
    limit: int = Query(50, ge=1, le=100, description="Límite de alertas a devolver"),
    alert_ops: AlertOperations = Depends(get_alert_operations)
):
    """
    Obtener historial de alertas del usuario
    
    Las alertas se ordenan por fecha, de la más reciente a la más antigua.
    Al obtener el historial, se marcan todas las alertas como vistas.
    
    Args:
        skip: Número de alertas a saltar
        limit: Límite de alertas a devolver
        
    Returns:
        List[AlertHistoryResponse]: Lista de alertas
    """
    alerts = await alert_ops.get_alert_history(
        current_user["id"],
        skip=skip,
        limit=limit
    )
    # Marcar alertas como vistas cuando se obtiene el historial
    await alert_ops.mark_alerts_as_viewed(current_user["id"])
    return alerts

@router.get("/unviewed-count")
async def get_unviewed_alerts_count(
    current_user: dict = Depends(get_current_user),
    alert_ops: AlertOperations = Depends(get_alert_operations)
):
    """
    Obtener el número de alertas no vistas del usuario
    
    Returns:
        dict: {"count": int} - Número de alertas no vistas
    """
    count = await alert_ops.get_unviewed_alerts_count(current_user["id"])
    return {"count": count}

