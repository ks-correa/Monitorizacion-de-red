"""
    Servicio de envío de correos electrónicos
"""

import os #Sistema operativo: en el proyecto leer variables de entorno
import random #Generar códigos de verificación random
import string #Constante con caracteres, usar para generar 6 digitos
from datetime import datetime, timedelta #Fecha y hora - diferencia de tiempo
from typing import Optional #Definir tipo de dato opcional, sea de tipo o none

from fastapi_mail import FastMail, MessageSchema, ConnectionConfig   
# FastMail: clase para enviar correos electrónicos
# MessageSchema: esquema para el cuerpo del mensaje
# ConnectionConfig: configuración para el servidor de correo SMTP


from motor.motor_asyncio import AsyncIOMotorDatabase
#motor: motor asincronico (driver) para interactuar con la base de datos MongoDB

class EmailService:
    def __init__(self, database: AsyncIOMotorDatabase):
        
        # await esperar a que se complete una operación asíncrona (que toma tiempo)
        # self. Accede a metodos y atributos de la clase
        self.database = database
        self.verification_codes = database.verification_codes
        self.delivery_mode = os.getenv("EMAIL_DELIVERY_MODE", "console").lower()
        self.fastmail = None

        if self.delivery_mode == "smtp":
            self.mail_config = ConnectionConfig(
                MAIL_USERNAME=os.getenv("MAIL_USERNAME", ""),
                MAIL_PASSWORD=os.getenv("MAIL_PASSWORD", ""),
                MAIL_FROM=os.getenv("MAIL_FROM", os.getenv("MAIL_USERNAME", "")),
                MAIL_PORT=int(os.getenv("MAIL_PORT", "587")),
                MAIL_SERVER=os.getenv("MAIL_SERVER", "smtp.gmail.com"),
                MAIL_STARTTLS=os.getenv("MAIL_STARTTLS", "true").lower() == "true",
                MAIL_SSL_TLS=os.getenv("MAIL_SSL_TLS", "false").lower() == "true",
                USE_CREDENTIALS=True,
                VALIDATE_CERTS=True,
            )
            self.fastmail = FastMail(self.mail_config)
        
    async def generate_verification_code(self,email:str, purpose:str) -> str:
        # Generar el codigo de verificacion
        code = ''.join(random.choices(string.digits, k=6))
        # Generar la fecha de expiracion
        expires_at = datetime.now() + timedelta(minutes=10)
        
        # Guardar el codigo de verificacion en la base de datos
        verification_doc = {
            "email":email,
            "code":code,
            "purpose":purpose,
            "created_at":datetime.now(),
            "expires_at": expires_at,
            "used": False,
            "attempts": 0
        }
        
        await self.verification_codes.insert_one(verification_doc)
        return code
    
    async def send_verification_email(self, email:str, code:str, purpose:str, user_name:str = None) -> bool:
        # Enviar correo electrónico con el codigo de verificacion
        try:
            # Determinar el asunto y el contenido según el propósito
            if purpose == "registration":
                subject = "Verificación de cuenta - GastoSmart"
                template_name = "verification_registration"
            else:
                subject = "Recuperación de contraseña - GastoSmart"
                template_name = "verification_recovery"

            if self.delivery_mode != "smtp":
                print("\n" + "=" * 72)
                print("[GastoSmart] Codigo de verificacion generado")
                print(f"Destino: {email}")
                print(f"Proposito: {purpose}")
                print(f"Codigo: {code}")
                print("=" * 72 + "\n")
                return True
            
            # Crear el mensaje
            message = MessageSchema(
                subject=subject,
                recipients=[email],
                body=self._create_email_body(code,purpose,user_name),
                subtype="html",
            )
            
            # Enviar el correo electrónico
            await self.fastmail.send_message(message)
            return True
        except Exception as e:
            print(f"Error al enviar el correo electrónico: {e}")
            return False
        
    def _create_email_body(self, code:str, purpose:str, user_name:str = None) -> str:
        
        greeting = f"Hola {user_name}!" if user_name else "Hola!"
        if purpose == "registration":
            title = "Verificación de cuenta"
            message = "Para completar tu registro en GastoSmart, por favor ingresa el siguiente código de verificación:"
        else:
            title = "Recuperación de contraseña"
            message = "Para recuperar tu contraseña en GastoSmart, por favor ingresa el siguiente código de verificación:"
            
        html_body = f"""
        <!DOCTYPE html>
        <html lang="es">
            <head>
                <meta charset="UTF-8">
                <title>{title} - GastoSmart</title>
                <style>
                    body {{
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        color: #333;
                    }}
                    .container {{
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                    }}
                    .header {{
                        text-align: center;
                        color: #ea580c;
                    }}
                    .code {{
                        font-size: 32px;
                        font-weight: bold;
                        color: #ea580c;
                        text-align: center;
                        margin: 20px 0;
                        
                    }}
                    .footer {{
                        margin-top: 30px;
                        font-size: 14px;
                        color: #666;
                    }}
                </style>
            </head>
            <body>
                <div class="container">
                    <h2 class="header">GastoSmart - {title}</h2>
                    <p>{greeting}</p>
                    <p>{message}</p>
                    <div class="code">{code}</div>
                    <p>Este código expirará en 10 minutos.</p>
                    <p>Si no solicitaste este código, por favor ignora este correo.</p>
                    <div class="footer">
                        <p>Saludos,<br> Equipo GastoSmart</p>
                        <p>GastoSmart</p>
                    </div>
                </div>
            </body>
            </html>
        """
        return html_body
    
    async def verify_code(self, email:str, code:str, purpose:str) -> dict:
        """
        Verificar código de verificación con control de intentos
        
        Returns:
            dict: {"valid": bool, "message": str, "attempts_left": int}
        """
        
        # Buscar el código más reciente para este email y propósito
        verification_doc = await self.verification_codes.find_one({
            "email": email,
            "purpose": purpose,
            "used": False,
            "expires_at": {"$gt": datetime.now()},
        }, sort=[("created_at", -1)])
        
        if not verification_doc:
            return {
                "valid": False, 
                "message": "Código inválido o expirado",
                "attempts_left": 0
            }
        
        # Verificar si el código coincide
        if verification_doc["code"] == code:
            # Código correcto - marcar como usado
            await self.verification_codes.update_one(
                {"_id": verification_doc["_id"]},
                {"$set": {"used": True}},
            )
            return {
                "valid": True,
                "message": "Código verificado exitosamente",
                "attempts_left": 3
            }
        else:
            # Código incorrecto - incrementar intentos
            current_attempts = verification_doc.get("attempts", 0) + 1
            attempts_left = max(0, 3 - current_attempts)
            
            if current_attempts >= 3:
                # Máximo de intentos alcanzado - marcar como usado
                await self.verification_codes.update_one(
                    {"_id": verification_doc["_id"]},
                    {"$set": {"used": True, "attempts": current_attempts}},
                )
                return {
                    "valid": False,
                    "message": "Máximo de intentos alcanzado. Solicita un nuevo código",
                    "attempts_left": 0
                }
            else:
                # Actualizar contador de intentos
                await self.verification_codes.update_one(
                    {"_id": verification_doc["_id"]},
                    {"$set": {"attempts": current_attempts}},
                )
                return {
                    "valid": False,
                    "message": f"Código incorrecto. Te quedan {attempts_left} intentos",
                    "attempts_left": attempts_left
                }
    
    async def send_overspending_alert(
        self, 
        email: str, 
        user_name: str,
        threshold_percentage: float,
        amount_spent: float,
        budget_amount: float,
        period_month: int,
        period_year: int
    ) -> bool:
        """
        Enviar alerta de sobre-gasto por correo electrónico
        
        Implementa el requerimiento RQF-011: Envío de notificación de sobre-gasto por correo
        
        Args:
            email: Correo electrónico del usuario
            user_name: Nombre del usuario
            threshold_percentage: Porcentaje de umbral alcanzado
            amount_spent: Monto gastado
            budget_amount: Presupuesto original
            period_month: Mes del periodo
            period_year: Año del periodo
            
        Returns:
            bool: True si se envió correctamente
        """
        try:
            # Calcular porcentaje utilizado
            percentage_used = (amount_spent / budget_amount) * 100 if budget_amount > 0 else 0
            
            # Nombres de meses en español
            month_names = [
                "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
                "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
            ]
            month_name = month_names[period_month - 1] if 1 <= period_month <= 12 else f"Mes {period_month}"
            
            # Formatear montos (asumiendo COP)
            def format_currency(amount):
                return f"${amount:,.0f}".replace(",", ".")
            
            subject = f"⚠️ Alerta de sobre-gasto - GastoSmart"

            if self.delivery_mode != "smtp":
                print("\n" + "=" * 72)
                print("[GastoSmart] Alerta de sobre-gasto en modo consola")
                print(f"Destino: {email}")
                print(f"Usuario: {user_name}")
                print(f"Periodo: {month_name} {period_year}")
                print(f"Gastado: {format_currency(amount_spent)}")
                print(f"Presupuesto: {format_currency(budget_amount)}")
                print(f"Uso: {percentage_used:.1f}%")
                print("=" * 72 + "\n")
                return True
            
            # Crear el mensaje
            message = MessageSchema(
                subject=subject,
                recipients=[email],
                body=self._create_overspending_alert_body(
                    user_name, threshold_percentage, amount_spent, 
                    budget_amount, percentage_used, month_name, period_year
                ),
                subtype="html",
            )
            
            # Enviar el correo electrónico
            await self.fastmail.send_message(message)
            return True
        except Exception as e:
            print(f"Error al enviar alerta de sobre-gasto: {e}")
            return False
    
    def _create_overspending_alert_body(
        self,
        user_name: str,
        threshold_percentage: float,
        amount_spent: float,
        budget_amount: float,
        percentage_used: float,
        month_name: str,
        year: int
    ) -> str:
        """
        Crear el cuerpo HTML del correo de alerta de sobre-gasto
        
        Implementa RN-07: El contenido del correo debe ser claro, incluyendo:
        - Porcentaje alcanzado
        - Monto gastado
        - Presupuesto original
        - Periodo afectado (mes y año)
        """
        greeting = f"Hola {user_name}!" if user_name else "Hola!"
        
        # Formatear montos
        def format_currency(amount):
            return f"${amount:,.0f}".replace(",", ".")
        
        # Determinar el nivel de alerta
        if percentage_used >= 100:
            alert_level = "crítico"
            alert_color = "#dc2626"  # Rojo
            alert_message = "Has superado tu presupuesto mensual"
        elif percentage_used >= threshold_percentage:
            alert_level = "advertencia"
            alert_color = "#f59e0b"  # Naranja
            alert_message = f"Has alcanzado el {threshold_percentage:.0f}% de tu presupuesto"
        
        html_body = f"""
        <!DOCTYPE html>
        <html lang="es">
            <head>
                <meta charset="UTF-8">
                <title>Alerta de sobre-gasto - GastoSmart</title>
                <style>
                    body {{
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        margin: 0;
                        padding: 0;
                        background-color: #f5f5f5;
                    }}
                    .container {{
                        max-width: 600px;
                        margin: 20px auto;
                        background-color: #ffffff;
                        border-radius: 8px;
                        overflow: hidden;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    }}
                    .header {{
                        background-color: {alert_color};
                        color: white;
                        padding: 30px 20px;
                        text-align: center;
                    }}
                    .header h1 {{
                        margin: 0;
                        font-size: 24px;
                    }}
                    .content {{
                        padding: 30px 20px;
                    }}
                    .alert-box {{
                        background-color: #fef2f2;
                        border-left: 4px solid {alert_color};
                        padding: 20px;
                        margin: 20px 0;
                        border-radius: 4px;
                    }}
                    .alert-box h2 {{
                        margin-top: 0;
                        color: {alert_color};
                    }}
                    .stats {{
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 15px;
                        margin: 20px 0;
                    }}
                    .stat-item {{
                        display: flex;
                        flex-direction: column;
                        padding: 15px;
                        background-color: #f9fafb;
                        border-radius: 4px;
                    }}
                    .stat-item-full {{
                        grid-column: 1 / -1;
                    }}
                    .stat-label {{
                        font-weight: 600;
                        color: #6b7280;
                        font-size: 14px;
                        margin-bottom: 8px;
                    }}
                    .stat-value {{
                        font-weight: 700;
                        color: #111827;
                        font-size: 18px;
                    }}
                    .percentage {{
                        color: {alert_color};
                    }}
                    .footer {{
                        margin-top: 30px;
                        padding-top: 20px;
                        border-top: 1px solid #e5e7eb;
                        font-size: 14px;
                        color: #6b7280;
                        text-align: center;
                    }}
                    .button {{
                        display: inline-block;
                        margin-top: 20px;
                        padding: 12px 24px;
                        background-color: {alert_color};
                        color: white;
                        text-decoration: none;
                        border-radius: 6px;
                        font-weight: 600;
                    }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Alerta de Sobre-gasto</h1>
                    </div>
                    <div class="content">
                        <p>{greeting}</p>
                        <div class="alert-box">
                            <h2>{alert_message}</h2>
                            <p>Te informamos que has alcanzado o superado el umbral de alerta configurado en tu presupuesto.</p>
                        </div>
                        
                        <div class="stats">
                            <div class="stat-item">
                                <span class="stat-label">Porcentaje utilizado:</span>
                                <span class="stat-value percentage">{percentage_used:.1f}%</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Monto gastado:</span>
                                <span class="stat-value">{format_currency(amount_spent)}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Presupuesto original:</span>
                                <span class="stat-value">{format_currency(budget_amount)}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Umbral configurado:</span>
                                <span class="stat-value">{threshold_percentage:.0f}%</span>
                            </div>
                            <div class="stat-item stat-item-full">
                                <span class="stat-label">Periodo:</span>
                                <span class="stat-value">{month_name} {year}</span>
                            </div>
                        </div>
                        
                        <p style="margin-top: 20px;">
                            Te recomendamos revisar tus gastos y ajustar tu presupuesto si es necesario.
                        </p>
                    </div>
                    <div class="footer">
                        <p>Saludos,<br> Equipo GastoSmart</p>
                        <p>Este es un correo automático. Por favor, no respondas a este mensaje.</p>
                    </div>
                </div>
            </body>
        </html>
        """
        return html_body
