"""
Servicio de Recomendaciones Financieras Personalizadas

Este servicio genera recomendaciones personalizadas basadas en el comportamiento
financiero del usuario.
Implementa el requerimiento RQF-013.
"""

from datetime import datetime, timedelta
from typing import Optional, List
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from database.transaction_operations import TransactionOperations
from database.goal_operations import GoalOperations
from database.user_operations import UserOperations
from models.recommendation import (
    MonthlyRecommendation, CategoryRecommendation, GoalRecommendation,
    EducationalTip, RecommendationsResponse
)
from models.goal import GoalStatus

# Tips educativos predefinidos
EDUCATIONAL_TIPS = [
    {
        "tip_id": "tip_1",
        "title": "Regla 50/30/20",
        "message": "Intenta reservar al menos el 10-20% de tus ingresos mensuales para ahorro. La regla 50/30/20 sugiere: 50% necesidades, 30% deseos, 20% ahorro.",
        "category": "presupuesto"
    },
    {
        "tip_id": "tip_2",
        "title": "Gastos hormiga",
        "message": "Los pequeños gastos diarios pueden sumar grandes cantidades al mes. Revisa tus compras pequeñas y considera si realmente las necesitas.",
        "category": "gastos"
    },
    {
        "tip_id": "tip_3",
        "title": "Fondo de emergencia",
        "message": "Es recomendable tener un fondo de emergencia equivalente a 3-6 meses de tus gastos mensuales. Esto te ayudará a enfrentar imprevistos sin afectar tus metas.",
        "category": "ahorro"
    },
    {
        "tip_id": "tip_4",
        "title": "Presupuesto flexible",
        "message": "Revisa y ajusta tu presupuesto mensualmente según tus necesidades reales. Un presupuesto rígido puede ser difícil de mantener.",
        "category": "presupuesto"
    },
    {
        "tip_id": "tip_5",
        "title": "Metas realistas",
        "message": "Establece metas de ahorro alcanzables y con plazos realistas. Es mejor cumplir metas pequeñas que frustrarse con objetivos inalcanzables.",
        "category": "metas"
    },
    {
        "tip_id": "tip_6",
        "title": "Comparar antes de comprar",
        "message": "Antes de hacer una compra importante, compara precios en diferentes lugares. Esto puede ayudarte a ahorrar significativamente.",
        "category": "gastos"
    },
    {
        "tip_id": "tip_7",
        "title": "Ahorro automático",
        "message": "Considera configurar transferencias automáticas a tu cuenta de ahorros. Si no ves el dinero, es menos probable que lo gastes.",
        "category": "ahorro"
    },
    {
        "tip_id": "tip_8",
        "title": "Revisar suscripciones",
        "message": "Revisa periódicamente tus suscripciones y servicios. Cancela aquellos que no uses regularmente para liberar dinero para tus metas.",
        "category": "gastos"
    }
]

class RecommendationService:
    """
    Servicio para generar recomendaciones financieras personalizadas
    """
    
    def __init__(self, database: AsyncIOMotorDatabase):
        """
        Inicializar servicio de recomendaciones
        
        Args:
            database: Base de datos MongoDB
        """
        self.database = database
        transactions_collection = database.transactions
        goals_collection = database.goals
        self.transaction_ops = TransactionOperations(transactions_collection)
        self.goal_ops = GoalOperations(goals_collection, transactions_collection)
        self.user_ops = UserOperations(database)
    
    def _get_tip_of_day(self) -> EducationalTip:
        """
        Obtener el tip educativo del día
        
        Implementa RN-06: El tip educativo se selecciona de una lista predefinida,
        rotando diariamente o en cada acceso.
        """
        # Usar el día del año para rotar los tips
        day_of_year = datetime.now().timetuple().tm_yday
        tip_index = day_of_year % len(EDUCATIONAL_TIPS)
        tip_data = EDUCATIONAL_TIPS[tip_index]
        
        return EducationalTip(
            tip_id=tip_data["tip_id"],
            title=tip_data["title"],
            message=tip_data["message"],
            category=tip_data["category"]
        )
    
    async def _get_monthly_recommendation(
        self,
        user_id: str,
        current_year: int,
        current_month: int,
        budget_amount: float
    ) -> Optional[MonthlyRecommendation]:
        """
        Generar recomendación personalizada del mes
        
        Implementa RN-03: Usa comparación con mes anterior si existe,
        sino usa porcentaje del presupuesto utilizado.
        """
        try:
            # Calcular gastos del mes actual
            current_expenses = await self.transaction_ops.get_monthly_expense_total(
                user_id, current_year, current_month
            )
            
            # Calcular gastos del mes anterior
            if current_month == 1:
                previous_year = current_year - 1
                previous_month = 12
            else:
                previous_year = current_year
                previous_month = current_month - 1
            
            previous_expenses = await self.transaction_ops.get_monthly_expense_total(
                user_id, previous_year, previous_month
            )
            
            # Si hay datos del mes anterior, usar comparación
            if previous_expenses > 0:
                variation = ((current_expenses - previous_expenses) / previous_expenses) * 100
                
                if variation < -5:
                    message = f"Este mes has gastado un {abs(variation):.1f}% menos que el mes anterior, ¡sigue así!"
                elif variation > 5:
                    message = f"Este mes has gastado un {variation:.1f}% más que el mes anterior. Revisa tus gastos para mantener el control."
                else:
                    message = f"Tus gastos este mes son similares al mes anterior ({variation:+.1f}%). Mantén este equilibrio."
                
                return MonthlyRecommendation(
                    message=message,
                    type="comparison",
                    current_month_expenses=current_expenses,
                    previous_month_expenses=previous_expenses,
                    budget_percentage=None,
                    variation_percentage=variation
                )
            # Si no hay mes anterior, usar porcentaje de presupuesto
            elif budget_amount > 0:
                budget_percentage = (current_expenses / budget_amount) * 100
                
                if budget_percentage < 50:
                    message = f"Has utilizado el {budget_percentage:.1f}% de tu presupuesto mensual. Vas muy bien, mantén este ritmo."
                elif budget_percentage < 80:
                    message = f"Has utilizado el {budget_percentage:.1f}% de tu presupuesto mensual. Estás en buen camino, pero revisa tus gastos para evitar sobrepasarlo."
                elif budget_percentage < 100:
                    message = f"Has utilizado el {budget_percentage:.1f}% de tu presupuesto mensual. Estás cerca del límite, revisa tus gastos para evitar sobrepasarlo."
                else:
                    message = f"Has superado tu presupuesto mensual ({budget_percentage:.1f}%). Es importante revisar tus gastos para mejorar tus finanzas."
                
                return MonthlyRecommendation(
                    message=message,
                    type="budget_percentage",
                    current_month_expenses=current_expenses,
                    previous_month_expenses=None,
                    budget_percentage=budget_percentage,
                    variation_percentage=None
                )
            
            return None
            
        except Exception as e:
            print(f"Error generando recomendación mensual: {e}")
            return None
    
    async def _get_category_recommendation(
        self,
        user_id: str,
        current_year: int,
        current_month: int
    ) -> Optional[CategoryRecommendation]:
        """
        Generar recomendación por categoría de mayor gasto
        
        Implementa RN-04: La categoría más alta se calcula a partir de los gastos del mes actual.
        """
        try:
            # Calcular fechas del mes
            start_date = datetime(current_year, current_month, 1)
            if current_month == 12:
                end_date = datetime(current_year + 1, 1, 1)
            else:
                end_date = datetime(current_year, current_month + 1, 1)
            
            # Pipeline de agregación para obtener gastos por categoría
            pipeline = [
                {
                    "$match": {
                        "user_id": user_id,
                        "type": "expense",
                        "date": {
                            "$gte": start_date,
                            "$lt": end_date
                        }
                    }
                },
                {
                    "$group": {
                        "_id": "$category",
                        "total": {"$sum": "$amount"}
                    }
                },
                {
                    "$sort": {"total": -1}
                },
                {
                    "$limit": 1
                }
            ]
            
            results = await self.transaction_ops.collection.aggregate(pipeline).to_list(length=1)
            
            if not results or len(results) == 0:
                return None
            
            top_category = results[0]
            category_name = top_category["_id"]
            category_amount = float(top_category["total"])
            
            # Calcular total de gastos del mes
            total_expenses = await self.transaction_ops.get_monthly_expense_total(
                user_id, current_year, current_month
            )
            
            if total_expenses == 0:
                return None
            
            percentage = (category_amount / total_expenses) * 100
            
            message = f"Has gastado {self._format_currency(category_amount)} en {category_name}, representa el {percentage:.1f}% de tus gastos del mes. Revisa esta categoría si quieres reducir gastos."
            
            return CategoryRecommendation(
                category=category_name,
                amount=category_amount,
                percentage=percentage,
                message=message
            )
            
        except Exception as e:
            print(f"Error generando recomendación por categoría: {e}")
            return None
    
    async def _get_goal_recommendation(self, user_id: str) -> Optional[GoalRecommendation]:
        """
        Generar recomendación sobre metas de ahorro
        
        Implementa RN-05: Prioriza meta principal o meta con fecha objetivo más próxima.
        """
        try:
            # Obtener todas las metas activas
            goals = await self.goal_ops.get_user_goals(user_id, status=GoalStatus.ACTIVE)
            
            if not goals or len(goals) == 0:
                return None
            
            # Priorizar: primero meta principal, luego meta con fecha más próxima
            main_goal = None
            closest_goal = None
            closest_date = None
            
            for goal in goals:
                # Buscar meta principal
                if goal.is_main:
                    main_goal = goal
                    break
                
                # Buscar meta con fecha más próxima
                if goal.target_date:
                    goal_date = goal.target_date
                    # target_date ya es un objeto date según el modelo
                    if isinstance(goal_date, datetime):
                        goal_date = goal_date.date()
                    
                    if closest_date is None or goal_date < closest_date:
                        closest_date = goal_date
                        closest_goal = goal
            
            # Usar meta principal si existe, sino la más cercana
            selected_goal = main_goal if main_goal else closest_goal
            
            if not selected_goal:
                # Si no hay fecha, usar la primera meta activa
                selected_goal = goals[0]
            
            # Calcular progreso
            current_amount = float(selected_goal.current_amount)
            target_amount = float(selected_goal.target_amount)
            
            if target_amount == 0:
                return None
            
            progress_percentage = (current_amount / target_amount) * 100
            
            goal_name = selected_goal.name
            goal_id = selected_goal.id
            
            if progress_percentage < 25:
                message = f"Estás al {progress_percentage:.1f}% de cumplir tu meta '{goal_name}'. ¡Comienza a ahorrar regularmente para lograrla a tiempo!"
            elif progress_percentage < 50:
                message = f"Estás al {progress_percentage:.1f}% de cumplir tu meta '{goal_name}'. Mantén tu nivel de ahorro para lograrla a tiempo."
            elif progress_percentage < 75:
                message = f"Estás al {progress_percentage:.1f}% de cumplir tu meta '{goal_name}'. ¡Vas muy bien! Sigue así para alcanzarla."
            elif progress_percentage < 100:
                message = f"Estás al {progress_percentage:.1f}% de cumplir tu meta '{goal_name}'. ¡Estás muy cerca! Mantén el ritmo para lograrla."
            else:
                message = f"¡Felicidades! Has cumplido tu meta '{goal_name}'. Considera establecer una nueva meta para seguir creciendo financieramente."
            
            return GoalRecommendation(
                goal_name=goal_name,
                goal_id=goal_id,
                progress_percentage=progress_percentage,
                current_amount=current_amount,
                target_amount=target_amount,
                message=message
            )
            
        except Exception as e:
            print(f"Error generando recomendación sobre metas: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    def _format_currency(self, amount: float) -> str:
        """Formatear monto como moneda"""
        return f"${amount:,.0f}".replace(",", ".")
    
    async def get_recommendations(self, user_id: str) -> RecommendationsResponse:
        """
        Obtener todas las recomendaciones personalizadas para el usuario
        
        Implementa el requerimiento RQF-013 completo.
        """
        try:
            # Obtener fecha actual
            now = datetime.now()
            current_year = now.year
            current_month = now.month
            
            # Obtener presupuesto del usuario
            try:
                user_object_id = ObjectId(user_id) if not isinstance(user_id, ObjectId) else user_id
            except Exception:
                user_object_id = user_id
            
            user_doc = await self.user_ops.collection.find_one({"_id": user_object_id})
            budget_amount = user_doc.get("initial_budget", 0) if user_doc else 0
            
            # Generar todas las recomendaciones
            monthly_rec = await self._get_monthly_recommendation(
                user_id, current_year, current_month, budget_amount
            )
            
            category_rec = await self._get_category_recommendation(
                user_id, current_year, current_month
            )
            
            goal_rec = await self._get_goal_recommendation(user_id)
            
            educational_tip = self._get_tip_of_day()
            
            # Verificar si hay datos suficientes
            has_data = monthly_rec is not None or category_rec is not None or goal_rec is not None
            
            return RecommendationsResponse(
                monthly_recommendation=monthly_rec,
                category_recommendation=category_rec,
                goal_recommendation=goal_rec,
                educational_tip=educational_tip,
                has_data=has_data
            )
            
        except Exception as e:
            print(f"Error obteniendo recomendaciones: {e}")
            import traceback
            traceback.print_exc()
            # Retornar al menos el tip educativo
            return RecommendationsResponse(
                monthly_recommendation=None,
                category_recommendation=None,
                goal_recommendation=None,
                educational_tip=self._get_tip_of_day(),
                has_data=False
            )

