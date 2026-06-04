"""
Operaciones de Base de Datos para Reportes Financieros

Este archivo contiene las operaciones de base de datos para generar
y gestionar reportes financieros en GastoSmart.
"""

from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Optional, Dict, Any
from datetime import datetime, date, timedelta
from bson import ObjectId
import asyncio  
from collections import defaultdict

from models.report import (
    MonthlySummary, ExpenseCategoryReport, ExpenseCategoryData,
    DailyExpensesReport, DailyExpenseData, IncomeTrendReport,
    IncomeTrendData, SavingsEvolutionReport, SavingsEvolutionData,
    IncomeExpenseComparisonReport, IncomeExpenseComparisonData,
    FinancialReport, ReportType, ReportFilter, ReportStats
)
from models.transaction import TransactionType

class ReportOperations:
    """Clase para operaciones de reportes financieros"""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.transactions_collection = db.transactions
        self.goals_collection = db.goals
        self.reports_collection = db.reports
        self.users_collection = db.users
    
    async def generate_monthly_summary(self, user_id: str, year: int, month: int) -> MonthlySummary:
        """Genera un resumen mensual para un usuario"""
        print(f"DEBUG generate_monthly_summary - user_id: {user_id}, year: {year}, month: {month}")
    
        # Calcular fechas del mes
        start_date = datetime(year, month, 1)
        if month == 12:
            end_date = datetime(year + 1, 1, 1) - timedelta(days=1)
        else:
            end_date = datetime(year, month + 1, 1) - timedelta(days=1)
    
        print(f"DEBUG generate_monthly_summary - Buscando transacciones entre {start_date} y {end_date}")
    
        # Obtener información del usuario para verificar presupuesto
        try:
            user_object_id = ObjectId(user_id) if not isinstance(user_id, ObjectId) else user_id
        except Exception:
            user_object_id = user_id
        
        user_doc = await self.users_collection.find_one({"_id": user_object_id})
        user_budget = user_doc.get("initial_budget", 0.0) if user_doc else 0.0
        budget_configured = user_doc.get("budget_configured", False) if user_doc else False
        registration_date = user_doc.get("registration_date", datetime.now()) if user_doc else datetime.now()
        
        # Convertir registration_date a datetime si es string
        if isinstance(registration_date, str):
            registration_date = datetime.fromisoformat(registration_date.replace('Z', '+00:00'))
        elif not isinstance(registration_date, datetime):
            registration_date = datetime.now()
        
        # Verificar si el mes consultado es posterior o igual al mes de registro
        report_month = datetime(year, month, 1)
        registration_month = datetime(registration_date.year, registration_date.month, 1)
        month_has_budget = budget_configured and report_month >= registration_month
        
        print(f"DEBUG generate_monthly_summary - Presupuesto: {user_budget}, Configurado: {budget_configured}, Mes tiene presupuesto: {month_has_budget}")
    
        # Obtener transacciones del mes
        query = {
            "user_id": user_id,
            "date": {
                "$gte": start_date,
                "$lte": end_date
            }
        }
        print(f"DEBUG generate_monthly_summary - Query: {query}")

        # Usar agregación
        pipeline = [
            {"$match": query},
            {
                "$group": {
                    "_id": "$type",
                    "total_amount": {"$sum": "$amount"},
                    "count": {"$sum": 1}
                }
            }
        ]
    
        # Ejecutar agregación y esperar resultados
        cursor = self.transactions_collection.aggregate(pipeline)
        results = await cursor.to_list(length=None)
        print(f"DEBUG generate_monthly_summary - Resultados agregación: {results}")
    
        # Calcular totales desde agregación
        total_income = 0.0
        total_expenses = 0.0
        income_count = 0
        expense_count = 0
    
        for result in results:
            if result["_id"] == TransactionType.INCOME:
                total_income = result["total_amount"]
                income_count = result["count"]
            elif result["_id"] == TransactionType.EXPENSE:
                total_expenses = result["total_amount"]
                expense_count = result["count"]
    
        # Calcular balance: si el mes tiene presupuesto configurado, incluir presupuesto (salario)
        # Si no tiene presupuesto configurado (meses anteriores), solo usar ingresos - gastos
        if month_has_budget:
            # Balance = presupuesto (salario) + ingresos - gastos
            balance = user_budget + total_income - total_expenses
            print(f"DEBUG generate_monthly_summary - Balance con presupuesto: {user_budget} + {total_income} - {total_expenses} = {balance}")
        else:
            # Balance = solo ingresos - gastos (meses anteriores sin presupuesto configurado)
            balance = total_income - total_expenses
            print(f"DEBUG generate_monthly_summary - Balance sin presupuesto: {total_income} - {total_expenses} = {balance}")
        
        available_balance = balance
    
        # Calcular porcentaje de ahorro basado en el total de ingresos (incluyendo presupuesto si aplica)
        total_income_for_savings = user_budget + total_income if month_has_budget else total_income
        savings_percentage = (balance / total_income_for_savings * 100) if total_income_for_savings > 0 else 0.0
    
        # Calcular total de transacciones
        total_transactions = income_count + expense_count
    
        return MonthlySummary(
            month=f"{year}-{month:02d}",
            year=year,
            total_income=total_income,
            total_expenses=total_expenses,
            balance=balance,
            available_balance=available_balance,
            savings_percentage=savings_percentage,
            transaction_count=total_transactions,
            income_count=income_count,
            expense_count=expense_count,
            income_change=0.0,
            expense_change=0.0,
            balance_change=0.0
        )
    
    async def get_monthly_summary(self, user_id: str, year: int, month: int) -> Optional[MonthlySummary]:
        """Obtiene resumen mensual existente o lo genera si no existe"""
        try:
            # Intentar obtener resumen existente
            summary = await self.reports_collection.find_one({
                "user_id": user_id,
                "report_type": ReportType.MONTHLY_SUMMARY,
                "month": f"{year}-{month:02d}"
            })
            
            if summary:
                return MonthlySummary(**summary)
            
            # Si no existe, generar nuevo resumen
            return await self.generate_monthly_summary(user_id, year, month)
            
        except Exception as e:
            print(f"Error en get_monthly_summary: {str(e)}")
            raise
    
    async def generate_expense_category_report(self, user_id: str, start_date: date, end_date: date) -> ExpenseCategoryReport:
        """
        Genera reporte de gastos por categoría
        Implementa RQF-009: Gráfico de gastos por categoría
        """
        # Obtener gastos en el período
        query = {
            "user_id": user_id,
            "type": "expense",  # Usar string, no enum
            "date": {
                "$gte": datetime.combine(start_date, datetime.min.time()),
                "$lte": datetime.combine(end_date, datetime.max.time())
            }
        }
        # Usar agregación como goal_operations.py
        pipeline = [
            {"$match": query},
            {
                "$group": {
                    "_id": "$category",
                    "total_amount": {"$sum": "$amount"},
                    "count": {"$sum": 1}
                }
            },
            {"$sort": {"total_amount": -1}}
        ]
        
        cursor = self.transactions_collection.aggregate(pipeline)
        results = await cursor.to_list(length=None)
        
        # Procesar resultados de agregación
        category_totals = defaultdict(lambda: {"amount": 0.0, "count": 0})
        
        for result in results:
            category = result["_id"]
            amount = result["total_amount"]
            count = result["count"]
            category_totals[category]["amount"] = amount
            category_totals[category]["count"] = count
        
        # Calcular total de gastos
        total_expenses = sum(data["amount"] for data in category_totals.values())
        
        # Crear datos de categorías
        categories = []
        colors = ["#f97316", "#3b82f6", "#8b5cf6", "#10b981", "#ef4444", "#f59e0b"]
        
        for i, (category, data) in enumerate(category_totals.items()):
            percentage = (data["amount"] / total_expenses * 100) if total_expenses > 0 else 0.0
            color = colors[i % len(colors)]
            
            categories.append(ExpenseCategoryData(
                category=category,
                amount=data["amount"],
                percentage=percentage,
                transaction_count=data["count"],
                color=color
            ))
        
        # Ordenar por monto descendente
        categories.sort(key=lambda x: x.amount, reverse=True)
        
        return ExpenseCategoryReport(
            period_start=start_date,
            period_end=end_date,
            total_expenses=total_expenses,
            categories=categories
        )
    
    async def generate_daily_expenses_report(self, user_id: str, week_start: date) -> DailyExpensesReport:
        """Genera reporte de gastos diarios de una semana"""
        week_end = week_start + timedelta(days=6)
        
        # Obtener gastos de la semana
        query = {
            "user_id": user_id,
            "type": "expense",  # Usar string, no enum
            "date": {
                "$gte": datetime.combine(week_start, datetime.min.time()),
                "$lte": datetime.combine(week_end, datetime.max.time())
            }
        }
        # Usar agregación como goal_operations.py
        pipeline = [
            {"$match": query},
            {
                "$group": {
                    "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$date"}},
                    "total_amount": {"$sum": "$amount"},
                    "count": {"$sum": 1}
                }
            },
            {"$sort": {"_id": 1}}
        ]
        
        cursor = self.transactions_collection.aggregate(pipeline)
        results = await cursor.to_list(length=None)
        
        # Procesar resultados de agregación
        daily_totals = defaultdict(lambda: {"amount": 0.0, "count": 0})
        
        for result in results:
            expense_date = datetime.strptime(result["_id"], "%Y-%m-%d").date()
            amount = result["total_amount"]
            count = result["count"]
            daily_totals[expense_date]["amount"] = amount
            daily_totals[expense_date]["count"] = count
        
        # Crear datos diarios
        daily_data = []
        days_of_week = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
        
        for i in range(7):
            current_date = week_start + timedelta(days=i)
            day_name = days_of_week[i]
            data = daily_totals.get(current_date, {"amount": 0.0, "count": 0})
            
            daily_data.append(DailyExpenseData(
                day=day_name,
                expense_date=current_date,
                amount=data["amount"],
                transaction_count=data["count"]
            ))
        
        total_week_expenses = sum(data.amount for data in daily_data)
        average_daily_expense = total_week_expenses / 7
        
        return DailyExpensesReport(
            week_start=week_start,
            week_end=week_end,
            daily_data=daily_data,
            total_week_expenses=total_week_expenses,
            average_daily_expense=average_daily_expense
        )
    
    async def generate_income_trend_report(self, user_id: str, months: int = 8, reference_year: Optional[int] = None, reference_month: Optional[int] = None) -> IncomeTrendReport:
        """Genera reporte de tendencia de ingresos"""
        # SIEMPRE usar año/mes de referencia si se proporcionan, NUNCA usar fecha actual como fallback
        # Si no se proporcionan, solo entonces usar fecha actual
        if reference_year is not None and reference_month is not None:
            # Convertir a int explícitamente por si acaso viene como string
            try:
                reference_year = int(reference_year)
                reference_month = int(reference_month)
            except (ValueError, TypeError) as e:
                raise ValueError(f"Error al convertir año/mes: año={reference_year}, mes={reference_month}, error={str(e)}")
            
            # Validar que el mes esté en rango válido
            if not (1 <= reference_month <= 12):
                raise ValueError(f"Mes inválido: {reference_month}. Debe estar entre 1 y 12")
            
            print(f"DEBUG generate_income_trend_report - Valores recibidos: año={reference_year} (tipo: {type(reference_year)}), mes={reference_month} (tipo: {type(reference_month)})")
            
            try:
                end_date = datetime(reference_year, reference_month, 1)
                print(f"DEBUG generate_income_trend_report - Fecha inicial creada: {end_date}")
            except ValueError as e:
                raise ValueError(f"Error al crear fecha inicial: año={reference_year}, mes={reference_month}, error={str(e)}")
            # Ir al último día del mes de referencia
            if reference_month == 12:
                try:
                    end_date = datetime(reference_year + 1, 1, 1) - timedelta(days=1)
                    print(f"DEBUG generate_income_trend_report - End date (diciembre): {end_date}")
                except ValueError as e:
                    raise ValueError(f"Error al crear end_date para diciembre: año={reference_year + 1}, error={str(e)}")
            else:
                next_month = reference_month + 1
                print(f"DEBUG generate_income_trend_report - Calculando end_date: año={reference_year}, mes_actual={reference_month}, mes_siguiente={next_month}")
                if not (1 <= next_month <= 12):
                    raise ValueError(f"Mes siguiente inválido: {next_month}, reference_month={reference_month}")
                try:
                    end_date = datetime(reference_year, next_month, 1) - timedelta(days=1)
                    print(f"DEBUG generate_income_trend_report - End date (mes normal): {end_date}")
                except ValueError as e:
                    raise ValueError(f"Error al crear end_date: año={reference_year}, mes={next_month}, error={str(e)}")
            
            print(f"DEBUG generate_income_trend_report - Usando referencia: año={reference_year}, mes={reference_month}, end_date={end_date}")
        else:
            end_date = datetime.now()
            print(f"DEBUG generate_income_trend_report - No se proporcionó referencia, usando fecha actual: {end_date}")
        
        # Calcular fecha de inicio retrocediendo meses completos desde end_date
        # start_date debe ser el primer día del mes más antiguo que queremos incluir
        start_date = end_date
        for _ in range(months - 1):
            # Retroceder un mes completo
            try:
                if start_date.month == 1:
                    new_year = start_date.year - 1
                    new_month = 12
                    start_date = datetime(new_year, new_month, 1)
                else:
                    new_year = start_date.year
                    new_month = start_date.month - 1
                    # Validar que el mes sea válido
                    if not (1 <= new_month <= 12):
                        raise ValueError(f"Mes inválido al retroceder: {new_month}")
                    start_date = datetime(new_year, new_month, 1)
            except ValueError as e:
                raise ValueError(f"Error al calcular start_date: {str(e)}, fecha actual: {start_date}")
        
        # Asegurar que start_date sea el primer día del mes
        try:
            start_date = datetime(start_date.year, start_date.month, 1)
        except ValueError as e:
            raise ValueError(f"Error al crear start_date final: año={start_date.year}, mes={start_date.month}, error={str(e)}")
        
        print(f"DEBUG generate_income_trend_report - Rango de fechas: start_date={start_date}, end_date={end_date}")
        
        # Obtener ingresos del período ESPECÍFICO (solo dentro del rango)
        query = {
            "user_id": user_id,
            "type": "income",  # Usar string, no enum
            "date": {
                "$gte": start_date,
                "$lte": end_date
            }
        }
        print(f"DEBUG generate_income_trend_report - Query: {query}")
        # Usar agregación como goal_operations.py
        pipeline = [
            {"$match": query},
            {
                "$group": {
                    "_id": {
                        "year": {"$year": "$date"},
                        "month": {"$month": "$date"}
                    },
                    "total_amount": {"$sum": "$amount"},
                    "count": {"$sum": 1}
                }
            },
            {"$sort": {"_id.year": 1, "_id.month": 1}}
        ]
        
        cursor = self.transactions_collection.aggregate(pipeline)
        results = await cursor.to_list(length=None)
        
        print(f"DEBUG generate_income_trend_report - Resultados de la consulta: {len(results)} meses con datos")
        
        # Procesar resultados de agregación
        monthly_totals = defaultdict(lambda: {"amount": 0.0, "count": 0})
        
        for result in results:
            month_key = f"{result['_id']['year']}-{result['_id']['month']:02d}"
            amount = result["total_amount"]
            count = result["count"]
            monthly_totals[month_key]["amount"] = amount
            monthly_totals[month_key]["count"] = count
            print(f"DEBUG generate_income_trend_report - Mes con datos: {month_key}, amount={amount}")
        
        # Crear datos mensuales retrocediendo desde la fecha de referencia
        monthly_data = []
        month_names = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
        
        # Crear lista de fechas retrocediendo mes por mes
        dates_list = []
        current_date = end_date
        print(f"DEBUG generate_income_trend_report - Iniciando retroceso de meses: end_date={end_date}, months={months}")
        for i in range(months):
            print(f"DEBUG generate_income_trend_report - Iteración {i+1}/{months}: current_date={current_date}, month={current_date.month}")
            dates_list.append(current_date)
            # Retroceder un mes (usar último día del mes anterior)
            if current_date.month == 1:
                # Retroceder a diciembre del año anterior
                new_year = current_date.year - 1
                print(f"DEBUG generate_income_trend_report - Retrocediendo desde enero: new_year={new_year}")
                # Ir al último día de diciembre (día anterior al 1 de enero del año nuevo)
                try:
                    current_date = datetime(new_year + 1, 1, 1) - timedelta(days=1)
                    print(f"DEBUG generate_income_trend_report - Nueva fecha (desde enero): {current_date}")
                except ValueError as e:
                    raise ValueError(f"Error al crear fecha desde enero: año={new_year + 1}, error={str(e)}")
            else:
                # Retroceder al mes anterior
                new_year = current_date.year
                new_month = current_date.month - 1
                next_month = new_month + 1
                print(f"DEBUG generate_income_trend_report - Retrocediendo mes: new_year={new_year}, new_month={new_month}, next_month={next_month}")
                # Validar que el mes sea válido antes de crear el datetime
                if not (1 <= new_month <= 12):
                    raise ValueError(f"Mes inválido al retroceder: {new_month}, current_date.month={current_date.month}")
                # Validar que el mes siguiente sea válido
                if not (1 <= next_month <= 12):
                    raise ValueError(f"Mes siguiente inválido: {next_month}, new_month={new_month}")
                # Ir al último día del mes anterior
                try:
                    current_date = datetime(new_year, next_month, 1) - timedelta(days=1)
                    print(f"DEBUG generate_income_trend_report - Nueva fecha (retroceso normal): {current_date}")
                except ValueError as e:
                    raise ValueError(f"Error al crear fecha retrocediendo: año={new_year}, mes={next_month}, error={str(e)}")
        
        # Invertir para tener del más antiguo al más reciente
        dates_list.reverse()
        
        for current_date in dates_list:
            month_key = f"{current_date.year}-{current_date.month:02d}"
            data = monthly_totals.get(month_key, {"amount": 0.0, "count": 0})
            
            print(f"DEBUG generate_income_trend_report - Creando dato para {month_key}: amount={data['amount']}, count={data['count']}")
            
            monthly_data.append(IncomeTrendData(
                month=month_names[current_date.month - 1],
                year=current_date.year,
                amount=data["amount"],
                transaction_count=data["count"]
            ))
        
        # Ordenar cronológicamente
        monthly_data.sort(key=lambda x: (x.year, month_names.index(x.month)))
        
        total_income = sum(data.amount for data in monthly_data)
        average_monthly_income = total_income / len(monthly_data) if monthly_data else 0.0
        
        # Calcular tasa de crecimiento
        growth_rate = 0.0
        if len(monthly_data) >= 2:
            first_month = monthly_data[0].amount
            last_month = monthly_data[-1].amount
            if first_month > 0:
                growth_rate = ((last_month - first_month) / first_month) * 100
        
        return IncomeTrendReport(
            period_start=start_date.date(),
            period_end=end_date.date(),
            monthly_data=monthly_data,
            total_income=total_income,
            average_monthly_income=average_monthly_income,
            growth_rate=growth_rate
        )
    
    async def generate_savings_evolution_report(self, user_id: str, months: int = 8, reference_year: Optional[int] = None, reference_month: Optional[int] = None) -> SavingsEvolutionReport:
        """Genera reporte de evolución de ahorros"""
        # SIEMPRE usar año/mes de referencia si se proporcionan, NUNCA usar fecha actual como fallback
        if reference_year is not None and reference_month is not None:
            # Validar que el mes esté en rango válido
            if not (1 <= reference_month <= 12):
                raise ValueError(f"Mes inválido: {reference_month}. Debe estar entre 1 y 12")
            
            end_date = datetime(reference_year, reference_month, 1)
            # Ir al último día del mes de referencia
            if reference_month == 12:
                end_date = datetime(reference_year + 1, 1, 1) - timedelta(days=1)
            else:
                end_date = datetime(reference_year, reference_month + 1, 1) - timedelta(days=1)
            
            print(f"DEBUG generate_savings_evolution_report - Usando referencia: año={reference_year}, mes={reference_month}, end_date={end_date}")
        else:
            end_date = datetime.now()
            print(f"DEBUG generate_savings_evolution_report - No se proporcionó referencia, usando fecha actual: {end_date}")
        
        # Calcular fecha de inicio retrocediendo meses completos desde end_date
        start_date = end_date
        for _ in range(months - 1):
            # Retroceder un mes completo
            if start_date.month == 1:
                start_date = datetime(start_date.year - 1, 12, 1)
            else:
                start_date = datetime(start_date.year, start_date.month - 1, 1)
        
        # Asegurar que start_date sea el primer día del mes
        start_date = datetime(start_date.year, start_date.month, 1)
        
        print(f"DEBUG generate_savings_evolution_report - Rango de fechas: start_date={start_date}, end_date={end_date}")
        
        # Obtener transacciones del período ESPECÍFICO (solo dentro del rango)
        query = {
            "user_id": user_id,
            "date": {
                "$gte": start_date,
                "$lte": end_date
            }
        }
        print(f"DEBUG generate_savings_evolution_report - Query: {query}")
        # Usar agregación como goal_operations.py
        pipeline = [
            {"$match": query},
            {
                "$group": {
                    "_id": {
                        "year": {"$year": "$date"},
                        "month": {"$month": "$date"},
                        "type": "$type"
                    },
                    "total_amount": {"$sum": "$amount"}
                }
            },
            {"$sort": {"_id.year": 1, "_id.month": 1}}
        ]
        
        cursor = self.transactions_collection.aggregate(pipeline)
        results = await cursor.to_list(length=None)
        
        print(f"DEBUG generate_savings_evolution_report - Resultados de la consulta: {len(results)} registros")
        
        # Procesar resultados de agregación
        monthly_savings = defaultdict(lambda: {"income": 0.0, "expenses": 0.0})
        
        for result in results:
            month_key = f"{result['_id']['year']}-{result['_id']['month']:02d}"
            amount = result["total_amount"]
            transaction_type = result["_id"]["type"]
            
            if transaction_type == "income":
                monthly_savings[month_key]["income"] = amount
            elif transaction_type == "expense":
                monthly_savings[month_key]["expenses"] = amount
            
            print(f"DEBUG generate_savings_evolution_report - Mes con datos: {month_key}, type={transaction_type}, amount={amount}")
        
        # Crear datos mensuales retrocediendo desde la fecha de referencia
        monthly_data = []
        month_names = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
        cumulative_savings = 0.0
        
        # Primero recolectar todos los meses en orden cronológico (del más antiguo al más reciente)
        temp_data = []
        current_date = end_date
        for i in range(months):
            month_key = f"{current_date.year}-{current_date.month:02d}"
            data = monthly_savings.get(month_key, {"income": 0.0, "expenses": 0.0})
            
            monthly_savings_amount = data["income"] - data["expenses"]
            
            temp_data.append({
                "date": current_date,
                "income": data["income"],
                "expenses": data["expenses"],
                "monthly_savings": monthly_savings_amount
            })
            
            # Retroceder un mes (usar último día del mes anterior)
            if current_date.month == 1:
                # Retroceder a diciembre del año anterior
                new_year = current_date.year - 1
                # Ir al último día de diciembre (día anterior al 1 de enero del año nuevo)
                current_date = datetime(new_year + 1, 1, 1) - timedelta(days=1)
            else:
                # Retroceder al mes anterior
                new_year = current_date.year
                new_month = current_date.month - 1
                # Validar que el mes sea válido antes de crear el datetime
                if not (1 <= new_month <= 12):
                    raise ValueError(f"Mes inválido al retroceder: {new_month}, current_date.month={current_date.month}")
                # Ir al último día del mes anterior
                try:
                    current_date = datetime(new_year, new_month + 1, 1) - timedelta(days=1)
                except ValueError as e:
                    raise ValueError(f"Error al crear fecha retrocediendo: año={new_year}, mes={new_month + 1}, error={str(e)}")
        
        # Invertir para tener del más antiguo al más reciente y calcular ahorro acumulado
        temp_data.reverse()
        for item in temp_data:
            cumulative_savings += item["monthly_savings"]
            savings_rate = (item["monthly_savings"] / item["income"] * 100) if item["income"] > 0 else 0.0
            
            month_key = f"{item['date'].year}-{item['date'].month:02d}"
            print(f"DEBUG generate_savings_evolution_report - Creando dato para {month_key}: monthly_savings={item['monthly_savings']}, cumulative={cumulative_savings}")
            
            monthly_data.append(SavingsEvolutionData(
                month=month_names[item["date"].month - 1],
                year=item["date"].year,
                savings_amount=cumulative_savings,
                monthly_savings=item["monthly_savings"],
                savings_rate=savings_rate
            ))
        
        # Ordenar cronológicamente
        monthly_data.sort(key=lambda x: (x.year, month_names.index(x.month)))
        
        total_savings = sum(data.monthly_savings for data in monthly_data)
        average_monthly_savings = total_savings / len(monthly_data) if monthly_data else 0.0
        
        # Calcular tasa de crecimiento
        savings_growth_rate = 0.0
        if len(monthly_data) >= 2:
            first_month = monthly_data[0].monthly_savings
            last_month = monthly_data[-1].monthly_savings
            if first_month > 0:
                savings_growth_rate = ((last_month - first_month) / first_month) * 100
        
        return SavingsEvolutionReport(
            period_start=start_date.date(),
            period_end=end_date.date(),
            monthly_data=monthly_data,
            total_savings=total_savings,
            average_monthly_savings=average_monthly_savings,
            savings_growth_rate=savings_growth_rate
        )
    
    async def generate_income_expense_comparison_report(self, user_id: str, months: int = 8, reference_year: Optional[int] = None, reference_month: Optional[int] = None) -> IncomeExpenseComparisonReport:
        """Genera reporte de comparación de ingresos vs gastos"""
        # Obtener información del usuario para verificar presupuesto
        try:
            user_object_id = ObjectId(user_id) if not isinstance(user_id, ObjectId) else user_id
        except Exception:
            user_object_id = user_id
        
        user_doc = await self.users_collection.find_one({"_id": user_object_id})
        user_budget = user_doc.get("initial_budget", 0.0) if user_doc else 0.0
        budget_configured = user_doc.get("budget_configured", False) if user_doc else False
        registration_date = user_doc.get("registration_date", datetime.now()) if user_doc else datetime.now()
        
        # Convertir registration_date a datetime si es string
        if isinstance(registration_date, str):
            registration_date = datetime.fromisoformat(registration_date.replace('Z', '+00:00'))
        elif not isinstance(registration_date, datetime):
            registration_date = datetime.now()
        
        registration_month = datetime(registration_date.year, registration_date.month, 1)
        
        # SIEMPRE usar año/mes de referencia si se proporcionan, NUNCA usar fecha actual como fallback
        if reference_year is not None and reference_month is not None:
            # Validar que el mes esté en rango válido
            if not (1 <= reference_month <= 12):
                raise ValueError(f"Mes inválido: {reference_month}. Debe estar entre 1 y 12")
            
            end_date = datetime(reference_year, reference_month, 1)
            # Ir al último día del mes de referencia
            if reference_month == 12:
                end_date = datetime(reference_year + 1, 1, 1) - timedelta(days=1)
            else:
                end_date = datetime(reference_year, reference_month + 1, 1) - timedelta(days=1)
            
            print(f"DEBUG generate_income_expense_comparison_report - Usando referencia: año={reference_year}, mes={reference_month}, end_date={end_date}")
        else:
            end_date = datetime.now()
            print(f"DEBUG generate_income_expense_comparison_report - No se proporcionó referencia, usando fecha actual: {end_date}")
        
        # Calcular fecha de inicio retrocediendo meses completos desde end_date
        start_date = end_date
        for _ in range(months - 1):
            # Retroceder un mes completo
            if start_date.month == 1:
                start_date = datetime(start_date.year - 1, 12, 1)
            else:
                start_date = datetime(start_date.year, start_date.month - 1, 1)
        
        # Asegurar que start_date sea el primer día del mes
        start_date = datetime(start_date.year, start_date.month, 1)
        
        print(f"DEBUG generate_income_expense_comparison_report - Rango de fechas: start_date={start_date}, end_date={end_date}")
        print(f"DEBUG generate_income_expense_comparison_report - Presupuesto: {user_budget}, Configurado: {budget_configured}")
        
        # Obtener transacciones del período ESPECÍFICO (solo dentro del rango)
        query = {
            "user_id": user_id,
            "date": {
                "$gte": start_date,
                "$lte": end_date
            }
        }
        print(f"DEBUG generate_income_expense_comparison_report - Query: {query}")
        
        # Usar agregación para obtener ingresos y gastos por mes
        pipeline = [
            {"$match": query},
            {
                "$group": {
                    "_id": {
                        "year": {"$year": "$date"},
                        "month": {"$month": "$date"},
                        "type": "$type"
                    },
                    "total_amount": {"$sum": "$amount"}
                }
            },
            {"$sort": {"_id.year": 1, "_id.month": 1}}
        ]
        
        cursor = self.transactions_collection.aggregate(pipeline)
        results = await cursor.to_list(length=None)
        
        print(f"DEBUG generate_income_expense_comparison_report - Resultados de la consulta: {len(results)} registros")
        
        # Procesar resultados de agregación
        monthly_data_dict = defaultdict(lambda: {"income": 0.0, "expenses": 0.0})
        
        for result in results:
            month_key = f"{result['_id']['year']}-{result['_id']['month']:02d}"
            amount = result["total_amount"]
            transaction_type = result["_id"]["type"]
            
            if transaction_type == "income":
                monthly_data_dict[month_key]["income"] = amount
            elif transaction_type == "expense":
                monthly_data_dict[month_key]["expenses"] = amount
            
            print(f"DEBUG generate_income_expense_comparison_report - Mes con datos: {month_key}, type={transaction_type}, amount={amount}")
        
        # Crear datos mensuales retrocediendo desde la fecha de referencia
        monthly_data = []
        month_names = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
        
        # Crear lista de fechas retrocediendo mes por mes
        dates_list = []
        current_date = end_date
        for i in range(months):
            dates_list.append(current_date)
            # Retroceder un mes (usar último día del mes anterior)
            if current_date.month == 1:
                # Retroceder a diciembre del año anterior
                new_year = current_date.year - 1
                # Ir al último día de diciembre (día anterior al 1 de enero del año nuevo)
                current_date = datetime(new_year + 1, 1, 1) - timedelta(days=1)
            else:
                # Retroceder al mes anterior
                new_year = current_date.year
                new_month = current_date.month - 1
                # Validar que el mes sea válido antes de crear el datetime
                if not (1 <= new_month <= 12):
                    raise ValueError(f"Mes inválido al retroceder: {new_month}, current_date.month={current_date.month}")
                # Ir al último día del mes anterior
                try:
                    current_date = datetime(new_year, new_month + 1, 1) - timedelta(days=1)
                except ValueError as e:
                    raise ValueError(f"Error al crear fecha retrocediendo: año={new_year}, mes={new_month + 1}, error={str(e)}")
        
        # Invertir para tener del más antiguo al más reciente
        dates_list.reverse()
        
        for current_date in dates_list:
            month_key = f"{current_date.year}-{current_date.month:02d}"
            data = monthly_data_dict.get(month_key, {"income": 0.0, "expenses": 0.0})
            
            # Verificar si el mes tiene presupuesto configurado
            report_month = datetime(current_date.year, current_date.month, 1)
            month_has_budget = budget_configured and report_month >= registration_month
            
            # Calcular balance: si el mes tiene presupuesto configurado, incluir presupuesto (salario)
            # Si no tiene presupuesto configurado (meses anteriores), solo usar ingresos - gastos
            if month_has_budget:
                # Balance = presupuesto (salario) + ingresos - gastos
                balance = user_budget + data["income"] - data["expenses"]
            else:
                # Balance = solo ingresos - gastos (meses anteriores sin presupuesto configurado)
                balance = data["income"] - data["expenses"]
            
            print(f"DEBUG generate_income_expense_comparison_report - Creando dato para {month_key}: income={data['income']}, expenses={data['expenses']}, balance={balance}, tiene_presupuesto={month_has_budget}")
            
            monthly_data.append(IncomeExpenseComparisonData(
                month=month_names[current_date.month - 1],
                year=current_date.year,
                month_number=current_date.month,
                income=data["income"],
                expenses=data["expenses"],
                balance=balance
            ))
        
        # Ordenar cronológicamente
        monthly_data.sort(key=lambda x: (x.year, x.month_number))
        
        # Calcular totales y promedios
        total_income = sum(data.income for data in monthly_data)
        total_expenses = sum(data.expenses for data in monthly_data)
        average_monthly_income = total_income / len(monthly_data) if monthly_data else 0.0
        average_monthly_expenses = total_expenses / len(monthly_data) if monthly_data else 0.0
        # El net_balance debe ser la suma de los balances mensuales (que ya incluyen presupuesto cuando corresponde)
        net_balance = sum(data.balance for data in monthly_data)
        
        return IncomeExpenseComparisonReport(
            period_start=start_date.date(),
            period_end=end_date.date(),
            monthly_data=monthly_data,
            total_income=total_income,
            total_expenses=total_expenses,
            average_monthly_income=average_monthly_income,
            average_monthly_expenses=average_monthly_expenses,
            net_balance=net_balance
        )
    
    async def save_report(self, report: FinancialReport) -> str:
        """Guarda un reporte en la base de datos"""
        report_dict = report.dict()
        report_dict["_id"] = ObjectId()
        report_dict["created_at"] = datetime.now()
        
        result = await self.reports_collection.insert_one(report_dict)
        return str(result.inserted_id)
    
    async def get_user_reports(self, user_id: str, limit: int = 10) -> List[FinancialReport]:
        """Obtiene reportes del usuario"""
        # Usar agregación como goal_operations.py
        pipeline = [
            {"$match": {"user_id": user_id}},
            {"$sort": {"created_at": -1}},
            {"$limit": limit}
        ]
        cursor = self.reports_collection.aggregate(pipeline)
        reports = await cursor.to_list(length=None)
        
        return [FinancialReport(**report) for report in reports]
    
    async def search_reports(self, user_id: str, query: str, report_types: Optional[List[ReportType]] = None) -> List[FinancialReport]:
        """Busca reportes por criterios"""
        search_filter = {
            "user_id": user_id,
            "$or": [
                {"monthly_summary.month": {"$regex": query, "$options": "i"}},
                {"expense_category_report.categories.category": {"$regex": query, "$options": "i"}}
            ]
        }
        
        if report_types:
            search_filter["report_type"] = {"$in": report_types}
        
        # Usar agregación como goal_operations.py
        pipeline = [
            {"$match": search_filter},
            {"$limit": 20}
        ]
        cursor = self.reports_collection.aggregate(pipeline)
        reports = await cursor.to_list(length=None)
        return [FinancialReport(**report) for report in reports]
    
    async def get_report_stats(self, user_id: str) -> ReportStats:
        """Obtiene estadísticas de reportes del usuario"""
        total_reports = await self.reports_collection.count_documents({"user_id": user_id})
        
        last_report = await self.reports_collection.find_one(
            {"user_id": user_id},
            sort=[("created_at", -1)]
        )
        
        # Obtener tipo de reporte más solicitado
        pipeline = [
            {"$match": {"user_id": user_id}},
            {"$group": {"_id": "$report_type", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 1}
        ]
        
        # Usar agregación como goal_operations.py
        cursor = self.reports_collection.aggregate(pipeline)
        most_requested = await cursor.to_list(length=None)
        most_requested_type = most_requested[0]["_id"] if most_requested else None
        
        return ReportStats(
            total_reports_generated=total_reports,
            last_report_date=last_report["created_at"] if last_report else None,
            most_requested_report=most_requested_type,
            average_generation_time=0.5  # Valor estimado
        )
    
    async def delete_report(self, report_id: str, user_id: str) -> bool:
        """Elimina un reporte"""
        result = await self.reports_collection.delete_one({
            "_id": ObjectId(report_id),
            "user_id": user_id
        })
        return result.deleted_count > 0
