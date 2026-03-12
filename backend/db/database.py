"""
Configuración de la base de datos Azure SQL con SQLAlchemy.

Este módulo establece la conexión a Azure SQL Server utilizando SQLAlchemy
con el driver pyodbc. Maneja la cadena de conexión de forma segura mediante
variables de entorno y proporciona una sesión de base de datos para la ORM.

Requiere las siguientes variables de entorno:
    - DB_SERVER: Nombre del servidor Azure SQL (ej: servidor.database.windows.net)
    - DB_NAME: Nombre de la base de datos
    - DB_USER: Usuario de autenticación
    - DB_PASS: Contraseña de autenticación
"""

import os
import logging
from pathlib import Path
from urllib.parse import quote_plus
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import QueuePool

logger = logging.getLogger(__name__)

# Cargar variables del archivo .env
env_path = Path(__file__).parent.parent.parent / ".env"
logger.info(f"🔍 Buscando .env en: {env_path}")
logger.info(f"   ¿Existe? {env_path.exists()}")

if env_path.exists():
    load_dotenv(env_path)
    logger.info("✅ Variables cargadas desde .env")
else:
    logger.warning("⚠️  Archivo .env no encontrado")

# Variables de entorno
DB_SERVER = os.getenv("DB_SERVER")
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")

logger.info(f"🔐 Credenciales cargadas:")
logger.info(f"   DB_SERVER: {DB_SERVER}")
logger.info(f"   DB_NAME: {DB_NAME}")
logger.info(f"   DB_USER: {DB_USER}")
logger.info(f"   DB_PASS: {'*' * len(DB_PASS) if DB_PASS else 'None'}")

# Validación de variables de entorno
has_db_credentials = all([DB_SERVER, DB_NAME, DB_USER, DB_PASS])

if has_db_credentials:
    logger.info("✅ Todas las credenciales están configuradas. Conectando a Azure SQL...")
    # Construcción de la cadena de conexión con quote_plus para manejar caracteres especiales
    password_encoded = quote_plus(DB_PASS)
    connection_string = (
        f"mssql+pyodbc://{DB_USER}:{password_encoded}@{DB_SERVER}/{DB_NAME}"
        "?driver=ODBC+Driver+17+for+SQL+Server"
    )
    
    logger.info(f"🌐 Cadena de conexión: mssql+pyodbc://{DB_USER}:***@{DB_SERVER}/{DB_NAME}")
    
    # Crear el motor de SQLAlchemy con pool para Azure SQL
    engine = create_engine(
        connection_string,
        poolclass=QueuePool,
        pool_size=5,
        max_overflow=10,
        echo=False,
        future=True,
    )
    logger.info("✅ Motor de SQLAlchemy creado para Azure SQL")
else:
    # Crear un motor SQLite en-memoria para testing sin credenciales
    logger.error("❌ Variables de BD no configuradas. Usando SQLite en-memoria.")
    logger.error(f"   DB_SERVER: {DB_SERVER}")
    logger.error(f"   DB_NAME: {DB_NAME}")
    logger.error(f"   DB_USER: {DB_USER}")
    logger.error(f"   DB_PASS: {DB_PASS}")
    import warnings
    warnings.warn(
        "Variables de BD no configuradas. Usando SQLite en-memoria para testing. "
        "Configura .env para usar Azure SQL en producción.",
        RuntimeWarning
    )
    engine = create_engine(
        "sqlite:///:memory:",
        echo=False,
        future=True,
        connect_args={"check_same_thread": False},
    )
    logger.warning("⚠️  Usando SQLite en-memoria (no persiste datos)")


# SessionLocal para crear sesiones de base de datos
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

# Base declarativa para los modelos ORM
Base = declarative_base()


def get_db():
    """
    Generador de sesiones de base de datos para inyección de dependencias en FastAPI.

    Yields:
        sqlalchemy.orm.Session: Sesión de base de datos.

    Example:
        @app.get("/predictions")
        def get_predictions(db: Session = Depends(get_db)):
            return db.query(PredictionLog).all()
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """
    Inicializa la base de datos creando todas las tablas definidas en los modelos.

    Esta función crea las tablas en Azure SQL basadas en las definiciones
    de los modelos ORM. Se debe llamar una sola vez durante el startup de la aplicación.
    """
    Base.metadata.create_all(bind=engine)
