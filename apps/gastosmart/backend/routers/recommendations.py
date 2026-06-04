"""
Endpoints de API para Recomendaciones Financieras

Este archivo contiene todos los endpoints REST para manejar operaciones
relacionadas con recomendaciones financieras personalizadas.
Implementa el requerimiento RQF-013.
"""

from fastapi import APIRouter, HTTPException, Depends, status
from database.connection import get_async_database
from database.recommendation_operations import RecommendationOperations
from services.recommendation_service import RecommendationService
from models.recommendation import RecommendationsResponse
from motor.motor_asyncio import AsyncIOMotorDatabase
from services.auth_service import get_current_user

# Crear router para recomendaciones
router = APIRouter(prefix="/api/recommendations", tags=["recomendaciones"])

def get_recommendation_operations(db: AsyncIOMotorDatabase = Depends(get_async_database)) -> RecommendationOperations:
    """
    Obtener instancia de operaciones de recomendaciones
    
    Args:
        db: Base de datos MongoDB
        
    Returns:
        RecommendationOperations: Instancia para operaciones de recomendaciones
    """
    recommendation_views_collection = db.recommendation_views
    return RecommendationOperations(recommendation_views_collection)

def get_recommendation_service(db: AsyncIOMotorDatabase = Depends(get_async_database)) -> RecommendationService:
    """
    Obtener instancia del servicio de recomendaciones
    
    Args:
        db: Base de datos MongoDB
        
    Returns:
        RecommendationService: Instancia del servicio de recomendaciones
    """
    return RecommendationService(db)

@router.get("/", response_model=RecommendationsResponse)
async def get_recommendations(
    current_user: dict = Depends(get_current_user),
    recommendation_service: RecommendationService = Depends(get_recommendation_service),
    recommendation_ops: RecommendationOperations = Depends(get_recommendation_operations)
):
    """
    Obtener recomendaciones financieras personalizadas del usuario
    
    Implementa el requerimiento RQF-013 completo.
    Al obtener las recomendaciones, se marcan como vistas.
    
    Returns:
        RecommendationsResponse: Recomendaciones personalizadas
    """
    try:
        recommendations = await recommendation_service.get_recommendations(current_user["id"])
        
        # Marcar recomendaciones como vistas cuando se obtienen
        await recommendation_ops.mark_recommendations_as_viewed(current_user["id"])
        
        return recommendations
    except Exception as e:
        print(f"Error obteniendo recomendaciones: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener recomendaciones"
        )

@router.get("/unviewed-count")
async def get_unviewed_recommendations_count(
    current_user: dict = Depends(get_current_user),
    recommendation_ops: RecommendationOperations = Depends(get_recommendation_operations)
):
    """
    Obtener el número de recomendaciones no vistas del usuario
    
    Returns:
        dict: {"count": int} - Número de recomendaciones no vistas (0 o 1)
    """
    count = await recommendation_ops.get_unviewed_recommendations_count(current_user["id"])
    return {"count": count}

