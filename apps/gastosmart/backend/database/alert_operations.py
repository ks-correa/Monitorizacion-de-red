"""
Operaciones de Base de Datos para Alertas

Este archivo contiene todas las operaciones CRUD relacionadas con
las alertas de sobre-gasto en la base de datos MongoDB.
Implementa el requerimiento RQF-011.
"""

from motor.motor_asyncio import AsyncIOMotorCollection
from bson import ObjectId
from typing import Optional, List
from datetime import datetime, date
from models.alert import (
    AlertThresholdConfig, AlertHistory, 
    AlertThresholdConfigResponse, AlertHistoryResponse,
    AlertThresholdConfigCreate
)

class AlertOperations:
    """
    Clase para manejar operaciones de alertas en la base de datos
    """
    
    def __init__(self, alerts_collection: AsyncIOMotorCollection, 
                 alert_history_collection: AsyncIOMotorCollection):
        """
        Inicializar operaciones de alertas
        
        Args:
            alerts_collection: Colección de configuraciones de alertas
            alert_history_collection: Colección de historial de alertas
        """
        self.alerts_collection = alerts_collection
        self.alert_history_collection = alert_history_collection
    
    async def get_alert_threshold_config(self, user_id: str) -> Optional[AlertThresholdConfigResponse]:
        """
        Obtener configuración de umbral de alerta del usuario
        
        Args:
            user_id: ID del usuario
            
        Returns:
            AlertThresholdConfigResponse o None si no existe
        """
        config_doc = await self.alerts_collection.find_one({"user_id": user_id})
        
        if not config_doc:
            return None
        
        config = AlertThresholdConfig(**config_doc)
        threshold_percentage = config.get_threshold_percentage()
        
        return AlertThresholdConfigResponse(
            user_id=config.user_id,
            threshold_type=config.threshold_type.value,
            custom_percentage=config.custom_percentage,
            threshold_percentage=threshold_percentage,
            created_at=config.created_at,
            updated_at=config.updated_at
        )
    
    async def create_or_update_alert_threshold_config(
        self, 
        user_id: str, 
        config_data: AlertThresholdConfigCreate
    ) -> AlertThresholdConfigResponse:
        """
        Crear o actualizar configuración de umbral de alerta
        
        Args:
            user_id: ID del usuario
            config_data: Datos de configuración
            
        Returns:
            AlertThresholdConfigResponse: Configuración guardada
        """
        # Verificar si ya existe configuración
        existing_config = await self.alerts_collection.find_one({"user_id": user_id})
        
        config_dict = {
            "user_id": user_id,
            "threshold_type": config_data.threshold_type.value,
            "custom_percentage": config_data.custom_percentage,
            "updated_at": datetime.now()
        }
        
        if existing_config:
            # Actualizar configuración existente
            config_dict["created_at"] = existing_config.get("created_at", datetime.now())
            await self.alerts_collection.update_one(
                {"user_id": user_id},
                {"$set": config_dict}
            )
        else:
            # Crear nueva configuración
            config_dict["created_at"] = datetime.now()
            await self.alerts_collection.insert_one(config_dict)
        
        # Obtener la configuración actualizada
        updated_doc = await self.alerts_collection.find_one({"user_id": user_id})
        config = AlertThresholdConfig(**updated_doc)
        threshold_percentage = config.get_threshold_percentage()
        
        return AlertThresholdConfigResponse(
            user_id=config.user_id,
            threshold_type=config.threshold_type.value,
            custom_percentage=config.custom_percentage,
            threshold_percentage=threshold_percentage,
            created_at=config.created_at,
            updated_at=config.updated_at
        )
    
    async def create_alert_history(self, alert_data: AlertHistory) -> AlertHistoryResponse:
        """
        Crear registro en el historial de alertas
        
        Args:
            alert_data: Datos de la alerta
            
        Returns:
            AlertHistoryResponse: Alerta registrada
        """
        alert_doc = {
            "user_id": alert_data.user_id,
            "threshold_percentage": alert_data.threshold_percentage,
            "amount_spent": alert_data.amount_spent,
            "budget_amount": alert_data.budget_amount,
            "period_month": alert_data.period_month,
            "period_year": alert_data.period_year,
            "sent_at": alert_data.sent_at,
            "email_sent": alert_data.email_sent,
            "viewed": alert_data.viewed
        }
        
        result = await self.alert_history_collection.insert_one(alert_doc)
        alert_doc["_id"] = result.inserted_id
        
        return AlertHistoryResponse(
            id=str(alert_doc["_id"]),
            user_id=alert_doc["user_id"],
            threshold_percentage=alert_doc["threshold_percentage"],
            amount_spent=alert_doc["amount_spent"],
            budget_amount=alert_doc["budget_amount"],
            period_month=alert_doc["period_month"],
            period_year=alert_doc["period_year"],
            sent_at=alert_doc["sent_at"],
            email_sent=alert_doc["email_sent"],
            viewed=alert_doc.get("viewed", False)
        )
    
    async def get_alert_history(
        self, 
        user_id: str, 
        skip: int = 0, 
        limit: int = 50
    ) -> List[AlertHistoryResponse]:
        """
        Obtener historial de alertas del usuario
        
        Args:
            user_id: ID del usuario
            skip: Número de registros a saltar
            limit: Límite de registros a devolver
            
        Returns:
            List[AlertHistoryResponse]: Lista de alertas ordenadas por fecha (más reciente primero)
        """
        cursor = self.alert_history_collection.find(
            {"user_id": user_id}
        ).sort("sent_at", -1).skip(skip).limit(limit)
        
        alerts = []
        async for alert_doc in cursor:
            alerts.append(AlertHistoryResponse(
                id=str(alert_doc["_id"]),
                user_id=alert_doc["user_id"],
                threshold_percentage=alert_doc["threshold_percentage"],
                amount_spent=alert_doc["amount_spent"],
                budget_amount=alert_doc["budget_amount"],
                period_month=alert_doc["period_month"],
                period_year=alert_doc["period_year"],
                sent_at=alert_doc["sent_at"],
                email_sent=alert_doc["email_sent"],
                viewed=alert_doc.get("viewed", False)
            ))
        
        return alerts
    
    async def get_unviewed_alerts_count(self, user_id: str) -> int:
        """
        Obtener el número de alertas no vistas del usuario
        
        Args:
            user_id: ID del usuario
            
        Returns:
            int: Número de alertas no vistas
        """
        count = await self.alert_history_collection.count_documents({
            "user_id": user_id,
            "viewed": False
        })
        return count
    
    async def mark_alerts_as_viewed(self, user_id: str) -> int:
        """
        Marcar todas las alertas del usuario como vistas
        
        Args:
            user_id: ID del usuario
            
        Returns:
            int: Número de alertas marcadas como vistas
        """
        result = await self.alert_history_collection.update_many(
            {"user_id": user_id, "viewed": False},
            {"$set": {"viewed": True}}
        )
        return result.modified_count
    
    async def check_alert_sent_today(
        self, 
        user_id: str, 
        threshold_percentage: float, 
        period_month: int, 
        period_year: int
    ) -> bool:
        """
        Verificar si ya se envió una alerta hoy para el mismo umbral y periodo
        
        Implementa RN-05: No se enviará más de una alerta por día para la misma combinación
        
        Args:
            user_id: ID del usuario
            threshold_percentage: Porcentaje de umbral
            period_month: Mes del periodo
            period_year: Año del periodo
            
        Returns:
            bool: True si ya se envió una alerta hoy, False en caso contrario
        """
        today = datetime.now().date()
        start_of_day = datetime.combine(today, datetime.min.time())
        end_of_day = datetime.combine(today, datetime.max.time())
        
        existing_alert = await self.alert_history_collection.find_one({
            "user_id": user_id,
            "threshold_percentage": threshold_percentage,
            "period_month": period_month,
            "period_year": period_year,
            "sent_at": {
                "$gte": start_of_day,
                "$lte": end_of_day
            }
        })
        
        return existing_alert is not None

