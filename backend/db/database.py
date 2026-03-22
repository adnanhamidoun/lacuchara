"""Azure SQL database configuration with SQLAlchemy.

This module creates the Azure SQL Server connection using SQLAlchemy
with the pyodbc driver. It builds the connection string from environment
variables and exposes session helpers for ORM access.

Required environment variables:
    - DB_SERVER: Azure SQL server hostname (for example: server.database.windows.net)
    - DB_NAME: Database name
    - DB_USER: Authentication user
    - DB_PASS: Authentication password
"""

import os
import logging
from pathlib import Path
from urllib.parse import quote_plus
import pyodbc
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import QueuePool

logger = logging.getLogger(__name__)

# Load variables from .env
env_path = Path(__file__).parent.parent.parent / ".env"
logger.info("Searching for .env at: %s", env_path)
logger.info(".env exists: %s", env_path.exists())

if env_path.exists():
    load_dotenv(env_path)
    logger.info("Loaded variables from .env")
else:
    logger.warning(".env file not found")

# Environment variables
DB_SERVER = os.getenv("DB_SERVER")
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")

logger.info("Loaded DB credentials:")
logger.info(f"   DB_SERVER: {DB_SERVER}")
logger.info(f"   DB_NAME: {DB_NAME}")
logger.info(f"   DB_USER: {DB_USER}")
logger.info(f"   DB_PASS: {'*' * len(DB_PASS) if DB_PASS else 'None'}")

# Validate environment variables
has_db_credentials = all([DB_SERVER, DB_NAME, DB_USER, DB_PASS])


def _pick_sqlserver_odbc_driver():
    """Select the best available SQL Server ODBC driver installed on the machine."""
    drivers = set(pyodbc.drivers())
    preferred = [
        "ODBC Driver 18 for SQL Server",
        "ODBC Driver 17 for SQL Server",
        "SQL Server",
    ]
    for driver in preferred:
        if driver in drivers:
            return driver
    return None

if has_db_credentials:
    logger.info("All credentials are configured. Connecting to Azure SQL...")
    # Build the connection string with quote_plus to support special characters
    password_encoded = quote_plus(DB_PASS)
    selected_driver = _pick_sqlserver_odbc_driver()

    if not selected_driver:
        logger.error("No SQL Server ODBC driver was found")
        logger.error("Available drivers: %s", pyodbc.drivers())
        raise RuntimeError(
            "No SQL Server ODBC driver is installed. "
            "Install ODBC Driver 18/17 for SQL Server."
        )

    logger.info("Selected ODBC driver: %s", selected_driver)
    driver_encoded = quote_plus(selected_driver)
    connection_string = (
        f"mssql+pyodbc://{DB_USER}:{password_encoded}@{DB_SERVER}/{DB_NAME}"
        f"?driver={driver_encoded}"
    )
    
    logger.info("Connection string: mssql+pyodbc://%s:***@%s/%s", DB_USER, DB_SERVER, DB_NAME)
    
    # Create SQLAlchemy engine with a connection pool for Azure SQL
    engine = create_engine(
        connection_string,
        poolclass=QueuePool,
        pool_size=5,
        max_overflow=10,
        echo=False,
        future=True,
    )
    logger.info("SQLAlchemy engine created for Azure SQL")
else:
    # Fallback to in-memory SQLite for local testing when DB credentials are missing
    logger.error("Database variables are not configured. Using in-memory SQLite.")
    logger.error(f"   DB_SERVER: {DB_SERVER}")
    logger.error(f"   DB_NAME: {DB_NAME}")
    logger.error(f"   DB_USER: {DB_USER}")
    logger.error(f"   DB_PASS: {DB_PASS}")
    import warnings
    warnings.warn(
        "Database variables are not configured. Using in-memory SQLite for testing. "
        "Configure .env to use Azure SQL in production.",
        RuntimeWarning
    )
    engine = create_engine(
        "sqlite:///:memory:",
        echo=False,
        future=True,
        connect_args={"check_same_thread": False},
    )
    logger.warning("Using in-memory SQLite (data is not persisted)")


# Session factory used by dependency injection
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

# Declarative base for ORM models
Base = declarative_base()


def get_db():
    """
    Database session generator for FastAPI dependency injection.

    Yields:
        sqlalchemy.orm.Session: Active database session.

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
    Initialize the database by creating all ORM-defined tables.

    This function creates tables in Azure SQL based on ORM model
    definitions. It should be called once at application startup.
    """
    Base.metadata.create_all(bind=engine)

