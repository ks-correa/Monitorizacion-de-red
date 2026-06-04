"""
Modelo de Alertas para GastoSmart

Este archivo define el modelo de datos para las alertas de sobre-gasto
según el requerimiento RQF-011.
"""

from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime
from enum import Enum

class AlertThresholdType(str, Enum):
    """Tipos de umbral predefinidos"""
    PERCENT_80 = "80"
    PERCENT_90 = "90"
    PERCENT_100 = "100"
    CUSTOM = "custom"

class AlertThresholdConfig(BaseModel):
    """
    Configuración de umbral de alerta de sobre-gasto
    
    Implementa el requerimiento RQF-011: Configuración y alerta de sobre-gasto según umbral personalizado
    """
    user_id: str = Field(..., description="ID del usuario")
    threshold_type: AlertThresholdType = Field(..., description="Tipo de umbral (80, 90, 100 o custom)")
    custom_percentage: Optional[float] = Field(None, ge=10, le=100, description="Porcentaje personalizado (10-100)")
    created_at: datetime = Field(default_factory=datetime.now, description="Fecha de creación")
    updated_at: datetime = Field(default_factory=datetime.now, description="Fecha de última actualización")
    
    @validator('custom_percentage')
    def validate_custom_percentage(cls, v, values):
        """Validación: Si threshold_type es custom, custom_percentage es obligatorio"""
        if values.get('threshold_type') == AlertThresholdType.CUSTOM and v is None:
            raise ValueError('El porcentaje personalizado es obligatorio cuando se selecciona "Otro porcentaje"')
        if values.get('threshold_type') != AlertThresholdType.CUSTOM and v is not None:
            raise ValueError('El porcentaje personalizado solo se usa cuando threshold_type es "custom"')
        return v
    
    def get_threshold_percentage(self) -> float:
        """Obtener el porcentaje de umbral configurado"""
        if self.threshold_type == AlertThresholdType.CUSTOM:
            return self.custom_percentage
        else:
            return float(self.threshold_type.value)

class AlertHistory(BaseModel):
    """
    Historial de alertas enviadas
    
    Registra todas las alertas de sobre-gasto enviadas al usuario.
    """
    id: Optional[str] = Field(None, description="ID único de la alerta")
    user_id: str = Field(..., description="ID del usuario")
    threshold_percentage: float = Field(..., description="Porcentaje de umbral alcanzado")
    amount_spent: float = Field(..., description="Monto gastado al momento de la alerta")
    budget_amount: float = Field(..., description="Presupuesto original del periodo")
    period_month: int = Field(..., description="Mes del periodo (1-12)")
    period_year: int = Field(..., description="Año del periodo")
    sent_at: datetime = Field(default_factory=datetime.now, description="Fecha y hora de envío")
    email_sent: bool = Field(default=True, description="Indica si el correo fue enviado exitosamente")
    viewed: bool = Field(default=False, description="Indica si el usuario ha visto la alerta")

class AlertThresholdConfigResponse(BaseModel):
    """Respuesta de configuración de umbral"""
    user_id: str
    threshold_type: str
    custom_percentage: Optional[float]
    threshold_percentage: float  # Porcentaje calculado
    created_at: datetime
    updated_at: datetime

class AlertHistoryResponse(BaseModel):
    """Respuesta de historial de alertas"""
    id: str
    user_id: str
    threshold_percentage: float
    amount_spent: float
    budget_amount: float
    period_month: int
    period_year: int
    sent_at: datetime
    email_sent: bool
    viewed: bool

class AlertThresholdConfigCreate(BaseModel):
    """Datos para crear/actualizar configuración de umbral"""
    threshold_type: AlertThresholdType
    custom_percentage: Optional[float] = Field(None, ge=10, le=100)
    
    @validator('custom_percentage')
    def validate_custom_percentage(cls, v, values):
        """Validación: Si threshold_type es custom, custom_percentage es obligatorio"""
        if values.get('threshold_type') == AlertThresholdType.CUSTOM and v is None:
            raise ValueError('El porcentaje personalizado es obligatorio cuando se selecciona "Otro porcentaje"')
        return v

