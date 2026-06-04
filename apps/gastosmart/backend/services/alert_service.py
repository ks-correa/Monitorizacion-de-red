"""
Servicio de Detección y Envío de Alertas de Sobre-gasto

Este servicio detecta cuando se cruza un umbral de alerta configurado
y envía la notificación correspondiente por correo electrónico.
Implementa el requerimiento RQF-011.
"""

from datetime import datetime
from typing import Optional
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from database.alert_operations import AlertOperations
from database.user_operations import UserOperations
from services.email_service import EmailService
from models.alert import AlertHistory

class AlertService:
    """
    Servicio para detectar y enviar alertas de sobre-gasto
    """
    
    def __init__(self, database: AsyncIOMotorDatabase):
        """
        Inicializar servicio de alertas
        
        Args:
            database: Base de datos MongoDB
        """
        self.database = database
        alerts_collection = database.alert_thresholds
        alert_history_collection = database.alert_history
        self.alert_ops = AlertOperations(alerts_collection, alert_history_collection)
        self.user_ops = UserOperations(database)
        self.email_service = EmailService(database)
    
    async def check_and_send_alert(
        self,
        user_id: str,
        previous_expense_total: float,
        current_expense_total: float,
        budget_amount: float,
        transaction_date: datetime
    ) -> Optional[AlertHistory]:
        """
        Verificar si se cruzó el umbral y enviar alerta si es necesario
        
        Implementa RN-04: El sistema solo envía la alerta cuando el porcentaje de gasto
        pasa de estar por debajo del umbral a estar mayor o igual a este.
        
        Args:
            user_id: ID del usuario
            previous_expense_total: Total de gastos antes de la operación
            current_expense_total: Total de gastos después de la operación
            budget_amount: Presupuesto mensual del usuario
            transaction_date: Fecha de la transacción
            
        Returns:
            AlertHistory si se envió una alerta, None en caso contrario
        """
        try:
            print(f"🔔 [ALERTA] Verificando umbral para usuario {user_id}")
            print(f"🔔 [ALERTA] Gastos anteriores: {previous_expense_total}, Gastos actuales: {current_expense_total}")
            print(f"🔔 [ALERTA] Presupuesto: {budget_amount}, Fecha: {transaction_date}")
            
            # Obtener configuración de umbral del usuario
            threshold_config = await self.alert_ops.get_alert_threshold_config(user_id)
            
            if not threshold_config:
                print(f"⚠️ [ALERTA] No hay configuración de umbral para el usuario {user_id}")
                return None
            
            threshold_percentage = threshold_config.threshold_percentage
            threshold_amount = (budget_amount * threshold_percentage) / 100
            
            print(f"🔔 [ALERTA] Umbral configurado: {threshold_percentage}% (${threshold_amount})")
            
            # Calcular porcentajes antes y después
            previous_percentage = (previous_expense_total / budget_amount * 100) if budget_amount > 0 else 0
            current_percentage = (current_expense_total / budget_amount * 100) if budget_amount > 0 else 0
            
            print(f"🔔 [ALERTA] Porcentaje anterior: {previous_percentage:.2f}%, Porcentaje actual: {current_percentage:.2f}%")
            
            # Verificar si se cruzó el umbral (de estar por debajo a estar por encima)
            crossed_threshold = (
                previous_percentage < threshold_percentage and 
                current_percentage >= threshold_percentage
            )
            
            print(f"🔔 [ALERTA] ¿Se cruzó el umbral? {crossed_threshold} (anterior < {threshold_percentage}% y actual >= {threshold_percentage}%)")
            
            if not crossed_threshold:
                # No se cruzó el umbral, no enviar alerta
                print(f"ℹ️ [ALERTA] No se cruzó el umbral. No se enviará alerta.")
                return None
            
            # Verificar si ya se envió una alerta hoy para este umbral y periodo
            period_month = transaction_date.month
            period_year = transaction_date.year
            
            print(f"🔔 [ALERTA] Verificando si ya se envió alerta hoy para periodo {period_month}/{period_year}")
            
            already_sent_today = await self.alert_ops.check_alert_sent_today(
                user_id,
                threshold_percentage,
                period_month,
                period_year
            )
            
            if already_sent_today:
                # Ya se envió una alerta hoy, no enviar otra (RN-05)
                print(f"ℹ️ [ALERTA] Ya se envió una alerta hoy para este umbral y periodo. No se enviará otra.")
                return None
            
            # Obtener información del usuario para el correo
            try:
                user_object_id = ObjectId(user_id) if not isinstance(user_id, ObjectId) else user_id
            except Exception:
                print(f"❌ [ALERTA] Error: user_id '{user_id}' no es un ObjectId válido")
                return None
            
            user_doc = await self.user_ops.collection.find_one({"_id": user_object_id})
            if not user_doc:
                print(f"❌ [ALERTA] Usuario {user_id} no encontrado en la base de datos")
                return None
            
            user_email = user_doc.get("email")
            user_name = f"{user_doc.get('first_name', '')} {user_doc.get('last_name', '')}".strip()
            
            if not user_email:
                print(f"❌ [ALERTA] Usuario {user_id} no tiene email configurado")
                return None
            
            print(f"📧 [ALERTA] Enviando correo a {user_email} (Usuario: {user_name})")
            
            # Enviar correo de alerta
            email_sent = await self.email_service.send_overspending_alert(
                email=user_email,
                user_name=user_name or "Usuario",
                threshold_percentage=threshold_percentage,
                amount_spent=current_expense_total,
                budget_amount=budget_amount,
                period_month=period_month,
                period_year=period_year
            )
            
            print(f"📧 [ALERTA] Correo enviado: {email_sent}")
            
            # Registrar en el historial
            alert_history = AlertHistory(
                user_id=user_id,
                threshold_percentage=threshold_percentage,
                amount_spent=current_expense_total,
                budget_amount=budget_amount,
                period_month=period_month,
                period_year=period_year,
                sent_at=datetime.now(),
                email_sent=email_sent,
                viewed=False
            )
            
            saved_alert = await self.alert_ops.create_alert_history(alert_history)
            
            print(f"✅ [ALERTA] Alerta guardada en historial: {saved_alert.id}")
            
            return saved_alert
            
        except Exception as e:
            import traceback
            print(f"❌ [ALERTA] Error al verificar y enviar alerta: {e}")
            print(f"❌ [ALERTA] Traceback: {traceback.format_exc()}")
            return None

