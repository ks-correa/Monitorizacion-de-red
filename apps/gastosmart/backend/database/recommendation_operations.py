"""
Operaciones de Base de Datos para Recomendaciones

Este archivo contiene las operaciones relacionadas con el tracking
de visualización de recomendaciones.
"""

from motor.motor_asyncio import AsyncIOMotorCollection
from bson import ObjectId
from typing import Optional
from datetime import datetime, date

class RecommendationOperations:
    """
    Clase para manejar operaciones de recomendaciones en la base de datos
    """
    
    def __init__(self, recommendation_views_collection: AsyncIOMotorCollection):
        """
        Inicializar operaciones de recomendaciones
        
        Args:
            recommendation_views_collection: Colección de visualizaciones de recomendaciones
        """
        self.collection = recommendation_views_collection
    
    async def get_unviewed_recommendations_count(self, user_id: str) -> int:
        """
        Obtener el número de recomendaciones no vistas del usuario
        
        Una recomendación se considera "no vista" si:
        - No hay registro de visualización para el día actual
        - O la última visualización fue antes de que se generaran nuevas recomendaciones
        
        Args:
            user_id: ID del usuario
            
        Returns:
            int: Número de recomendaciones no vistas (0 o 1, ya que se genera una vez al día)
        """
        try:
            today = datetime.now().date()
            
            # Buscar si hay una visualización de hoy
            view_doc = await self.collection.find_one({
                "user_id": user_id,
                "recommendation_date": {
                    "$gte": datetime.combine(today, datetime.min.time()),
                    "$lt": datetime.combine(today, datetime.max.time())
                }
            })
            
            # Si no hay visualización de hoy, hay recomendaciones no vistas
            return 0 if view_doc else 1
            
        except Exception as e:
            print(f"Error obteniendo contador de recomendaciones no vistas: {e}")
            return 0
    
    async def mark_recommendations_as_viewed(self, user_id: str) -> bool:
        """
        Marcar las recomendaciones del día como vistas
        
        Args:
            user_id: ID del usuario
            
        Returns:
            bool: True si se marcó correctamente
        """
        try:
            today = datetime.now()
            
            # Verificar si ya existe un registro para hoy
            existing = await self.collection.find_one({
                "user_id": user_id,
                "recommendation_date": {
                    "$gte": datetime.combine(today.date(), datetime.min.time()),
                    "$lt": datetime.combine(today.date(), datetime.max.time())
                }
            })
            
            if existing:
                # Actualizar fecha de visualización
                await self.collection.update_one(
                    {"_id": existing["_id"]},
                    {"$set": {"viewed_at": today}}
                )
            else:
                # Crear nuevo registro
                await self.collection.insert_one({
                    "user_id": user_id,
                    "viewed_at": today,
                    "recommendation_date": today
                })
            
            return True
            
        except Exception as e:
            print(f"Error marcando recomendaciones como vistas: {e}")
            return False

