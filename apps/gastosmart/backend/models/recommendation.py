"""
Modelo de Recomendaciones para GastoSmart

Este archivo define el modelo de datos para las recomendaciones financieras
personalizadas según el requerimiento RQF-013.
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class MonthlyRecommendation(BaseModel):
    """Recomendación personalizada del mes"""
    message: str = Field(..., description="Mensaje de recomendación")
    type: str = Field(..., description="Tipo: 'comparison' o 'budget_percentage'")
    current_month_expenses: float = Field(..., description="Gastos del mes actual")
    previous_month_expenses: Optional[float] = Field(None, description="Gastos del mes anterior")
    budget_percentage: Optional[float] = Field(None, description="Porcentaje de presupuesto utilizado")
    variation_percentage: Optional[float] = Field(None, description="Variación porcentual vs mes anterior")

class CategoryRecommendation(BaseModel):
    """Recomendación por categoría de mayor gasto"""
    category: str = Field(..., description="Nombre de la categoría")
    amount: float = Field(..., description="Monto gastado en esta categoría")
    percentage: float = Field(..., description="Porcentaje que representa sobre el total de gastos")
    message: str = Field(..., description="Mensaje de recomendación")

class GoalRecommendation(BaseModel):
    """Recomendación sobre metas de ahorro"""
    goal_name: str = Field(..., description="Nombre de la meta")
    goal_id: str = Field(..., description="ID de la meta")
    progress_percentage: float = Field(..., description="Porcentaje de avance")
    current_amount: float = Field(..., description="Monto actual ahorrado")
    target_amount: float = Field(..., description="Monto objetivo")
    message: str = Field(..., description="Mensaje de recomendación")

class EducationalTip(BaseModel):
    """Tip educativo del día"""
    tip_id: str = Field(..., description="ID del tip")
    title: str = Field(..., description="Título del tip")
    message: str = Field(..., description="Mensaje del tip")
    category: str = Field(..., description="Categoría del tip (ahorro, presupuesto, etc.)")

class RecommendationsResponse(BaseModel):
    """Respuesta completa de recomendaciones"""
    monthly_recommendation: Optional[MonthlyRecommendation] = Field(None, description="Recomendación del mes")
    category_recommendation: Optional[CategoryRecommendation] = Field(None, description="Recomendación por categoría")
    goal_recommendation: Optional[GoalRecommendation] = Field(None, description="Recomendación sobre metas")
    educational_tip: EducationalTip = Field(..., description="Tip educativo del día")
    has_data: bool = Field(..., description="Indica si hay datos suficientes para generar recomendaciones")

class RecommendationView(BaseModel):
    """Registro de visualización de recomendaciones"""
    user_id: str = Field(..., description="ID del usuario")
    viewed_at: datetime = Field(default_factory=datetime.now, description="Fecha y hora de visualización")
    recommendation_date: datetime = Field(..., description="Fecha de las recomendaciones visualizadas")

