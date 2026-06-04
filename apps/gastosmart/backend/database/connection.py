from motor.motor_asyncio import AsyncIOMotorClient #Cliente asíncrono para FastAPI
from pymongo import MongoClient #Cliente síncrono para operaciones que lo requieran
import os #Para obtener las variables de entorno
from dotenv import load_dotenv #Para cargar las variables de entorno

#SINCRONICO: una cosa a la vez
#ASINCRONICO: varias cosas a la vez

# Cargar variables de entorno
load_dotenv()

# Configuración de MongoDB
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "gastosmart")
SERVER_SELECTION_TIMEOUT_MS = int(os.getenv("MONGODB_TIMEOUT_MS", "3000"))

# Cliente asíncrono para FastAPI
async_client = None

# Cliente síncrono para operaciones que lo requieran
sync_client = None

async def connect_to_mongo():
    """Conectar a MongoDB"""
    global async_client, sync_client
    try:
        async_client = AsyncIOMotorClient(
            MONGODB_URL,
            serverSelectionTimeoutMS=SERVER_SELECTION_TIMEOUT_MS
        )
        sync_client = MongoClient(
            MONGODB_URL,
            serverSelectionTimeoutMS=SERVER_SELECTION_TIMEOUT_MS
        )
        
        # Verificar conexión
        await async_client.admin.command('ping')
        print(f"Conectado a MongoDB: {DATABASE_NAME}")
        
    except Exception as e:
        print(f"Error conectando a MongoDB: {e}")

async def ping_mongo():
    """Validar conectividad real con MongoDB para endpoints de salud."""
    global async_client, sync_client

    if async_client is None:
        async_client = AsyncIOMotorClient(
            MONGODB_URL,
            serverSelectionTimeoutMS=SERVER_SELECTION_TIMEOUT_MS
        )

    if sync_client is None:
        sync_client = MongoClient(
            MONGODB_URL,
            serverSelectionTimeoutMS=SERVER_SELECTION_TIMEOUT_MS
        )

    await async_client.admin.command('ping')
    return True

async def close_mongo_connection():
    """Cerrar conexión a MongoDB"""
    global async_client, sync_client
    if async_client:
        async_client.close()
    if sync_client:
        sync_client.close()

def get_database():
    """Obtener instancia de la base de datos"""
    if sync_client is None:
        raise Exception("Base de datos no conectada")
    return sync_client[DATABASE_NAME]

async def get_async_database():
    """Obtener instancia asíncrona de la base de datos"""
    if async_client is None:
        raise Exception("Base de datos no conectada")
    return async_client[DATABASE_NAME]
