"""
API REST con FastAPI para predicciones de demanda de servicios.

Este módulo expone los endpoints de predicción, integrando:
- PredictionEngine: Motor de IA para predicciones
- SQLAlchemy + Azure SQL: Persistencia de auditoría

Endpoints:
    GET /health: Health check de la API
    POST /predict: Realizar una predicción y guardarla
    GET /docs: Documentación automática (Swagger)
"""

# ============================================================================
# CARGAR .ENV AL INICIO
# ============================================================================
import sys
from pathlib import Path
try:
    from dotenv import load_dotenv
    env_path = Path(__file__).parent.parent.parent / ".env"
    if env_path.exists():
        load_dotenv(env_path)
except ImportError:
    pass

import json
import logging
import os
<<<<<<< HEAD
import pickle
import unicodedata
from contextlib import asynccontextmanager
=======
import base64
import pickle
>>>>>>> lucian
from datetime import datetime, date, timedelta
from pathlib import Path
from typing import Literal
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

import holidays
import requests
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form, Query, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import desc, distinct, func, or_, text
from pydantic import BaseModel, Field

from ..db import (
    get_db,
    init_db,
    engine,
    PredictionLog,
    Restaurant,
    FactServices,
    SessionLocal,
    DimDish,
    DimDishes,
    FactMenuItems,
    FactMenus,
    MenusAzca,
    Inscripcion,
    User,
    SEGMENT_OPTIONS,
    TERRACE_OPTIONS,
    CUISINE_OPTIONS,
)
from ..core.menu_intelligence import (
    DocumentIntelligenceOCR,
    MenuMLPredictor,
    MenuSectionExtractor,
)
from ..core.auth import create_access_token, decode_access_token, verify_password, hash_password
from ..core.blob_storage import (
    get_blob_manager,
    get_default_image_url,
)

# Importar PredictionEngine - pero con fallback si falta
try:
    from ..core import PredictionEngine
    PREDICTION_ENGINE_AVAILABLE = True
except ImportError:
    PREDICTION_ENGINE_AVAILABLE = False
    # Mock para testing sin dependencias pesadas
    class PredictionEngine:
        def __init__(self, *args, **kwargs):
            pass
        def predict(self, model_name: str, data: dict) -> int:
            """Mock que retorna una predicción dummy para testing"""
            return 150

# Importar scheduler de modelos (soft — requiere Azure ML)
try:
    from ..core.scheduler import start_model_refresh_scheduler, MANAGED_MODELS
    MODEL_SCHEDULER_AVAILABLE = True
except ImportError:
    MODEL_SCHEDULER_AVAILABLE = False

# ============================================================================
# LOGGING
# ============================================================================
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# ============================================================================
# PYDANTIC MODELS (Para validación y documentación Swagger)
# ============================================================================


class PredictionRequest(BaseModel):
    """
    Modelo de solicitud para realizar una predicción completa.

    Contiene todos los parámetros necesarios para el modelo de ML:
    - Fecha y meteorología
    - Eventos especiales y calendario
    - Características del restaurante
    - Datos operacionales
    """

    # Fecha
    service_date: date = Field(
        ...,
        description="Fecha del servicio (YYYY-MM-DD)",
        example="2026-03-15",
    )
    
    # Identificación
    restaurant_id: int = Field(
        ...,
        description="ID del restaurante",
        example=1,
        ge=1,
    )
    
    # Meteorología (OBTENIDA AUTOMÁTICAMENTE DE OPEN-METEO)
    max_temp_c: float = Field(
        default=20.0,
        description="Temperatura máxima en Celsius (obtenida automáticamente de Open-Meteo si no se proporciona)",
        example=28.5,
        ge=-50,
        le=60,
    )
    precipitation_mm: float = Field(
        default=0.0,
        description="Precipitación en milímetros (obtenida automáticamente de Open-Meteo si no se proporciona)",
        example=0.0,
        ge=0,
        le=500,
    )
    
    # Eventos y calendario
    is_rain_service_peak: bool = Field(
        default=False,
        description="¿Lluvia durante hora pico? (calculada automáticamente de Open-Meteo si no se proporciona)",
        example=False,
    )
    is_stadium_event: bool = Field(
        default=False,
        description="¿Hay evento en estadio?",
        example=False,
    )
    is_azca_event: bool = Field(
        default=False,
        description="¿Hay evento AZCA?",
        example=False,
    )
    is_holiday: bool = Field(
        default=False,
        description="¿Es día festivo? (calculado automáticamente si no se proporciona)",
        example=False,
    )
    is_bridge_day: bool = Field(
        default=False,
        description="¿Es puente festivo? (calculado automáticamente si no se proporciona)",
        example=False,
    )
    is_payday_week: bool = Field(
        default=False,
        description="¿Es semana de cobro? (calculado automáticamente si no se proporciona)",
        example=True,
    )
    is_business_day: bool = Field(
        default=True,
        description="¿Es día laboral? (calculado automáticamente si no se proporciona)",
        example=True,
    )
    
    # Datos históricos
    services_lag_7: int = Field(
        default=0,
        description="Servicios hace 7 días (recuperado automáticamente de fact_services si no se proporciona)",
        example=120,
        ge=0,
    )
    avg_4_weeks: float = Field(
        default=0.0,
        description="Promedio últimas 4 semanas (recuperado automáticamente de fact_services si no se proporciona)",
        example=125.5,
        ge=0,
    )
    
    # Características del restaurante
    capacity_limit: int = Field(
        ...,
        description="Límite de capacidad",
        example=80,
        ge=1,
    )
    table_count: int = Field(
        ...,
        description="Cantidad de mesas",
        example=20,
        ge=1,
    )
    min_service_duration: int = Field(
        ...,
        description="Duración mínima servicio (minutos)",
        example=45,
        ge=1,
    )
    terrace_setup_type: str = Field(
        ...,
        description="Tipo de setup terraza",
        example="outdoor",
    )
    opens_weekends: bool = Field(
        ...,
        description="¿Abre fines de semana?",
        example=True,
    )
    has_wifi: bool = Field(
        ...,
        description="¿Tiene Wi-Fi?",
        example=True,
    )
    restaurant_segment: str = Field(
        ...,
        description="Segmento del restaurante (e.g., casual, fine_dining)",
        example="casual",
    )
    menu_price: float = Field(
        ...,
        description="Precio promedio menú",
        example=25.50,
        ge=0,
    )
    dist_office_towers: int = Field(
        ...,
        description="Distancia a torres de oficina (metros)",
        example=500,
        ge=0,
    )
    google_rating: float = Field(
        ...,
        description="Calificación Google",
        example=4.5,
        ge=0,
        le=5,
    )
    cuisine_type: str = Field(
        ...,
        description="Tipo de cocina",
        example="mediterranean",
    )

    class Config:
        json_schema_extra = {
            "example": {
                "service_date": "2026-03-15",
                "restaurant_id": 1,
                "max_temp_c": 28.5,
                "precipitation_mm": 0.0,
                "is_rain_service_peak": False,
                "is_stadium_event": False,
                "is_azca_event": False,
                "is_holiday": False,
                "is_bridge_day": False,
                "is_payday_week": True,
                "is_business_day": True,
                "services_lag_7": 120,
                "avg_4_weeks": 125.5,
                "capacity_limit": 80,
                "table_count": 20,
                "min_service_duration": 45,
                "terrace_setup_type": "outdoor",
                "opens_weekends": True,
                "has_wifi": True,
                "restaurant_segment": "casual",
                "menu_price": 25.50,
                "dist_office_towers": 500,
                "google_rating": 4.5,
                "cuisine_type": "mediterranean",
            }
        }


class PredictionResponse(BaseModel):
    """
    Modelo de respuesta de una predicción.

    Retorna la predicción realizada junto con metadatos.
    """

    prediction_result: int = Field(
        ...,
        description="Resultado de la predicción del modelo IA (cantidad de servicios)",
        example=150,
    )
    service_date: date = Field(
        ...,
        description="Fecha predicha",
        example="2026-03-15",
    )
    model_version: str = Field(
        ...,
        description="Versión del modelo utilizado",
        example="v1_xgboost",
    )
    execution_timestamp: datetime = Field(
        ...,
        description="Timestamp de cuándo se ejecutó la predicción",
        example="2026-03-11T10:30:00",
    )
    log_id: int = Field(
        ...,
        description="ID del registro de auditoría en la base de datos",
        example=1,
    )

    class Config:
        json_schema_extra = {
            "example": {
                "prediction_result": 150,
                "service_date": "2026-03-15",
                "model_version": "v1_xgboost",
                "execution_timestamp": "2026-03-11T10:30:00",
                "log_id": 1,
            }
        }


class StarterDish(BaseModel):
    """
    Modelo para un plato de entrada (starter).
    Incluye nombre, score de predicción y count estimado.
    """
    rank: int = Field(..., description="Ranking (1=top)", example=1)
    name: str = Field(..., description="Nombre del plato", example="Jamón Ibérico")
    score: float = Field(..., description="Score de probabilidad (0-1)", example=0.85)
    estimated_count: int = Field(..., description="Número estimado de este plato en el restaurante", example=43)


class StarterPredictionRequest(BaseModel):
    """
    Modelo de solicitud para predecir platos de entrada.
    
    Inputs del usuario (mínimo):
    - restaurant_id: ID del restaurante
    - service_date: Fecha del servicio
    
    Los demás parámetros se auto-calculan automáticamente.
    """
    restaurant_id: int = Field(
        ...,
        description="ID del restaurante",
        example=1,
        ge=1,
    )
    service_date: date = Field(
        ...,
        description="Fecha del servicio (YYYY-MM-DD)",
        example="2026-03-15",
    )


class StarterPredictionResponse(BaseModel):
    """
    Modelo de respuesta para predicción de starters.
    
    Retorna top 3 platos más probables con sus scores.
    """
    top_3_dishes: list[StarterDish] = Field(
        ...,
        description="Top 3 platos de entrada ordenados por probabilidad",
        example=[
            {"rank": 1, "name": "Jamón Ibérico", "score": 0.85},
            {"rank": 2, "name": "Croquetas de Jamón", "score": 0.78},
            {"rank": 3, "name": "Espárragos a la Crema", "score": 0.72},
        ],
    )
    service_date: date = Field(
        ...,
        description="Fecha predicha",
        example="2026-03-15",
    )
    restaurant_id: int = Field(
        ...,
        description="ID del restaurante",
        example=1,
    )
    model_version: str = Field(
        ...,
        description="Versión del modelo",
        example="azca_menu_starter_v2",
    )
    execution_timestamp: datetime = Field(
        ...,
        description="Timestamp de ejecución",
        example="2026-03-14T10:30:00",
    )


class MainDish(BaseModel):
    """
    Modelo para un plato principal (main course).
    Incluye nombre, score de predicción y count estimado.
    """
    rank: int = Field(..., description="Ranking (1=top)", example=1)
    name: str = Field(..., description="Nombre del plato", example="Carne a la Sal")
    score: float = Field(..., description="Score de probabilidad (0-1)", example=0.88)
    estimated_count: int = Field(..., description="Número estimado de este plato en el restaurante", example=44)


class MainPredictionRequest(BaseModel):
    """
    Modelo de solicitud para predecir platos principales.
    Input mínimo del usuario: restaurant_id + service_date.
    """
    restaurant_id: int = Field(..., description="ID del restaurante", example=1, ge=1)
    service_date: date = Field(..., description="Fecha del servicio (YYYY-MM-DD)", example="2026-03-15")


class MainPredictionResponse(BaseModel):
    """
    Modelo de respuesta para predicción de platos principales.
    Retorna top 3 platos más probables.
    """
    top_3_dishes: list[MainDish] = Field(
        ...,
        description="Top 3 platos principales ordenados por probabilidad",
        example=[
            {"rank": 1, "name": "Carne a la Sal", "score": 0.88},
            {"rank": 2, "name": "Merluza a la Gallega", "score": 0.82},
            {"rank": 3, "name": "Cordero Lechal", "score": 0.76},
        ],
    )
    service_date: date = Field(..., description="Fecha predicha", example="2026-03-15")
    restaurant_id: int = Field(..., description="ID del restaurante", example=1)
    model_version: str = Field(..., description="Versión del modelo", example="azca_menu_main_v2")
    execution_timestamp: datetime = Field(..., description="Timestamp de ejecución", example="2026-03-14T10:30:00")


class DessertDish(BaseModel):
    """
    Modelo para un postre (dessert).
    Incluye nombre, score de predicción y count estimado.
    """
    rank: int = Field(..., description="Ranking (1=top)", example=1)
    name: str = Field(..., description="Nombre del postre", example="Flan Casero")
    score: float = Field(..., description="Score de probabilidad (0-1)", example=0.83)
    estimated_count: int = Field(..., description="Número estimado de este postre en el restaurante", example=42)


class DessertPredictionRequest(BaseModel):
    """
    Modelo de solicitud para predecir postres.
    Input mínimo del usuario: restaurant_id + service_date.
    """
    restaurant_id: int = Field(..., description="ID del restaurante", example=1, ge=1)
    service_date: date = Field(..., description="Fecha del servicio (YYYY-MM-DD)", example="2026-03-15")


class DessertPredictionResponse(BaseModel):
    """
    Modelo de respuesta para predicción de postres.
    Retorna top 3 postres más probables.
    """
    top_3_dishes: list[DessertDish] = Field(
        ...,
        description="Top 3 postres ordenados por probabilidad",
        example=[
            {"rank": 1, "name": "Flan Casero", "score": 0.83},
            {"rank": 2, "name": "Tiramisú", "score": 0.79},
            {"rank": 3, "name": "Churros con Chocolate", "score": 0.75},
        ],
    )
    service_date: date = Field(..., description="Fecha predicha", example="2026-03-15")
    restaurant_id: int = Field(..., description="ID del restaurante", example=1)
    model_version: str = Field(..., description="Versión del modelo", example="azca_menu_dessert_v2")
    execution_timestamp: datetime = Field(..., description="Timestamp de ejecución", example="2026-03-14T10:30:00")


class OCRExtractedMenu(BaseModel):
    """
    Resultado de extracción OCR del menú subido.
    """

    starter: str = Field(..., description="Entrante detectado por OCR", example="Ensalada César")
    main: str = Field(..., description="Principal detectado por OCR", example="Merluza a la Gallega")
    dessert: str = Field(..., description="Postre detectado por OCR", example="Flan Casero")
    starter_options: list[str] = Field(default_factory=list, description="Todos los entrantes detectados")
    main_options: list[str] = Field(default_factory=list, description="Todos los principales detectados")
    dessert_options: list[str] = Field(default_factory=list, description="Todos los postres detectados")
    detected_lines: list[str] = Field(default_factory=list, description="Líneas útiles detectadas por OCR")


class OCRPredictedDish(BaseModel):
    """
    Plato predicho por el modelo para una categoría.
    """

    rank: int = Field(..., description="Ranking (1=top)", example=1)
    name: str = Field(..., description="Nombre del plato", example="Merluza a la Gallega")
    score: float = Field(..., description="Probabilidad estimada (0-1)", example=0.82)


class MenuUploadPredictionResponse(BaseModel):
    """
    Respuesta combinada OCR + predicción ML del menú subido.
    """

    restaurant_id: int = Field(..., description="ID del restaurante", example=1)
    service_date: date = Field(..., description="Fecha del servicio", example="2026-03-15")
    ocr_provider: str = Field(..., description="Proveedor OCR usado", example="azure_document_intelligence")
    extracted_menu: OCRExtractedMenu = Field(..., description="Platos detectados desde el menú")
    starter_prediction: list[OCRPredictedDish] = Field(..., description="Top 3 entrantes predichos")
    main_prediction: list[OCRPredictedDish] = Field(..., description="Top 3 principales predichos")
    dessert_prediction: list[OCRPredictedDish] = Field(..., description="Top 3 postres predichos")
    model_version: str = Field(..., description="Versión del stack de modelos", example="azca_menu_v2")
    execution_timestamp: datetime = Field(..., description="Timestamp de ejecución")


class MenuOCRSectionsResponse(BaseModel):
    """
    Respuesta OCR pura (sin predicción) para inspeccionar secciones detectadas.
    """

    ocr_provider: str = Field(..., description="Proveedor OCR usado", example="azure_document_intelligence")
    extracted_menu: OCRExtractedMenu = Field(..., description="Platos detectados desde el menú")
    raw_text: str = Field(..., description="Texto OCR completo para depuración")
    execution_timestamp: datetime = Field(..., description="Timestamp de ejecución")


class HealthResponse(BaseModel):
    """
    Modelo de respuesta para el health check.
    """

    status: str = Field(
        ...,
        description="Estado de la API",
        example="healthy",
    )
    message: str = Field(
        ...,
        description="Mensaje descriptivo",
        example="API y base de datos funcionando correctamente",
    )


class RestaurantItem(BaseModel):
    """
    Modelo de respuesta para un restaurante individual (lista).
    Solo incluye ID y nombre para la lista.
    """
    restaurant_id: int = Field(..., description="ID único del restaurante")
    name: str = Field(..., description="Nombre del restaurante")

    class Config:
        from_attributes = True


class RestaurantDetailItem(BaseModel):
    """
    Modelo de respuesta detallado para un restaurante.
    Incluye todos los campos para llenar el formulario de predicción.
    """
    restaurant_id: int = Field(..., description="ID único del restaurante")
    name: str = Field(..., description="Nombre del restaurante")
    capacity_limit: int | None = Field(None, description="Límite de capacidad")
    table_count: int | None = Field(None, description="Cantidad de mesas")
    min_service_duration: int | None = Field(None, description="Duración mínima servicio (minutos)")
    terrace_setup_type: str | None = Field(None, description="Tipo de setup terraza")
    opens_weekends: bool | None = Field(None, description="¿Abre fines de semana?")
    has_wifi: bool | None = Field(None, description="¿Tiene Wi-Fi?")
    restaurant_segment: str | None = Field(None, description="Segmento del restaurante")
    menu_price: float | None = Field(None, description="Precio promedio menú")
    dist_office_towers: int | None = Field(None, description="Distancia a torres de oficina (metros)")
    google_rating: float | None = Field(None, description="Calificación Google")
    cuisine_type: str | None = Field(None, description="Tipo de cocina")
    image_url: str | None = Field(None, description="URL de imagen pública del restaurante")

    class Config:
        from_attributes = True


class RestaurantUpdateRequest(BaseModel):
    name: str | None = Field(None, description="Nombre del restaurante")
    capacity_limit: int | None = Field(None, description="Límite de capacidad", ge=1)
    table_count: int | None = Field(None, description="Cantidad de mesas", ge=1)
    min_service_duration: int | None = Field(None, description="Duración mínima de servicio", ge=1)
    terrace_setup_type: Literal[
        "yearround",
        "summer",
        "none",
    ] | None = Field(None, description="Tipo de terraza")
    opens_weekends: bool | None = Field(None, description="Abre fines de semana")
    has_wifi: bool | None = Field(None, description="Tiene WiFi")
    restaurant_segment: Literal[
        "gourmet",
        "traditional",
        "business",
        "family",
    ] | None = Field(None, description="Segmento del restaurante")
    menu_price: float | None = Field(None, description="Precio del menú", ge=0)
    dist_office_towers: int | None = Field(None, description="Distancia a oficinas", ge=0)
    google_rating: float | None = Field(None, description="Valoración de Google", ge=0, le=5)
    cuisine_type: Literal[
        "grill",
        "spanish",
        "mediterranean",
        "stew",
        "fried",
        "italian",
        "asian",
        "latin",
        "arabic",
        "avantgarde",
        "plantbased",
        "streetfood",
    ] | None = Field(None, description="Tipo de cocina")


class RestaurantsListResponse(BaseModel):
    """
    Modelo de respuesta para la lista de restaurantes.
    """
    count: int = Field(..., description="Cantidad total de restaurantes")
    restaurants: list[RestaurantItem] = Field(..., description="Lista de restaurantes")


class RestaurantsDetailListResponse(BaseModel):
    """Modelo de respuesta para la lista de restaurantes con detalle completo."""

    count: int = Field(..., description="Cantidad total de restaurantes")
    restaurants: list[RestaurantDetailItem] = Field(..., description="Lista detallada de restaurantes")


class InscripcionCreateRequest(BaseModel):
    """Modelo de alta para solicitudes en dbo.inscripciones."""

    name: str = Field(..., description="Nombre del restaurante", min_length=1)
    capacity_limit: int | None = Field(None, description="Límite de capacidad", ge=1)
    table_count: int | None = Field(None, description="Cantidad de mesas", ge=1)
    min_service: str | None = Field(None, description="Duración mínima del servicio (texto)")
    terrace_setup_type: Literal[
        "yearround",
        "summer",
        "none",
    ] | None = Field(None, description="Tipo de terraza")
    opens_weekends: bool | None = Field(None, description="Abre fines de semana")
    has_wifi: bool | None = Field(None, description="Tiene WiFi")
    restaurant_segment: Literal[
        "gourmet",
        "traditional",
        "business",
        "family",
    ] | None = Field(None, description="Segmento del restaurante")
    menu_price: float | None = Field(None, description="Precio medio del menú", ge=0)
    dist_office_towers: int | None = Field(None, description="Distancia a oficinas en metros", ge=0)
    google_rating: float | None = Field(None, description="Valoración media (0-5)", ge=0, le=5)
    cuisine_type: Literal[
        "grill",
        "spanish",
        "mediterranean",
        "stew",
        "fried",
        "italian",
        "asian",
        "latin",
        "arabic",
        "avantgarde",
        "plantbased",
        "streetfood",
    ] | None = Field(None, description="Tipo de cocina")
    image_url: str | None = Field(None, description="URL inicial de imagen del restaurante")
    google_maps_link: str = Field(..., description="Link de reseñas/Google Maps (obligatorio)", min_length=5)


class InscripcionItem(BaseModel):
    """Modelo de respuesta para una solicitud en dbo.inscripciones."""

    inscripcion_id: int
    name: str
    capacity_limit: int | None = None
    table_count: int | None = None
    min_service: str | None = None
    terrace_setup_type: str | None = None
    opens_weekends: bool | None = None
    has_wifi: bool | None = None
    restaurant_segment: str | None = None
    menu_price: float | None = None
    dist_office_towers: int | None = None
    google_rating: float | None = None
    cuisine_type: str | None = None
    login_email: str | None = None
    image_url: str | None = None
    google_maps_link: str
    estado_inscripcion: str | None = None
    fecha_solicitud: datetime | None = None

    class Config:
        from_attributes = True


class InscripcionesListResponse(BaseModel):
    """Respuesta para listados de inscripciones."""

    count: int
    inscripciones: list[InscripcionItem]


class InscripcionActionResponse(BaseModel):
    """Respuesta estándar para acciones administrativas sobre inscripciones."""

    inscripcion_id: int
    status: str
    message: str
    restaurant_id: int | None = None


class ClearApprovalHistoryResponse(BaseModel):
    """Respuesta para limpieza del historial de aprobaciones."""

    deleted_count: int
    message: str


class DailyMenuRequest(BaseModel):
    starter: str | list[str] | None = None
    main: str | list[str] | None = None
    dessert: str | list[str] | None = None
    includes_drink: bool = False


class DailyMenuResponse(BaseModel):
    menu_id: int
    restaurant_id: int
    date: date
    starter: str | None = None
    main: str | None = None
    dessert: str | None = None
    includes_drink: bool = False
    menu_price: float | None = None


class LoginRequest(BaseModel):
    email: str = Field(..., min_length=3)
    password: str = Field(..., min_length=3)


class AuthUserResponse(BaseModel):
    role: Literal["admin", "restaurant_owner"]
    restaurant_id: int | None = None
    restaurant_name: str | None = None
    email: str
    token: str


class RestaurantImageUpdateRequest(BaseModel):
    image_url: str = Field(..., min_length=5)


class UserCreateRequest(BaseModel):
    restaurant_id: int = Field(..., description="0 para admin, >0 para restaurante")
    email: str = Field(..., min_length=3)
    password: str = Field(..., min_length=6)
    role: Literal["admin", "restaurant_owner"] = "restaurant_owner"


class UserUpdateRequest(BaseModel):
    is_active: bool | None = None
    role: Literal["admin", "restaurant_owner"] | None = None
    email: str | None = None


class UserResetPasswordRequest(BaseModel):
    new_password: str = Field(..., min_length=6)


class UserAdminResponse(BaseModel):
    user_id: int
    restaurant_id: int
    email: str
    is_active: bool
    role: str
    created_at: datetime | None = None
    restaurant_name: str | None = None


def _extract_bearer_token(authorization: str | None) -> str | None:
    if not authorization:
        return None
    prefix = "Bearer "
    if not authorization.startswith(prefix):
        return None
    return authorization[len(prefix):].strip()


def _require_auth(authorization: str | None) -> dict:
    token = _extract_bearer_token(authorization)
    payload = decode_access_token(token) if token else None
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sesión no válida.")
    return payload


def _require_admin_auth(authorization: str | None) -> dict:
    """Requiere que el usuario sea admin (restaurant_id=0)"""
    payload = _require_auth(authorization)
    if payload.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sesión no válida para administrador.")
    return payload


# ============================================================================
# INICIALIZACIÓN DE LA APP
# ============================================================================

class CacheManager:
    """
    Gestor de caché en memoria para datos de clima, calendario y conteos de dishes.
    
    Evita llamadas repetidas a Open-Meteo API y queries costosas a BD.
    
    Beneficio: 
    - Clima/Calendario: Reducir 200-500ms por predicción × 3 = hasta 1.5s ahorrados
    - Dish Counts: Eliminar 3 JOINs + COUNT(DISTINCT) por predicción
    
    Atributos:
        ttl (timedelta): Tiempo de vida para clima/calendario (default: 20 min)
        dish_count_ttl (timedelta): Tiempo de vida para conteos de dishes (default: 60 min)
        weather_cache (dict): {date_obj: (data_dict, timestamp)}
        calendar_cache (dict): {date_obj: (data_dict, timestamp)}
        dish_count_cache (dict): {(restaurant_id, course_type): (count, timestamp)}
    """
    
    def __init__(self, ttl_minutes: int = 20, dish_count_ttl_minutes: int = 60):
        """
        Args:
            ttl_minutes: Minutos que clima/calendario permanecen en caché (default: 20 min)
            dish_count_ttl_minutes: Minutos que conteos de dishes permanecen en caché (default: 60 min)
        """
        self.ttl = timedelta(minutes=ttl_minutes)
        self.dish_count_ttl = timedelta(minutes=dish_count_ttl_minutes)
        self.weather_cache = {}
        self.calendar_cache = {}
        self.dish_count_cache = {}
        logger.info(f"🔄 CacheManager iniciado con TTL clima/calendario={ttl_minutes}min, dishes={dish_count_ttl_minutes}min")
    
    def _is_expired(self, cached_timestamp: datetime, ttl: timedelta) -> bool:
        """Verifica si una entrada de caché ha expirado."""
        return datetime.now() - cached_timestamp > ttl
    
    def get_weather(self, service_date: date) -> dict | None:
        """
        Obtiene datos de clima del caché si existen y no han expirado.
        
        Args:
            service_date: Fecha para consultar
            
        Returns:
            dict con datos de clima, o None si no está en caché o ha expirado
        """
        if service_date in self.weather_cache:
            data, timestamp = self.weather_cache[service_date]
            if not self._is_expired(timestamp, self.ttl):
                logger.info(f"✅ Climat caché para {service_date} (edad: {(datetime.now() - timestamp).total_seconds():.0f}s)")
                return data
            else:
                # Eliminar entrada expirada
                del self.weather_cache[service_date]
                logger.info(f"🗑️  Caché clima expirado para {service_date}")
        
        return None
    
    def set_weather(self, service_date: date, data: dict) -> None:
        """Guarda datos de clima en caché."""
        self.weather_cache[service_date] = (data, datetime.now())
        logger.info(f"💾 Guardado clima en caché para {service_date}")
    
    def get_calendar(self, service_date: date) -> dict | None:
        """
        Obtiene datos de calendario del caché si existen y no han expirado.
        
        Args:
            service_date: Fecha para consultar
            
        Returns:
            dict con datos de calendario, o None si no está en caché o ha expirado
        """
        if service_date in self.calendar_cache:
            data, timestamp = self.calendar_cache[service_date]
            if not self._is_expired(timestamp, self.ttl):
                logger.info(f"✅ Calendario caché para {service_date} (edad: {(datetime.now() - timestamp).total_seconds():.0f}s)")
                return data
            else:
                # Eliminar entrada expirada
                del self.calendar_cache[service_date]
                logger.info(f"🗑️  Caché calendario expirado para {service_date}")
        
        return None
    
    def set_calendar(self, service_date: date, data: dict) -> None:
        """Guarda datos de calendario en caché."""
        self.calendar_cache[service_date] = (data, datetime.now())
        logger.info(f"💾 Guardado calendario en caché para {service_date}")
    
    def get_dish_count(self, restaurant_id: int, course_type: str) -> int | None:
        """
        Obtiene el conteo de dishes del caché si existe y no ha expirado.
        
        Args:
            restaurant_id: ID del restaurante
            course_type: Tipo de plato ('first_course', 'second_course', 'dessert')
            
        Returns:
            int con el conteo, o None si no está en caché o ha expirado
        """
        cache_key = (restaurant_id, course_type)
        if cache_key in self.dish_count_cache:
            count, timestamp = self.dish_count_cache[cache_key]
            if not self._is_expired(timestamp, self.dish_count_ttl):
                logger.info(f"✅ Conteo {course_type} caché para restaurante {restaurant_id} (edad: {(datetime.now() - timestamp).total_seconds():.0f}s)")
                return count
            else:
                # Eliminar entrada expirada
                del self.dish_count_cache[cache_key]
                logger.info(f"🗑️  Caché conteo expirado para restaurante {restaurant_id}, {course_type}")
        
        return None
    
    def set_dish_count(self, restaurant_id: int, course_type: str, count: int) -> None:
        """Guarda conteo de dishes en caché."""
        cache_key = (restaurant_id, course_type)
        self.dish_count_cache[cache_key] = (count, datetime.now())
        logger.info(f"💾 Guardado conteo {course_type} en caché para restaurante {restaurant_id}: {count} platos")
    
    def clear_expired(self) -> None:
        """Limpia todas las entradas expiradas del caché."""
        expired_weather = [
            date_obj for date_obj, (_, ts) in self.weather_cache.items()
            if self._is_expired(ts, self.ttl)
        ]
        for date_obj in expired_weather:
            del self.weather_cache[date_obj]
        
        expired_calendar = [
            date_obj for date_obj, (_, ts) in self.calendar_cache.items()
            if self._is_expired(ts, self.ttl)
        ]
        for date_obj in expired_calendar:
            del self.calendar_cache[date_obj]
        
        expired_counts = [
            key for key, (_, ts) in self.dish_count_cache.items()
            if self._is_expired(ts, self.dish_count_ttl)
        ]
        for key in expired_counts:
            del self.dish_count_cache[key]
        
        if expired_weather or expired_calendar or expired_counts:
            logger.info(f"🧹 Limpieza caché: {len(expired_weather)} clima, {len(expired_calendar)} calendario, {len(expired_counts)} conteos eliminados")
    
    def stats(self) -> dict:
        """Retorna estadísticas del caché."""
        return {
            "weather_items": len(self.weather_cache),
            "calendar_items": len(self.calendar_cache),
            "dish_count_items": len(self.dish_count_cache),
            "ttl_minutes": int(self.ttl.total_seconds() / 60),
            "dish_count_ttl_minutes": int(self.dish_count_ttl.total_seconds() / 60),
        }
<<<<<<< HEAD


def _ensure_auth_columns_exist() -> None:
    """Crea columnas de auth/imagen en las tablas si la BD aún no fue migrada. Idempotente."""
    statements = [
        "IF COL_LENGTH('dbo.dim_restaurants', 'login_email') IS NULL ALTER TABLE dbo.dim_restaurants ADD login_email NVARCHAR(255) NULL;",
        "IF COL_LENGTH('dbo.dim_restaurants', 'password_hash') IS NULL ALTER TABLE dbo.dim_restaurants ADD password_hash NVARCHAR(255) NULL;",
        "IF COL_LENGTH('dbo.dim_restaurants', 'image_url') IS NULL ALTER TABLE dbo.dim_restaurants ADD image_url NVARCHAR(500) NULL;",
        "IF COL_LENGTH('dbo.inscripciones', 'login_email') IS NULL ALTER TABLE dbo.inscripciones ADD login_email NVARCHAR(255) NULL;",
        "IF COL_LENGTH('dbo.inscripciones', 'password_hash') IS NULL ALTER TABLE dbo.inscripciones ADD password_hash NVARCHAR(255) NULL;",
        "IF COL_LENGTH('dbo.inscripciones', 'image_url') IS NULL ALTER TABLE dbo.inscripciones ADD image_url NVARCHAR(500) NULL;",
        """
        IF COL_LENGTH('dbo.fact_menus', 'includes_drink') IS NULL
        BEGIN
            ALTER TABLE dbo.fact_menus ADD includes_drink BIT NOT NULL DEFAULT (0);
        END
        """,
    ]
    with engine.begin() as connection:
        for statement in statements:
            connection.execute(text(statement))


# ============================================================================
# LIFESPAN - Cargar modelo una sola vez al iniciar la aplicación
# ============================================================================

# Variable global para el motor de predicción
prediction_engine = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Context manager para gestionar el ciclo de vida de la aplicación FastAPI.
    
    STARTUP:
    - Inicializa la base de datos
    - Carga el modelo pickle en memoria (una sola vez)
    - Inicializa el caché en memoria (clima y calendario)
    - Inicializa el motor de predicción
    - Lo almacena en app.state para acceso global
    
    SHUTDOWN:
    - Limpia recursos si es necesario
    """
    global prediction_engine
    
    # ===== STARTUP =====
    logger.info("🚀 Iniciando aplicación AZCA Prediction API...")
    
    # 1. Inicializar base de datos
    try:
        init_db()
        logger.info("✅ Base de datos inicializada")
    except Exception as db_error:
        logger.error(f"❌ Error inicializando BD: {str(db_error)}", exc_info=True)
        raise

    # 1b. Asegurar que las columnas de auth/imagen existen (idempotente)
    try:
        _ensure_auth_columns_exist()
        logger.info("✅ Columnas de auth/imagen verificadas")
    except Exception as migration_error:
        logger.warning(f"⚠️  No se pudieron verificar columnas de auth: {str(migration_error)[:120]}")

    # 2. Intentar conectar a BD y verificar restaurantes
    try:
        db = SessionLocal()
        restaurant_count = db.query(Restaurant).count()
        db.close()
        logger.info(f"✅ Conectado a BD: {restaurant_count} restaurantes disponibles")
    except Exception as db_error:
        logger.error(f"❌ Error conectando BD: {str(db_error)}", exc_info=True)
        raise
    
    # 3. Inicializar el motor de predicción
    try:
        prediction_engine = PredictionEngine()
        logger.info(f"✅ Motor de predicción inicializado")
    except Exception as engine_error:
        logger.warning(f"⚠️  Motor de predicción no disponible: {str(engine_error)[:100]}")
        prediction_engine = None  # Permitirá fallback con mock en endpoints
    
    # 4. Cargar modelo pickle en memoria (OPTIMIZACIÓN CLAVE)
    try:
        artifacts_path = Path(__file__).parent.parent / "azca" / "artifacts"
        model_path = artifacts_path / "AzcaMenuModel.pkl"
        
        logger.info(f"📦 Cargando modelo desde: {model_path}")
        
        with open(model_path, "rb") as f:
            model = pickle.load(f)
        
        app.state.model = model
        logger.info(f"✅ Modelo cargado en memoria (app.state.model)")
        logger.info(f"   Tipo de modelo: {type(model).__name__}")
        
    except FileNotFoundError:
        logger.error(f"❌ Modelo no encontrado en {model_path}")
        raise
    except Exception as model_error:
        logger.error(f"❌ Error cargando modelo: {str(model_error)}", exc_info=True)
        raise
    
    # 5. Inicializar caché en memoria (clima y calendario)
    try:
        app.state.cache = CacheManager(ttl_minutes=20)
        logger.info(f"✅ Caché en memoria inicializado")
    except Exception as cache_error:
        logger.error(f"❌ Error inicializando caché: {str(cache_error)}", exc_info=True)
        raise
    
    logger.info("🎯 Aplicación lista para servir predicciones")
    
    # Yield para que FastAPI continúe ejecutándose
    yield
    
    # ===== SHUTDOWN =====
    logger.info("🛑 Deteniendo aplicación...")
    # Limpiar si es necesario
    logger.info("✅ Aplicación detenida correctamente")


# Crear la app con lifespan
=======
>>>>>>> lucian
app = FastAPI(
    title="AZCA Prediction API",
    description=(
        "API REST para predicciones de demanda de servicios con IA.\n\n"
        "Integra un motor de predicción XGBoost con persistencia en Azure SQL."
    ),
    version="1.0.0",
    contact={
        "name": "AZCA Project",
        "url": "https://github.com/your-org/azca",
    },
)

# Configurar CORS para permitir requests desde el frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, cambiar a ["https://tudominio.com"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

<<<<<<< HEAD
static_dir = Path(__file__).parent / "static"
if static_dir.exists():
    app.mount("/static", StaticFiles(directory=static_dir), name="static")
=======
# Variable global para el motor de predicción
prediction_engine: PredictionEngine | None = None


def _ensure_auth_columns_exist() -> None:
    """Crea columnas nuevas si la BD existente aún no fue migrada."""
    statements = [
        """
        IF COL_LENGTH('dbo.inscripciones', 'login_email') IS NULL
            ALTER TABLE dbo.inscripciones ADD login_email NVARCHAR(255) NULL;
        """,
        """
        IF COL_LENGTH('dbo.inscripciones', 'password_hash') IS NULL
            ALTER TABLE dbo.inscripciones ADD password_hash NVARCHAR(255) NULL;
        """,
        """
        IF COL_LENGTH('dbo.inscripciones', 'image_url') IS NULL
            ALTER TABLE dbo.inscripciones ADD image_url NVARCHAR(500) NULL;
        """,
        """
        IF COL_LENGTH('dbo.dim_restaurants', 'login_email') IS NULL
            ALTER TABLE dbo.dim_restaurants ADD login_email NVARCHAR(255) NULL;
        """,
        """
        IF COL_LENGTH('dbo.dim_restaurants', 'password_hash') IS NULL
            ALTER TABLE dbo.dim_restaurants ADD password_hash NVARCHAR(255) NULL;
        """,
        """
        IF COL_LENGTH('dbo.dim_restaurants', 'image_url') IS NULL
            ALTER TABLE dbo.dim_restaurants ADD image_url NVARCHAR(500) NULL;
        """,
        """
        IF COL_LENGTH('dbo.fact_menus', 'includes_drink') IS NULL
            ALTER TABLE dbo.fact_menus ADD includes_drink BIT NOT NULL DEFAULT (0);
        """,
        """
        IF NOT EXISTS (
            SELECT 1
            FROM sys.indexes
            WHERE name = 'ux_dim_restaurants_login_email'
        )
            CREATE UNIQUE INDEX ux_dim_restaurants_login_email
            ON dbo.dim_restaurants(login_email)
            WHERE login_email IS NOT NULL;
        """,
    ]

    with engine.begin() as connection:
        for statement in statements:
            connection.execute(text(statement))


# ============================================================================
# EVENTOS DE STARTUP Y SHUTDOWN
# ============================================================================


@app.on_event("startup")
async def startup_event():
    """
    Evento de inicio de la API.

    - Inicializa la base de datos (crea tablas si no existen)
    - Carga el motor de predicción (PredictionEngine)
    - Realiza validaciones básicas
    """
    global prediction_engine

    try:
        # Inicializar base de datos
        init_db()
        _ensure_auth_columns_exist()
        
        # Intentar conectar y cargar restaurantes
        try:
            db = SessionLocal()
            restaurant_count = db.query(Restaurant).count()
            db.close()
        except Exception as db_error:
            logger.error(f"❌ Error conectando BD: {str(db_error)}", exc_info=True)

        # Inicializar caché compartido para clima/calendario/conteos
        if not hasattr(app.state, "cache") or app.state.cache is None:
            app.state.cache = CacheManager()

        # Instanciar motor de predicción
        try:
            artifacts_path = Path(__file__).parent.parent / "azca" / "artifacts"
            prediction_engine = PredictionEngine(artifacts_path=artifacts_path)
        except Exception as engine_error:
            logger.warning(f"⚠️ Motor de predicción no disponible (usando mock): {str(engine_error)}")
            prediction_engine = PredictionEngine()

        # Descargar modelos si no están presentes; arrancar refresco mensual
        if MODEL_SCHEDULER_AVAILABLE and hasattr(prediction_engine, "model_provider"):
            try:
                provider = prediction_engine.model_provider
                provider.ensure_models_in_artifacts(MANAGED_MODELS)
                start_model_refresh_scheduler(provider, MANAGED_MODELS)
                logger.info("✅ Model download check complete; monthly scheduler started.")
            except Exception as sched_error:
                logger.warning(
                    f"⚠️ Model scheduler setup failed (continuing without it): {sched_error}"
                )

    except Exception as e:
        logger.error(f"❌ Error durante startup: {str(e)}", exc_info=True)
        raise


@app.on_event("shutdown")
async def shutdown_event():
    """
    Evento de cierre de la API.

    Realiza limpieza de recursos si es necesario.
    """
    pass
>>>>>>> lucian


# ============================================================================
# ENDPOINTS
# ============================================================================


@app.get(
    "/health",
    response_model=HealthResponse,
    summary="Health Check",
    tags=["Monitoring"],
)
async def health_check():
    """
    Verifica el estado de la API y sus dependencias.

    Returns:
        HealthResponse: Estado de la API
    """
    return HealthResponse(
        status="healthy",
        message="API y base de datos funcionando correctamente",
    )


@app.get(
    "/restaurants",
    response_model=RestaurantsListResponse,
    summary="Obtener Lista de Restaurantes",
    tags=["Data"],
)
async def get_restaurants(db: Session = Depends(get_db)):
    """
    Obtiene la lista de todos los restaurantes disponibles desde Azure SQL.

    Returns:
        RestaurantsListResponse: Lista de restaurantes con su información básica
    """
    try:
        restaurants = db.query(Restaurant).all()
        
        response = RestaurantsListResponse(
            count=len(restaurants),
            restaurants=[
                RestaurantItem(
                    restaurant_id=r.restaurant_id,
                    name=r.name
                )
                for r in restaurants
            ]
        )
        
        return response
    except Exception as e:
        logger.error(f"❌ Error en GET /restaurants: {str(e)}", exc_info=True)
        # Devolver lista vacía en lugar de 500 para mantener la UI funcional.
        # Esto ayuda cuando la DB no está disponible o falta configuración.
        return RestaurantsListResponse(count=0, restaurants=[])


@app.get(
    "/restaurants/details",
    response_model=RestaurantsDetailListResponse,
    summary="Obtener Lista Detallada de Restaurantes",
    tags=["Data"],
)
async def get_restaurants_details(db: Session = Depends(get_db)):
    """Obtiene todos los restaurantes con detalle completo en una sola consulta."""
    try:
        restaurants = db.query(Restaurant).all()

        detail_rows = [RestaurantDetailItem.from_orm(row) for row in restaurants]
        detail_rows.sort(key=lambda row: row.name.casefold())

        return RestaurantsDetailListResponse(count=len(detail_rows), restaurants=detail_rows)
    except Exception as e:
        logger.error(f"❌ Error en GET /restaurants/details: {str(e)}", exc_info=True)
        return RestaurantsDetailListResponse(count=0, restaurants=[])


@app.get(
    "/restaurants/{restaurant_id}",
    response_model=RestaurantDetailItem,
    summary="Obtener Detalles de un Restaurante",
    tags=["Data"],
)
async def get_restaurant_detail(restaurant_id: int, db: Session = Depends(get_db)):
    """
    Obtiene todos los detalles de un restaurante específico por ID.
    
    Devuelve todos los campos necesarios para llenar el formulario de predicción.

    Args:
        restaurant_id: ID del restaurante a obtener

    Returns:
        RestaurantDetailItem: Detalles completos del restaurante
    """
    try:
        restaurant = db.query(Restaurant).filter(Restaurant.restaurant_id == restaurant_id).first()
        
        if not restaurant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Restaurante con ID {restaurant_id} no encontrado"
            )
        
        return RestaurantDetailItem.from_orm(restaurant)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error en GET /restaurants/{restaurant_id}: {str(e)}", exc_info=True)
        # Retornar un objeto mínimo para mantener la UI operativa
        return RestaurantDetailItem(
            restaurant_id=restaurant_id,
            name=f"Restaurante {restaurant_id}",
            capacity_limit=None,
            table_count=None,
            min_service_duration=None,
            terrace_setup_type=None,
            opens_weekends=None,
            has_wifi=None,
            restaurant_segment=None,
            menu_price=None,
            dist_office_towers=None,
            google_rating=None,
            cuisine_type=None,
            image_url=None,
        )


@app.get(
    "/restaurants/{restaurant_id}/image",
    summary="Obtener URL de imagen del restaurante",
    tags=["Data"],
    response_model=dict,
)
async def get_restaurant_image(
    restaurant_id: int,
    db: Session = Depends(get_db)
):
    """
    Obtiene la URL de la imagen del restaurante.
    
    Si el restaurante no tiene imagen personalizada en Blob Storage,
    retorna la imagen por defecto según su tipo de cocina.

    Args:
        restaurant_id: ID del restaurante

    Returns:
        {
            "image_url": "https://...",
            "is_default": false,
            "restaurant_id": 1
        }
    """
    try:
        restaurant = db.query(Restaurant).filter(
            Restaurant.restaurant_id == restaurant_id
        ).first()

        if not restaurant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Restaurante con ID {restaurant_id} no encontrado"
            )

        # Si tiene URL personalizada (del Blob Storage), usarla
        if restaurant.image_url:
            return {
                "image_url": restaurant.image_url,
                "is_default": False,
                "restaurant_id": restaurant_id
            }

        # Si no, retornar imagen por defecto según tipo de cocina
        default_image_url = get_default_image_url(restaurant.cuisine_type)
        return {
            "image_url": default_image_url,
            "is_default": True,
            "restaurant_id": restaurant_id,
            "cuisine_type": restaurant.cuisine_type
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"❌ Error en GET /restaurants/{restaurant_id}/image: {str(e)}",
            exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener imagen del restaurante"
        )


def _parse_min_service_duration(min_service: str | None) -> int | None:
    """Convierte min_service (nvarchar) a entero de minutos si es posible."""
    if not min_service:
        return None

    digits = "".join(char for char in str(min_service) if char.isdigit())
    if not digits:
        return None

    try:
        parsed = int(digits)
        return parsed if parsed > 0 else None
    except ValueError:
        return None


@app.post(
    "/inscripciones",
    response_model=InscripcionItem,
    summary="Crear Solicitud de Inscripción",
    tags=["Data"],
    status_code=status.HTTP_201_CREATED,
)
async def create_inscripcion(request: InscripcionCreateRequest, db: Session = Depends(get_db)):
    """Crea una solicitud de alta en dbo.inscripciones."""
    try:
        inscripcion = Inscripcion(
            name=request.name.strip(),
            capacity_limit=request.capacity_limit,
            table_count=request.table_count,
            min_service=request.min_service,
            terrace_setup_type=request.terrace_setup_type,
            opens_weekends=request.opens_weekends,
            has_wifi=request.has_wifi,
            restaurant_segment=request.restaurant_segment,
            menu_price=request.menu_price,
            dist_office_towers=request.dist_office_towers,
            google_rating=request.google_rating,
            cuisine_type=request.cuisine_type,
            image_url=request.image_url.strip() if request.image_url else None,
            google_maps_link=request.google_maps_link.strip(),
            estado_inscripcion="pendiente",
            fecha_solicitud=datetime.now(),
        )

        db.add(inscripcion)
        db.commit()
        db.refresh(inscripcion)
        return InscripcionItem.from_orm(inscripcion)

    except Exception as e:
        db.rollback()
        logger.error(f"❌ Error en POST /inscripciones: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al crear solicitud de inscripción",
        )


@app.get(
    "/inscripciones/pending",
    response_model=InscripcionesListResponse,
    summary="Obtener Inscripciones Pendientes",
    tags=["Data"],
)
async def get_pending_inscripciones(db: Session = Depends(get_db)):
    """Obtiene solicitudes pendientes desde dbo.inscripciones."""
    try:
        rows = (
            db.query(Inscripcion)
            .filter(
                or_(
                    Inscripcion.estado_inscripcion.is_(None),
                    func.lower(Inscripcion.estado_inscripcion) == "pendiente",
                )
            )
            .order_by(desc(Inscripcion.fecha_solicitud), desc(Inscripcion.inscripcion_id))
            .all()
        )

        return InscripcionesListResponse(
            count=len(rows),
            inscripciones=[InscripcionItem.from_orm(row) for row in rows],
        )

    except Exception as e:
        logger.error(f"❌ Error en GET /inscripciones/pending: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener inscripciones pendientes",
        )


@app.get(
    "/restaurants/{restaurant_id}",
    response_model=RestaurantDetailItem,
    summary="Obtener detalles de un restaurante",
    tags=["Restaurantes"],
)
async def get_restaurant(
    restaurant_id: int, 
    db: Session = Depends(get_db), 
    authorization: str | None = Header(default=None)
):
    """
    Obtiene la información de un restaurante por su ID.
    El admin puede ver cualquiera. 
    Un owner solo puede ver su propio restaurante.
    """
    payload = _require_auth(authorization)
    role = payload.get("role")
    user_restaurant_id = payload.get("restaurant_id")
    
    # Validar permisos
    if role == "restaurant_owner" and user_restaurant_id != restaurant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="No tienes permisos para ver los detalles de este restaurante"
        )
        
    restaurant = db.query(Restaurant).filter(
        Restaurant.restaurant_id == restaurant_id
    ).first()
    
    if not restaurant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Restaurante no encontrado"
        )
        
    return RestaurantDetailItem.from_orm(restaurant)


@app.patch(
    "/restaurants/{restaurant_id}",
    response_model=RestaurantDetailItem,
    summary="Actualizar datos del restaurante",
    tags=["Restaurantes"],
)
async def update_restaurant(
    restaurant_id: int,
    request: RestaurantUpdateRequest,
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
):
    """
    Actualiza los campos editables de un restaurante.

    - Admin puede editar cualquier restaurante.
    - El dueño solo puede editar su propio restaurante.
    - Los campos opcionales enviados como null o cadena vacía se limpian en BD.
    """
    payload = _require_auth(authorization)
    role = payload.get("role")
    user_restaurant_id = payload.get("restaurant_id")

    if role == "restaurant_owner" and user_restaurant_id != restaurant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para editar este restaurante",
        )
    if role not in {"admin", "restaurant_owner"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Rol no autorizado",
        )

    restaurant = db.query(Restaurant).filter(Restaurant.restaurant_id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Restaurante no encontrado",
        )

    provided_fields = getattr(request, "model_fields_set", None)
    if provided_fields is None:
        provided_fields = getattr(request, "__fields_set__", set())

    if not provided_fields:
        return RestaurantDetailItem.from_orm(restaurant)

    editable_fields = {
        "name",
        "capacity_limit",
        "table_count",
        "min_service_duration",
        "terrace_setup_type",
        "opens_weekends",
        "has_wifi",
        "restaurant_segment",
        "menu_price",
        "dist_office_towers",
        "google_rating",
        "cuisine_type",
    }

    for field_name in provided_fields:
        if field_name not in editable_fields:
            continue

        value = getattr(request, field_name)
        if isinstance(value, str):
            value = value.strip()
            if field_name == "name" and not value:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="El nombre del restaurante no puede quedar vacío",
                )
            if field_name != "name" and not value:
                value = None

        setattr(restaurant, field_name, value)

    db.commit()
    db.refresh(restaurant)
    return RestaurantDetailItem.from_orm(restaurant)


@app.get(
    "/inscripciones",
    response_model=InscripcionesListResponse,
    summary="Obtener Inscripciones",
    tags=["Data"],
)
async def get_inscripciones(
    status_filter: str | None = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
):
    """Obtiene inscripciones con filtro opcional por estado."""
    try:
        query = db.query(Inscripcion)

        if status_filter:
            normalized = status_filter.strip().lower()
            query = query.filter(func.lower(func.coalesce(Inscripcion.estado_inscripcion, "")) == normalized)

        rows = query.order_by(desc(Inscripcion.fecha_solicitud), desc(Inscripcion.inscripcion_id)).all()

        return InscripcionesListResponse(
            count=len(rows),
            inscripciones=[InscripcionItem.from_orm(row) for row in rows],
        )

    except Exception as e:
        logger.error(f"❌ Error en GET /inscripciones: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener inscripciones",
        )


@app.post(
    "/inscripciones/{inscripcion_id}/approve",
    response_model=InscripcionActionResponse,
    summary="Aprobar Inscripción",
    tags=["Data"],
)
async def approve_inscripcion(inscripcion_id: int, db: Session = Depends(get_db)):
    """
    Aprueba una inscripción:
    - Inserta los datos del restaurante en dim_restaurants.
    - Marca la inscripción como Aprobada.
    """
    try:
        inscripcion = (
            db.query(Inscripcion)
            .filter(Inscripcion.inscripcion_id == inscripcion_id)
            .first()
        )

        if not inscripcion:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Inscripción con ID {inscripcion_id} no encontrada",
            )

        restaurant_data = {
            "name": inscripcion.name,
            "capacity_limit": inscripcion.capacity_limit,
            "table_count": inscripcion.table_count,
            "min_service_duration": _parse_min_service_duration(inscripcion.min_service),
            "terrace_setup_type": inscripcion.terrace_setup_type,
            "opens_weekends": inscripcion.opens_weekends,
            "has_wifi": inscripcion.has_wifi,
            "restaurant_segment": inscripcion.restaurant_segment,
            "menu_price": inscripcion.menu_price,
            "dist_office_towers": inscripcion.dist_office_towers,
            "google_rating": inscripcion.google_rating,
            "cuisine_type": inscripcion.cuisine_type,
            "login_email": inscripcion.login_email,
            "password_hash": inscripcion.password_hash,
            "image_url": inscripcion.image_url,
        }

        next_restaurant_id = (db.query(func.max(Restaurant.restaurant_id)).scalar() or 0) + 1
        restaurant = Restaurant(restaurant_id=next_restaurant_id, **restaurant_data)

        db.add(restaurant)
        db.flush()

        # Crear usuario en tabla Users si hay email y contraseña
        if inscripcion.login_email and inscripcion.password_hash:
            # Comprobar que no exista ya un usuario con ese email
            existing_user = db.query(User).filter(
                User.login_email == inscripcion.login_email.strip().lower()
            ).first()
            if not existing_user:
                new_user = User(
                    restaurant_id=next_restaurant_id,
                    login_email=inscripcion.login_email.strip().lower(),
                    password_hash=inscripcion.password_hash,
                    is_active=True,
                    role="restaurant_owner",
                )
                db.add(new_user)

        db.delete(inscripcion)
        db.commit()
        db.refresh(restaurant)

        return InscripcionActionResponse(
            inscripcion_id=inscripcion_id,
            status="aprobada",
            message="Inscripción aprobada, movida a restaurantes y eliminada de inscripciones.",
            restaurant_id=restaurant.restaurant_id,
        )

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Error en POST /inscripciones/{inscripcion_id}/approve: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al aprobar inscripción",
        )


@app.post(
    "/inscripciones/{inscripcion_id}/reject",
    response_model=InscripcionActionResponse,
    summary="Solicitar Cambios o Rechazar Inscripción",
    tags=["Data"],
)
async def reject_inscripcion(inscripcion_id: int, db: Session = Depends(get_db)):
    """Rechaza una inscripción y la elimina de la tabla de pendientes."""
    try:
        inscripcion = (
            db.query(Inscripcion)
            .filter(Inscripcion.inscripcion_id == inscripcion_id)
            .first()
        )

        if not inscripcion:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Inscripción con ID {inscripcion_id} no encontrada",
            )

        db.delete(inscripcion)
        db.commit()

        return InscripcionActionResponse(
            inscripcion_id=inscripcion_id,
            status="rechazada",
            message="Inscripción rechazada y eliminada de pendientes.",
        )

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Error en POST /inscripciones/{inscripcion_id}/reject: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al actualizar inscripción",
        )


@app.delete(
    "/inscripciones/history/approved",
    response_model=ClearApprovalHistoryResponse,
    summary="Limpiar historial de aprobadas",
    tags=["Data"],
)
async def clear_approval_history(db: Session = Depends(get_db)):
    """Elimina del histórico las inscripciones con estado Aprobada."""
    try:
        approved_query = db.query(Inscripcion).filter(
            func.lower(func.coalesce(Inscripcion.estado_inscripcion, "")) == "aprobada"
        )
        deleted_count = approved_query.count()

        if deleted_count > 0:
            approved_query.delete(synchronize_session=False)

        db.commit()

        return ClearApprovalHistoryResponse(
            deleted_count=deleted_count,
            message="Historial de aprobaciones limpiado correctamente.",
        )

    except Exception as e:
        db.rollback()
        logger.error("❌ Error en DELETE /inscripciones/history/approved: %s", str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al limpiar historial de aprobaciones",
        )


@app.post(
    "/auth/login",
    response_model=AuthUserResponse,
    summary="Iniciar sesión",
    tags=["Auth"],
)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    """
    Login desde tabla Users.
    
    - Busca el usuario en la tabla Users por email
    - Verifica la contraseña con hash PBKDF2
    - Si es admin (restaurant_id=0), retorna role="admin"
    - Si es restaurante normal (restaurant_id>0), retorna role="restaurant_owner"
    - Valida que is_active=True
    """
    # Buscar usuario en tabla Users
    user = db.query(User).filter(
        User.login_email == request.email.strip().lower()
    ).first()
    
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Email o contraseña no válidos."
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Usuario desactivado."
        )
    
    # Determinar el rol según restaurant_id
    role = "admin" if user.restaurant_id == 0 else "restaurant_owner"
    
    # Obtener datos del restaurante si no es admin
    restaurant_id = user.restaurant_id if user.restaurant_id != 0 else None
    restaurant_name = None
    if restaurant_id:
        restaurant = db.query(Restaurant).filter(
            Restaurant.restaurant_id == restaurant_id
        ).first()
        if restaurant:
            restaurant_name = restaurant.name
    
    # Crear token con rol y restaurant_id
    token = create_access_token({
        "role": role, 
        "email": user.login_email,
        "restaurant_id": user.restaurant_id
    })
    
    return AuthUserResponse(
        role=role, 
        email=user.login_email, 
        restaurant_id=restaurant_id,
        restaurant_name=restaurant_name,
        token=token
    )


@app.get(
    "/auth/me",
    response_model=AuthUserResponse,
    summary="Obtener sesión actual",
    tags=["Auth"],
)
async def auth_me(authorization: str | None = Header(default=None), db: Session = Depends(get_db)):
    payload = _require_auth(authorization)
    token = _extract_bearer_token(authorization) or ""
    
    email = payload.get("email", "")
    role = payload.get("role", "")
    restaurant_id = payload.get("restaurant_id")
    restaurant_name = None
    
    # Si es restaurant_owner, obtener el nombre del restaurante
    if role == "restaurant_owner" and restaurant_id and restaurant_id != 0:
        restaurant = db.query(Restaurant).filter(
            Restaurant.restaurant_id == restaurant_id
        ).first()
        if restaurant:
            restaurant_name = restaurant.name
    
    return AuthUserResponse(
        role=role,
        email=email,
        restaurant_id=restaurant_id if restaurant_id != 0 else None,
        restaurant_name=restaurant_name,
        token=token
    )


# =============================
# ENDPOINTS ADMIN: GESTIÓN DE USUARIOS
# =============================

@app.get(
    "/admin/users",
    response_model=list[UserAdminResponse],
    summary="Listar todos los usuarios",
    tags=["Admin - Users"],
)
async def admin_list_users(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    """Devuelve todos los usuarios registrados. Solo accesible por admin."""
    _require_admin_auth(authorization)

    users = db.query(User).order_by(User.user_id).all()

    # Cargar nombres de restaurantes en batch
    rest_ids = {u.restaurant_id for u in users if u.restaurant_id and u.restaurant_id != 0}
    restaurants = {}
    if rest_ids:
        for r in db.query(Restaurant).filter(Restaurant.restaurant_id.in_(rest_ids)).all():
            restaurants[r.restaurant_id] = r.name

    return [
        UserAdminResponse(
            user_id=u.user_id,
            restaurant_id=u.restaurant_id,
            email=u.login_email,
            is_active=u.is_active,
            role=u.role,
            created_at=u.created_at,
            restaurant_name=restaurants.get(u.restaurant_id),
        )
        for u in users
    ]


@app.post(
    "/admin/users",
    response_model=UserAdminResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear un usuario",
    tags=["Admin - Users"],
)
async def admin_create_user(
    body: UserCreateRequest,
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    """Crea un usuario manualmente (p. ej. el admin o un restaurante ya existente). Solo admin."""
    _require_admin_auth(authorization)

    email_normalized = body.email.strip().lower()
    if db.query(User).filter(User.login_email == email_normalized).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Ya existe un usuario con ese email.")

    new_user = User(
        restaurant_id=body.restaurant_id,
        login_email=email_normalized,
        password_hash=hash_password(body.password),
        is_active=True,
        role=body.role,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    restaurant_name = None
    if body.restaurant_id and body.restaurant_id != 0:
        r = db.query(Restaurant).filter(Restaurant.restaurant_id == body.restaurant_id).first()
        if r:
            restaurant_name = r.name

    return UserAdminResponse(
        user_id=new_user.user_id,
        restaurant_id=new_user.restaurant_id,
        email=new_user.login_email,
        is_active=new_user.is_active,
        role=new_user.role,
        created_at=new_user.created_at,
        restaurant_name=restaurant_name,
    )


@app.patch(
    "/admin/users/{user_id}",
    response_model=UserAdminResponse,
    summary="Actualizar un usuario",
    tags=["Admin - Users"],
)
async def admin_update_user(
    user_id: int,
    body: UserUpdateRequest,
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    """Permite al admin activar/desactivar un usuario, cambiar su rol o email."""
    _require_admin_auth(authorization)

    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Usuario {user_id} no encontrado.")

    if body.is_active is not None:
        user.is_active = body.is_active
    if body.role is not None:
        user.role = body.role
    if body.email is not None:
        email_normalized = body.email.strip().lower()
        conflict = db.query(User).filter(User.login_email == email_normalized, User.user_id != user_id).first()
        if conflict:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Ya existe un usuario con ese email.")
        user.login_email = email_normalized

    db.commit()
    db.refresh(user)

    restaurant_name = None
    if user.restaurant_id and user.restaurant_id != 0:
        r = db.query(Restaurant).filter(Restaurant.restaurant_id == user.restaurant_id).first()
        if r:
            restaurant_name = r.name

    return UserAdminResponse(
        user_id=user.user_id,
        restaurant_id=user.restaurant_id,
        email=user.login_email,
        is_active=user.is_active,
        role=user.role,
        created_at=user.created_at,
        restaurant_name=restaurant_name,
    )


@app.post(
    "/admin/users/{user_id}/reset-password",
    summary="Restablecer contraseña de un usuario",
    tags=["Admin - Users"],
)
async def admin_reset_password(
    user_id: int,
    body: UserResetPasswordRequest,
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    """Restablece la contraseña de cualquier usuario. Solo admin."""
    _require_admin_auth(authorization)

    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Usuario {user_id} no encontrado.")

    user.password_hash = hash_password(body.new_password)
    db.commit()
    return {"success": True, "message": f"Contraseña del usuario {user_id} actualizada."}


@app.delete(
    "/admin/users/{user_id}",
    summary="Eliminar un usuario",
    tags=["Admin - Users"],
)
async def admin_delete_user(
    user_id: int,
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    """Elimina permanentemente un usuario. Solo admin."""
    _require_admin_auth(authorization)

    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Usuario {user_id} no encontrado.")

    db.delete(user)
    db.commit()
    return {"success": True, "message": f"Usuario {user_id} eliminado."}


@app.post(
    "/auth/change-password",
    summary="Cambiar propia contraseña",
    tags=["Auth"],
)
async def auth_change_password(
    body: UserResetPasswordRequest,
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    """Permite a cualquier usuario autenticado cambiar su propia contraseña."""
    payload = _require_auth(authorization)
    email = payload.get("email", "")

    user = db.query(User).filter(User.login_email == email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado.")

    user.password_hash = hash_password(body.new_password)
    db.commit()
    return {"success": True, "message": "Contraseña actualizada correctamente."}


def _canonical_course(course: str) -> str:
    normalized = (course or "").strip().lower()
    if normalized in {"starter", "first", "first_course", "entrada"}:
        return "first_course"
    if normalized in {"main", "second", "second_course", "principal"}:
        return "second_course"
    return "dessert"


def _extract_course_items(raw_value: str | list[str] | None) -> list[str]:
    if raw_value is None:
        return []
    if isinstance(raw_value, list):
        values = raw_value
    else:
        values = raw_value.split(";")
    result: list[str] = []
    seen: set[str] = set()
    for value in values:
        cleaned = " ".join(str(value).strip().split())
        normalized_key = _normalize_dish_name(cleaned)
        if not cleaned or normalized_key in seen:
            continue
        seen.add(normalized_key)
        result.append(cleaned)
    return result


def _normalize_dish_name(dish_name: str) -> str:
    compact = " ".join((dish_name or "").strip().split())
    ascii_like = "".join(
        char for char in unicodedata.normalize("NFKD", compact)
        if not unicodedata.combining(char)
    )
    return ascii_like.casefold()


def _ensure_calendar_date(db: Session, service_date: date, date_id: int) -> None:
    exists = db.execute(
        text("SELECT 1 FROM dbo.dim_calendar WHERE date_id = :date_id"),
        {"date_id": date_id},
    ).first()
    if exists:
        return

    db.execute(
        text(
            """
            INSERT INTO dbo.dim_calendar (date_id, service_date)
            VALUES (:date_id, :service_date)
            """
        ),
        {"date_id": date_id, "service_date": service_date},
    )


def _current_service_date() -> date:
    return datetime.now(ZoneInfo("Europe/Madrid")).date()


def _fact_menus_has_includes_drink(db: Session) -> bool:
    column_exists = db.execute(
        text(
            """
            SELECT TOP 1 1
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = 'fact_menus'
              AND COLUMN_NAME = 'includes_drink'
            """
        )
    ).first()
    return column_exists is not None


def _fact_menu_items_has_target_rating(db: Session) -> bool:
    column_exists = db.execute(
        text(
            """
            SELECT TOP 1 1
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = 'fact_menu_items'
              AND COLUMN_NAME = 'target_rating'
            """
        )
    ).first()
    return column_exists is not None


<<<<<<< HEAD
@app.post(
    "/restaurants/{restaurant_id}/menu",
    response_model=DailyMenuResponse,
    summary="Publicar menú del día",
    tags=["Restaurants"],
)
async def post_daily_menu(
    restaurant_id: int,
    request: DailyMenuRequest,
    db: Session = Depends(get_db),
):
    restaurant = db.query(Restaurant).filter(Restaurant.restaurant_id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Restaurante no encontrado")

    service_date = _current_service_date()
    date_id = int(service_date.strftime("%Y%m%d"))

    starters = _extract_course_items(request.starter)
    mains = _extract_course_items(request.main)
    desserts = _extract_course_items(request.dessert)

    try:
        _ensure_calendar_date(db, service_date, date_id)
        has_includes_drink = _fact_menus_has_includes_drink(db)
        has_target_rating = _fact_menu_items_has_target_rating(db)

        previous_menu_ids = db.execute(
            text(
                """
                SELECT menu_id
                FROM dbo.fact_menus
                WHERE restaurant_id = :restaurant_id
                  AND date_id = :date_id
                """
            ),
            {"restaurant_id": restaurant_id, "date_id": date_id},
        ).fetchall()

        for row in previous_menu_ids:
            previous_menu_id = int(row[0])
            db.execute(
                text("DELETE FROM dbo.fact_menu_items WHERE menu_id = :menu_id"),
                {"menu_id": previous_menu_id},
            )
            db.execute(
                text("DELETE FROM dbo.fact_menus WHERE menu_id = :menu_id"),
                {"menu_id": previous_menu_id},
            )

        if has_includes_drink:
            menu_id = db.execute(
                text(
                    """
                    INSERT INTO dbo.fact_menus (date_id, restaurant_id, includes_drink)
                    OUTPUT INSERTED.menu_id
                    VALUES (:date_id, :restaurant_id, :includes_drink)
                    """
                ),
                {
                    "date_id": date_id,
                    "restaurant_id": restaurant_id,
                    "includes_drink": 1 if request.includes_drink else 0,
                },
            ).scalar_one()
        else:
            menu_id = db.execute(
                text(
                    """
                    INSERT INTO dbo.fact_menus (date_id, restaurant_id)
                    OUTPUT INSERTED.menu_id
                    VALUES (:date_id, :restaurant_id)
                    """
                ),
                {
                    "date_id": date_id,
                    "restaurant_id": restaurant_id,
                },
            ).scalar_one()

        course_payload = {
            "first_course": starters,
            "second_course": mains,
            "dessert": desserts,
        }

        inserted_dish_ids: set[int] = set()

        for course_type, dish_names in course_payload.items():
            existing_dishes = db.execute(
                text(
                    """
                    SELECT dish_id, dish_name
                    FROM dbo.dim_dishes
                    WHERE course_type = :course_type
                    """
                ),
                {"course_type": course_type},
            ).fetchall()

            dish_index: dict[str, int] = {}
            for row in existing_dishes:
                current_dish_id = int(row[0])
                current_dish_name = str(row[1] or "")
                key = _normalize_dish_name(current_dish_name)
                if key and key not in dish_index:
                    dish_index[key] = current_dish_id

            for dish_name in dish_names:
                normalized_name = _normalize_dish_name(dish_name)
                dish_id = dish_index.get(normalized_name)

                if dish_id is None:
                    clean_dish_name = " ".join(dish_name.strip().split())
                    dish_id = db.execute(
                        text(
                            """
                            INSERT INTO dbo.dim_dishes (course_type, dish_name)
                            OUTPUT INSERTED.dish_id
                            VALUES (:course_type, :dish_name)
                            """
                        ),
                        {"course_type": course_type, "dish_name": clean_dish_name},
                    ).scalar_one()
                    dish_index[normalized_name] = int(dish_id)

                if int(dish_id) in inserted_dish_ids:
                    continue

                already_in_menu = db.execute(
                    text(
                        """
                        SELECT TOP 1 1
                        FROM dbo.fact_menu_items
                        WHERE menu_id = :menu_id AND dish_id = :dish_id
                        """
                    ),
                    {"menu_id": menu_id, "dish_id": dish_id},
                ).first()

                if already_in_menu:
                    inserted_dish_ids.add(int(dish_id))
                    continue

                if has_target_rating:
                    db.execute(
                        text(
                            """
                            INSERT INTO dbo.fact_menu_items (menu_id, dish_id, target_rating)
                            VALUES (:menu_id, :dish_id, NULL)
                            """
                        ),
                        {"menu_id": menu_id, "dish_id": dish_id},
                    )
                else:
                    db.execute(
                        text(
                            """
                            INSERT INTO dbo.fact_menu_items (menu_id, dish_id)
                            VALUES (:menu_id, :dish_id)
                            """
                        ),
                        {"menu_id": menu_id, "dish_id": dish_id},
                    )
                inserted_dish_ids.add(int(dish_id))

        db.commit()

        return DailyMenuResponse(
            menu_id=menu_id,
            restaurant_id=restaurant_id,
            date=service_date,
            starter="; ".join(starters) if starters else None,
            main="; ".join(mains) if mains else None,
            dessert="; ".join(desserts) if desserts else None,
            includes_drink=request.includes_drink,
            menu_price=restaurant.menu_price,
        )
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error("❌ Error en POST /restaurants/%s/menu: %s", restaurant_id, str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al guardar el menú del día",
        )


@app.get(
    "/restaurants/{restaurant_id}/menu/today",
    response_model=DailyMenuResponse,
    summary="Obtener menú real de hoy",
    tags=["Restaurants"],
)
async def get_daily_menu(
    restaurant_id: int,
    db: Session = Depends(get_db),
):
    service_date = _current_service_date()
    date_id = int(service_date.strftime("%Y%m%d"))

    has_includes_drink = _fact_menus_has_includes_drink(db)

    if has_includes_drink:
        menu_row = db.execute(
            text(
                """
                SELECT TOP 1 menu_id, includes_drink
                FROM dbo.fact_menus
                WHERE restaurant_id = :restaurant_id AND date_id = :date_id
                ORDER BY menu_id DESC
                """
            ),
            {"restaurant_id": restaurant_id, "date_id": date_id},
        ).first()
    else:
        menu_row = db.execute(
            text(
                """
                SELECT TOP 1 menu_id, CAST(0 AS BIT) AS includes_drink
                FROM dbo.fact_menus
                WHERE restaurant_id = :restaurant_id AND date_id = :date_id
                ORDER BY menu_id DESC
                """
            ),
            {"restaurant_id": restaurant_id, "date_id": date_id},
        ).first()

    if not menu_row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No hay menú publicado para hoy")

    menu_id = int(menu_row[0])
    includes_drink = bool(menu_row[1])

    items = db.execute(
        text(
            """
            SELECT d.course_type, d.dish_name
            FROM dbo.fact_menu_items fmi
            INNER JOIN dbo.dim_dishes d ON d.dish_id = fmi.dish_id
            WHERE fmi.menu_id = :menu_id
            ORDER BY d.course_type, d.dish_name
            """
        ),
        {"menu_id": menu_id},
    ).fetchall()

    grouped: dict[str, list[str]] = {
        "first_course": [],
        "second_course": [],
        "dessert": [],
    }
    grouped_seen: dict[str, set[str]] = {
        "first_course": set(),
        "second_course": set(),
        "dessert": set(),
    }
    for row in items:
        course_key = _canonical_course(str(row[0]))
        dish_label = " ".join(str(row[1]).strip().split())
        dish_key = _normalize_dish_name(dish_label)
        if dish_key in grouped_seen[course_key]:
            continue
        grouped_seen[course_key].add(dish_key)
        grouped[course_key].append(dish_label)

    restaurant = db.query(Restaurant).filter(Restaurant.restaurant_id == restaurant_id).first()

    return DailyMenuResponse(
        menu_id=menu_id,
        restaurant_id=restaurant_id,
        date=service_date,
        starter="; ".join(grouped["first_course"]) if grouped["first_course"] else None,
        main="; ".join(grouped["second_course"]) if grouped["second_course"] else None,
        dessert="; ".join(grouped["dessert"]) if grouped["dessert"] else None,
        includes_drink=includes_drink,
        menu_price=restaurant.menu_price if restaurant else None,
    )
=======
def _current_service_date() -> date:
    try:
        return datetime.now(ZoneInfo("Europe/Madrid")).date()
    except ZoneInfoNotFoundError:
        # Windows environments may miss IANA tz data if tzdata is not installed.
        logger.warning(
            "Europe/Madrid timezone not found; falling back to system local date. "
            "Install tzdata in the Python environment to restore IANA timezone support."
        )
        return datetime.now().date()
>>>>>>> lucian


def _ensure_prediction_engine_loaded() -> bool:
    global prediction_engine
    if prediction_engine is not None:
        return True
    try:
        prediction_engine = PredictionEngine()
        logger.info("✅ Motor de predicción inicializado (lazy)")
        return True
    except Exception as engine_error:
        logger.error("❌ No se pudo inicializar PredictionEngine: %s", str(engine_error), exc_info=True)
        return False


def _ensure_unified_menu_model_loaded(app: FastAPI) -> bool:
    if hasattr(app.state, "model") and app.state.model is not None:
        return True
    try:
        model_path = Path(__file__).parent.parent / "azca" / "artifacts" / "AzcaMenuModel.pkl"
        with open(model_path, "rb") as f:
            app.state.model = pickle.load(f)
        logger.info("✅ AzcaMenuModel.pkl cargado en app.state (lazy)")
        return True
    except Exception as model_error:
        logger.error("❌ Error cargando AzcaMenuModel.pkl (lazy): %s", str(model_error), exc_info=True)
        return False


# =============================
# ENDPOINTS PARA IMÁGENES DE RESTAURANTES
# =============================

@app.post("/upload-restaurant-image")
async def post_upload_restaurant_image(
    restaurant_id: int = Form(...),
    file: UploadFile = File(...),
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    """
    Upload restaurant image to Blob Storage (container: fotos)
    
    - Admin: puede subir fotos para cualquier restaurante
    - Restaurant owner: puede subir fotos solo para su propio restaurante
    """
    payload = _require_auth(authorization)
    role = payload.get("role")
    user_restaurant_id = payload.get("restaurant_id")
    
    # Validar permisos
    if role == "admin":
        # Admin puede subir para cualquier restaurante
        pass
    elif role == "restaurant_owner":
        # Restaurant owner solo puede subir para su propio restaurante
        if user_restaurant_id != restaurant_id:
            raise HTTPException(
                status_code=403, 
                detail="No tienes permisos para subir fotos a este restaurante"
            )
    else:
        raise HTTPException(status_code=403, detail="Rol no autorizado")
    
    restaurant = db.query(Restaurant).filter(Restaurant.restaurant_id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurante no encontrado")
    
    try:
        file_content = await file.read()
        if not file.content_type or "image" not in file.content_type:
            raise HTTPException(status_code=400, detail="Tipo de archivo inválido. Solo imágenes.")
        
        if len(file_content) > 5 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Archivo demasiado grande (máx 5MB)")
        
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        ext = Path(file.filename or "photo").suffix or ".jpg"
        blob_filename = f"photo_{timestamp}{ext}"
        
        blob_manager = get_blob_manager()
        blob_name = blob_manager.upload_restaurant_image(
            restaurant_id=restaurant_id,
            file_content=file_content,
            filename=blob_filename
        )
        
        if not blob_name:
            raise HTTPException(status_code=500, detail="Error en la carga del archivo")
        
        sas_url = blob_manager.get_blob_sas_url(blob_name)
        if not sas_url:
            raise HTTPException(status_code=500, detail="Error generando URL de acceso")
        
        restaurant.image_url = sas_url
        db.commit()
        db.refresh(restaurant)
        
        logger.info(f"✅ Foto subida para restaurante {restaurant_id}: {blob_name}")
        return {
            "success": True, 
            "image_url": sas_url, 
            "restaurant_id": restaurant_id,
            "message": "Foto subida exitosamente"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error subiendo imagen: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Error en la carga")


@app.get("/get-restaurant-image/{restaurant_id}")
async def get_rest_image(restaurant_id: int, db: Session = Depends(get_db)):
    """Get restaurant image URL"""
    restaurant = db.query(Restaurant).filter(Restaurant.restaurant_id == restaurant_id).first()
    
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    if restaurant.image_url:
        return {"image_url": restaurant.image_url, "is_default": False, "restaurant_id": restaurant_id}
    
    default_url = get_default_image_url(restaurant.cuisine_type)
    return {"image_url": default_url, "is_default": True, "restaurant_id": restaurant_id}


@app.post(
    "/restaurants/{restaurant_id}/photo-upload", 
    response_model=dict
)
async def upload_restaurant_photo(
    restaurant_id: int,
    file: UploadFile = File(...),
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    """Upload restaurant photo to Azure Blob Storage"""
    payload = _require_auth(authorization)
    if payload.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    
    restaurant = db.query(Restaurant).filter(Restaurant.restaurant_id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Restaurant not found")
    
    try:
        file_content = await file.read()
        allowed_types = {"image/jpeg", "image/png", "image/webp", "image/gif"}
        if file.content_type not in allowed_types:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid file type")
        
        if len(file_content) > 5 * 1024 * 1024:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File too large")
        
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        ext = Path(file.filename or "photo").suffix or ".jpg"
        blob_filename = f"photo_{timestamp}{ext}"
        
        blob_manager = get_blob_manager()
        blob_name = blob_manager.upload_restaurant_image(
            restaurant_id=restaurant_id,
            file_content=file_content,
            filename=blob_filename
        )
        
        if not blob_name:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Upload failed")
        
        sas_url = blob_manager.get_blob_sas_url(blob_name)
        if not sas_url:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="SAS URL failed")
        
        restaurant.image_url = sas_url
        db.commit()
        db.refresh(restaurant)
        
        logger.info(f"✅ Image uploaded for restaurant {restaurant_id}: {blob_name}")
        return {
            "success": True,
            "restaurant_id": restaurant_id,
            "image_url": sas_url,
            "message": "Image uploaded successfully"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading photo: {str(e)}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Upload error")



@app.patch(
    "/restaurants/{restaurant_id}/image",
    response_model=RestaurantDetailItem,
    summary="Actualizar imagen del restaurante (legacy)",
    tags=["Data"],
    deprecated=True,
)
async def update_restaurant_image(
    restaurant_id: int,
    request: RestaurantImageUpdateRequest,
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    """
    [DEPRECATED] Usa POST /restaurants/{restaurant_id}/image/upload
    
    Actualiza la URL de imagen del restaurante.
    Mantener por compatibilidad con versiones antiguas.
    """
    payload = _require_auth(authorization)
    if payload.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No autorizado.")

    restaurant = db.query(Restaurant).filter(Restaurant.restaurant_id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Restaurante no encontrado.")

    restaurant.image_url = request.image_url.strip()
    db.commit()
    db.refresh(restaurant)
    return RestaurantDetailItem.from_orm(restaurant)



# ============================================================================
# FUNCIONES AUXILIARES PARA CÁLCULO AUTOMÁTICO
# ============================================================================

def get_weather_data(service_date: date) -> dict:
    """
    Recupera datos meteorológicos de Open-Meteo para Azca (Madrid).
    
    Open-Meteo es una API meteorológica gratuita sin necesidad de API key.
    Coordenadas de Azca Madrid (Bernabéu): 40.4532° N, -3.6885° W
    
    Args:
        service_date: Fecha para la cual se obtiene el clima (date object)
        
    Returns:
        dict: {
            'max_temp_c': float (temperatura máxima en C),
            'precipitation_mm': float (precipitación en mm),
            'is_rain_service_peak': bool (si llueve en horas pico 12-20)
        }
    """
    cache = getattr(app.state, "cache", None) if hasattr(app, "state") else None
    if cache:
        cached = cache.get_weather(service_date)
        if cached is not None:
            return cached

    # Coordenadas de Azca (Madrid, al lado del Bernabéu)
    latitude = 40.4532
    longitude = -3.6885
    
    # URL de Open-Meteo
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "start_date": service_date.strftime('%Y-%m-%d'),
        "end_date": service_date.strftime('%Y-%m-%d'),
        "daily": "temperature_2m_max,precipitation_sum",
        "hourly": "precipitation",
        "timezone": "auto",
    }
    
    try:
        response = requests.get(url, params=params, timeout=5)
        response.raise_for_status()
        data = response.json()
        
        # Extraer datos diarios
        max_temp = 20.0
        precipitation = 0.0
        
        if "daily" in data and len(data["daily"]["time"]) > 0:
            max_temp = data["daily"]["temperature_2m_max"][0] or 20.0
            precipitation = data["daily"]["precipitation_sum"][0] or 0.0
        
        # Determinar si llueve en hora pico (12:00-20:00)
        is_rain_peak = False
        if "hourly" in data and "precipitation" in data["hourly"]:
            hourly_times = data["hourly"]["time"]
            hourly_precip = data["hourly"]["precipitation"]
            
            # Buscar índices para horas 12-20 del día solicitado
            peak_hours_rain = sum(
                1 for i, t in enumerate(hourly_times)
                if service_date.strftime('%Y-%m-%d') in t and 
                   12 <= int(t.split('T')[1].split(':')[0]) < 20 and
                   hourly_precip[i] > 0
            )
            is_rain_peak = peak_hours_rain > 0
        
        result = {
            'max_temp_c': float(max_temp),
            'precipitation_mm': float(precipitation),
            'is_rain_service_peak': is_rain_peak,
        }
        if cache:
            cache.set_weather(service_date, result)
        return result
        
    except requests.exceptions.RequestException as e:
        logger.warning(f"⚠️  Open-Meteo no disponible: {str(e)[:50]}, usando valores por defecto")
        fallback = {
            'max_temp_c': 20.0,
            'precipitation_mm': 0.0,
            'is_rain_service_peak': False,
        }
        if cache:
            cache.set_weather(service_date, fallback)
        return fallback


def get_services_data(db: Session, restaurant_id: int, service_date: date, capacity_limit: int) -> dict:
    """
    Recupera services_lag_7 y avg_4_weeks desde fact_services.
    
    Si la fecha exacta no existe (ej: fechas futuras), busca el registro más reciente
    para ese restaurante. Si no hay registros, usa valores por defecto (70% capacidad).
    
    Args:
        db: Sesión de base de datos
        restaurant_id: ID del restaurante
        service_date: Fecha del servicio (date object)
        capacity_limit: Capacidad del restaurante (para cálculo de fallback)
        
    Returns:
        dict: {'services_lag_7': float, 'avg_4_weeks': float}
    """
    # Convertir fecha YYYY-MM-DD a YYYYMMDD (formato date_id)
    date_id = int(service_date.strftime('%Y%m%d'))
    
    # 1. Intentar buscar el registro exacto
    fact_record = db.query(FactServices).filter(
        FactServices.date_id == date_id,
        FactServices.restaurant_id == restaurant_id
    ).first()
    
    if fact_record:
        return {
            'services_lag_7': fact_record.services_lag_7 or 0.0,
            'avg_4_weeks': fact_record.avg_4_weeks or 0.0,
        }
    
    # 2. Si no existe, buscar el registro más reciente
    recent_record = db.query(FactServices).filter(
        FactServices.restaurant_id == restaurant_id
    ).order_by(desc(FactServices.date_id)).first()
    
    if recent_record:
        return {
            'services_lag_7': recent_record.services_lag_7 or 0.0,
            'avg_4_weeks': recent_record.avg_4_weeks or 0.0,
        }
    
    # 3. Fallback: calcular valores por defecto (70% de capacidad)
    default_services = float(capacity_limit) * 0.7
    return {
        'services_lag_7': default_services,
        'avg_4_weeks': default_services,
    }


def calculate_calendar_features(service_date: date) -> dict:
    """
    Calcula automáticamente los parámetros de calendario basados en la fecha.
    Usa la librería 'holidays' para festivos españoles en Madrid (Azca location).
    
    Args:
        service_date: Fecha del servicio (date object)
        
    Returns:
        dict: {
            'is_business_day': bool (lunes-viernes),
            'is_holiday': bool (festivos en Madrid),
            'is_bridge_day': bool (puente festivo),
            'is_payday_week': bool (semana de pago)
        }
    """
    cache = getattr(app.state, "cache", None) if hasattr(app, "state") else None
    if cache:
        cached = cache.get_calendar(service_date)
        if cached is not None:
            return cached

    # Inicializar calendario de festivos españoles (subdivisión Madrid)
    es_holidays = holidays.Spain(subdiv='MD')
    
    weekday = service_date.weekday()  # 0=lunes, 6=domingo
    
    # 1. is_business_day: lunes(0) a viernes(4)
    is_business_day = weekday < 5
    
    # 2. is_holiday: está en el calendario de festivos de Madrid
    is_holiday = service_date in es_holidays
    
    # 3. is_bridge_day: es un día entre festivo y fin de semana
    # (ejm: viernes después de festivo, o lunes antes de festivo)
    is_bridge_day = False
    from datetime import timedelta
    
    if weekday == 4:  # Viernes
        prev_day = service_date - timedelta(days=1)
        if prev_day in es_holidays:
            is_bridge_day = True
    elif weekday == 0:  # Lunes
        next_day = service_date + timedelta(days=1)
        if next_day in es_holidays:
            is_bridge_day = True
    
    # 4. is_payday_week: últimos días del mes (25-31)
    # Típicamente entre 25-31 del mes
    day_of_month = service_date.day
    is_payday_week = 25 <= day_of_month <= 31
    
    result = {
        'is_business_day': is_business_day,
        'is_holiday': is_holiday,
        'is_bridge_day': is_bridge_day,
        'is_payday_week': is_payday_week,
    }
    if cache:
        cache.set_calendar(service_date, result)
    return result


def _get_total_course_count(db: Session, restaurant_id: int, course_column, fallback: int = 30) -> int:
    """
    Calcula el total histórico de platos servidos por tipo de curso para un restaurante.

    Prioridad:
    1) Conteo en Menus_Azca del curso indicado (no nulo y no vacío).
    2) avg_4_weeks más reciente en fact_services.
    3) 70% de capacidad del restaurante.
    4) Fallback fijo.
    """
    total = (
        db.query(func.count())
        .select_from(MenusAzca)
        .filter(
            MenusAzca.restaurant_id == restaurant_id,
            course_column.isnot(None),
            func.length(func.trim(course_column)) > 0,
        )
        .scalar()
    )

    if total and total > 0:
        return int(total)

    recent_record = (
        db.query(FactServices)
        .filter(FactServices.restaurant_id == restaurant_id)
        .order_by(desc(FactServices.date_id))
        .first()
    )
    if recent_record and recent_record.avg_4_weeks and recent_record.avg_4_weeks > 0:
        return max(1, int(round(float(recent_record.avg_4_weeks))))

    restaurant = db.query(Restaurant).filter(Restaurant.restaurant_id == restaurant_id).first()
    if restaurant and restaurant.capacity_limit and restaurant.capacity_limit > 0:
        return max(1, int(round(float(restaurant.capacity_limit) * 0.7)))

    return fallback


<<<<<<< HEAD
def save_prediction_log(
    db: Session,
    restaurant_id: int,
    prediction_domain: str,
    input_context: dict,
    output_results: list,
    model_version: str,
    latency_ms: int,
) -> int:
=======
def get_restaurant_historical_dish_ids(
    db: Session,
    restaurant_id: int,
    course_type: str,
) -> list[int]:
    """Obtiene los dish_id históricos de un restaurante para un tipo de curso."""
    dish_ids = (
        db.query(distinct(DimDishes.dish_id))
        .join(FactMenuItems, DimDishes.dish_id == FactMenuItems.dish_id)
        .join(FactMenus, FactMenuItems.menu_id == FactMenus.menu_id)
        .filter(
            FactMenus.restaurant_id == restaurant_id,
            DimDishes.course_type == course_type,
        )
        .all()
    )

    return [int(dish_id) for (dish_id,) in dish_ids if dish_id is not None]


def get_total_starters(db: Session, restaurant_id: int) -> int:
    """Obtiene total histórico de entrantes para estimar counts por score."""
    return _get_total_course_count(db, restaurant_id, MenusAzca.first_course)


def get_total_mains(db: Session, restaurant_id: int) -> int:
    """Obtiene total histórico de platos principales para estimar counts por score."""
    return _get_total_course_count(db, restaurant_id, MenusAzca.second_course)


def get_total_desserts(db: Session, restaurant_id: int) -> int:
    """Obtiene total histórico de postres para estimar counts por score."""
    return _get_total_course_count(db, restaurant_id, MenusAzca.dessert)


def resolve_dish_id(db: Session, dish_name: str | None) -> int | None:
    """Busca un Dish ID en dim_dishes a partir de su nombre.

    Devuelve None si no se encuentra.
>>>>>>> lucian
    """
    if not dish_name:
        return None
    dish = (
        db.query(DimDish)
        .filter(func.lower(DimDish.dish_name) == str(dish_name).strip().lower())
        .first()
    )
    return dish.dish_id if dish else None


def predict_top3_dishes(model, features_dict: dict) -> list:
    """
    Obtiene el top 3 de platos predichos usando el modelo cargado en memoria.
    
    Args:
        model: Modelo pickle cargado (sklearn Pipeline con predict_proba)
        features_dict: Diccionario con los 15 features
        
    Returns:
        Lista de tuples [(dish_id, probability), ...]  para el top 3
    """
    import pandas as pd
    import numpy as np
    
    # Construir DataFrame con una sola fila (los 15 features)
    df = pd.DataFrame([features_dict])
    
    logger.info(f"🔨 Construyendo predicción con modelo...")
    logger.info(f"   Features shape: {df.shape}")
    logger.info(f"   Columns: {list(df.columns)}")
    
    # Obtener probabilidades de todas las clases
    proba = model.predict_proba(df)  # Shape: (1, num_clases)
    
    logger.info(f"✅ predict_proba() retornó probabilidades de shape {proba.shape}")
    
    # Obtener las clases del modelo
    classes = model.classes_
    logger.info(f"📝 Clases disponibles: {len(classes)} | Primeras 5: {classes[:5] if len(classes) > 5 else classes}")
    
    # Obtener probabilities de la primera fila
    probabilities = proba[0]
    
    # Obtener indices de top 3 probabilidades
    top3_indices = np.argsort(probabilities)[-3:][::-1]  # Orden descendente
    logger.info(f"✅ Top 3 indices: {top3_indices}")
    
    # Retornar [(class_id, probability), ...]
    top3_predictions = [
        (classes[idx], probabilities[idx])
        for idx in top3_indices
    ]
    
    logger.info(f"✅ Top 3 predicciones: {top3_predictions}")
    
    return top3_predictions


def resolve_dish_name(db: Session, dish_identifier: str | int | None) -> str | None:
    """Convierte un ID de plato (int/str) en su nombre si existe en dim_dishes."""
    if dish_identifier is None:
        return None
    try:
        dish_id = int(dish_identifier)
    except Exception:
        return str(dish_identifier)

    dish = db.query(DimDish).filter(DimDish.dish_id == dish_id).first()
    return dish.dish_name if dish else str(dish_identifier)


def extract_menu_text_with_default_ocr(file_bytes: bytes, content_type: str | None = None) -> tuple[str, str]:
    """
    Extrae texto del documento usando Azure Document Intelligence por defecto.

    Variables de entorno requeridas:
    - AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT
    - AZURE_DOCUMENT_INTELLIGENCE_KEY
    - AZURE_DOCUMENT_INTELLIGENCE_MODEL_ID (opcional, default prebuilt-layout)
    """
    endpoint = os.getenv("AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT", "").strip()
    key = os.getenv("AZURE_DOCUMENT_INTELLIGENCE_KEY", "").strip()
    model_id = os.getenv("AZURE_DOCUMENT_INTELLIGENCE_MODEL_ID", "prebuilt-layout").strip()

    if not endpoint or not key:
        raise RuntimeError(
            "Faltan AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT o AZURE_DOCUMENT_INTELLIGENCE_KEY."
        )

    ocr = DocumentIntelligenceOCR(endpoint=endpoint, key=key, model_id=model_id)
    extracted_text = ocr.extract_text(file_bytes=file_bytes, content_type=content_type)

    if not extracted_text:
        raise RuntimeError("Document Intelligence no devolvió texto extraíble.")

    return extracted_text, "azure_document_intelligence"


def to_ranked_dishes(
    items: list[tuple[str, float]],
    db: Session | None = None,
) -> list[OCRPredictedDish]:
    """Convierte lista [(name, score)] en objetos tipados con ranking.

    Si se pasa `db`, intentará resolver IDs numéricos a nombres en dim_dishes.
    """
    ranked: list[OCRPredictedDish] = []
    for index, (name, score) in enumerate(items[:3]):
        resolved_name = name
        if db is not None:
            resolved = resolve_dish_name(db, name)
            if resolved:
                resolved_name = resolved

        ranked.append(OCRPredictedDish(rank=index + 1, name=resolved_name, score=float(score)))

    return ranked


def build_extracted_menu(sections) -> OCRExtractedMenu:
    """Convierte la salida del extractor en el modelo de respuesta estándar."""
    return OCRExtractedMenu(
        starter=sections.starter,
        main=sections.main,
        dessert=sections.dessert,
        starter_options=sections.starter_options,
        main_options=sections.main_options,
        dessert_options=sections.dessert_options,
        detected_lines=sections.detected_lines,
    )


def persist_extracted_dishes(db: Session, sections) -> int:
    """
    Persiste los platos extraídos por OCR en dim_dishes.

    course_type usa los valores: first_course, second_course, dessert.
    """
    grouped_dishes = {
        "first_course": sections.starter_options,
        "second_course": sections.main_options,
        "dessert": sections.dessert_options,
    }

    inserted = 0
    seen: set[tuple[str, str]] = set()

    try:
        for course_type, dishes in grouped_dishes.items():
            existing_dishes = db.execute(
                text(
                    """
                    SELECT dish_id, dish_name
                    FROM dbo.dim_dishes
                    WHERE course_type = :course_type
                    """
                ),
                {"course_type": course_type},
            ).fetchall()

            existing_index: set[str] = set()
            for row in existing_dishes:
                existing_name = str(row[1] or "")
                existing_key = _normalize_dish_name(existing_name)
                if existing_key:
                    existing_index.add(existing_key)

            for dish_name in dishes:
                cleaned_name = " ".join((dish_name or "").strip().split())
                if not cleaned_name:
                    continue

                normalized_key = _normalize_dish_name(cleaned_name)
                dedupe_key = (course_type, normalized_key)
                if dedupe_key in seen:
                    continue
                seen.add(dedupe_key)

                if normalized_key in existing_index:
                    continue

                db.add(DimDish(course_type=course_type, dish_name=cleaned_name))
                existing_index.add(normalized_key)
                inserted += 1

        if inserted > 0:
            db.commit()
        else:
            db.flush()

        return inserted

    except Exception:
        db.rollback()
        raise


@app.post(
    "/ocr/menu-sections",
    response_model=MenuOCRSectionsResponse,
    summary="Subir menú y ver solo detección OCR por secciones",
    tags=["Predictions"],
    status_code=status.HTTP_200_OK,
)
async def extract_menu_sections_ocr_only(
    menu_file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    Flujo OCR puro (sin predicción ML):
    1) OCR con Azure Document Intelligence.
    2) Parser para detectar entrante, principal y postre.

    Request multipart/form-data:
    - menu_file: archivo (PDF/JPG/PNG, etc.)
    """
    try:
        file_bytes = await menu_file.read()
        if not file_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El archivo de menú está vacío.",
            )

        raw_text, ocr_provider = extract_menu_text_with_default_ocr(
            file_bytes=file_bytes,
            content_type=menu_file.content_type,
        )
        sections = MenuSectionExtractor.extract(raw_text)
        persist_extracted_dishes(db, sections)

        return MenuOCRSectionsResponse(
            ocr_provider=ocr_provider,
            extracted_menu=build_extracted_menu(sections),
            raw_text=raw_text,
            execution_timestamp=datetime.now(),
        )

    except HTTPException:
        raise
    except RuntimeError as runtime_error:
        logger.error(f"OCR no disponible: {runtime_error}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(runtime_error),
        )
    except Exception as exc:
        logger.error(f"Error en /ocr/menu-sections: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno al procesar OCR del menú.",
        )


@app.post(
    "/restaurants/{restaurant_id}/menu-upload",
    response_model=dict,
    tags=["Restaurantes"],
    summary="Subir menú del restaurante (OCR automático)",
)
async def upload_restaurant_menu(
    restaurant_id: int,
    menu_file: UploadFile = File(...),
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    """
    Sube un menú para un restaurante específico y extrae sus platos con OCR.
    Solo el dueño del restaurante o un administrador puede realizar esta acción.
    """
    payload = _require_auth(authorization)
    role = payload.get("role")
    user_restaurant_id = payload.get("restaurant_id")
    
    # Validar permisos
    if role == "restaurant_owner" and user_restaurant_id != restaurant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="No tienes permisos para subir el menú a este restaurante"
        )
    elif role not in ("admin", "restaurant_owner"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Rol no autorizado")
        
    restaurant = db.query(Restaurant).filter(Restaurant.restaurant_id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Restaurante no encontrado")

    try:
        file_bytes = await menu_file.read()
        if not file_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El archivo de menú está vacío.",
            )

        raw_text, ocr_provider = extract_menu_text_with_default_ocr(
            file_bytes=file_bytes,
            content_type=menu_file.content_type,
        )
        sections = MenuSectionExtractor.extract(raw_text)
        
        # Opcional: Persistir los platos extraídos
        persist_extracted_dishes(db, sections)
        
        # Crear un registro en MenusAzca para hoy y el restaurante
        today = datetime.now().date()
        
        starter = next((s[0] for s in sections.get("starter", []) if s), None)
        main = next((s[0] for s in sections.get("main", []) if s), None)
        dessert = next((s[0] for s in sections.get("dessert", []) if s), None)
        
        # Check if already exists (simplificado para el ejemplo)
        # Podrías querer almacenar un DailyMenu (nuevo modelo) o algo similar
        # para mapear correctamente esto, pero te devuelvo los detalles para que
        # al menos el front end lo reciba.
        
        extracted_menu_data = build_extracted_menu(sections)

        return {
            "success": True,
            "restaurant_id": restaurant_id,
            "message": "Menú procesado exitosamente por OCR.",
            "ocr_provider": ocr_provider,
            "extracted_menu": extracted_menu_data.dict()
        }

    except HTTPException:
        raise
    except RuntimeError as runtime_error:
        logger.error(f"OCR no disponible: {runtime_error}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(runtime_error),
        )
    except Exception as exc:
        logger.error(f"Error procesando menú para restaurante {restaurant_id}: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno al procesar OCR del menú.",
        )


@app.post(
    "/predict",
    response_model=PredictionResponse,
    summary="Realizar Predicción",
    tags=["Predictions"],
    status_code=status.HTTP_201_CREATED,
)
async def create_prediction(
    request: PredictionRequest,
    db: Session = Depends(get_db),
):
    """
    Realiza una predicción de demanda de servicios.

    **Flujo:**
    1. Valida los parámetros de entrada (Pydantic)
    2. Llama al motor de IA (PredictionEngine)
    3. Guarda el resultado en auditoría (Azure SQL)
    4. Retorna la predicción

    **Parámetros en el body JSON:**
    - `service_date`: Fecha para la cual se predice (YYYY-MM-DD)
    - `max_temp_c`: Temperatura máxima en Celsius
    - `precipitation_mm`: Precipitación en milímetros
    - `is_stadium_event`: ¿Hay evento en estadio?
    - `is_payday_week`: ¿Es semana de cobro?

    Args:
        request: Objeto PredictionRequest con los parámetros
        db: Sesión de base de datos (inyectada por FastAPI)

    Returns:
        PredictionResponse: Predicción y metadatos

    Raises:
        HTTPException: Si hay error en la predicción
    """
    global prediction_engine

    # Validación: Motor cargado
    if not _ensure_prediction_engine_loaded():
        logger.error("Motor de predicción no inicializado")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Motor de predicción no disponible. Reinicia la API.",
        )

    try:
        # Calcular automáticamente parámetros de calendario
        calendar_features = calculate_calendar_features(request.service_date)
        
        # Recuperar datos históricos de fact_services
        # (services_lag_7 y avg_4_weeks desde la BD, con fallback a 70% capacidad)
        services_data = get_services_data(
            db=db,
            restaurant_id=request.restaurant_id,
            service_date=request.service_date,
            capacity_limit=request.capacity_limit
        )
        
        # Recuperar datos meteorológicos desde Open-Meteo
        weather_data = get_weather_data(request.service_date)
        
        # Preparar datos para el motor (combinando request + cálculos automáticos)
        input_data = {
            "service_date": request.service_date,
            "restaurant_id": request.restaurant_id,
            "max_temp_c": weather_data['max_temp_c'],  # DESDE Open-Meteo
            "precipitation_mm": weather_data['precipitation_mm'],  # DESDE Open-Meteo
            "is_rain_service_peak": weather_data['is_rain_service_peak'],  # DESDE Open-Meteo
            "is_stadium_event": request.is_stadium_event,
            "is_azca_event": request.is_azca_event,
            "is_holiday": calendar_features['is_holiday'],  # CALCULADO
            "is_bridge_day": calendar_features['is_bridge_day'],  # CALCULADO
            "is_payday_week": calendar_features['is_payday_week'],  # CALCULADO
            "is_business_day": calendar_features['is_business_day'],  # CALCULADO
            "services_lag_7": services_data['services_lag_7'],  # DESDE fact_services
            "avg_4_weeks": services_data['avg_4_weeks'],  # DESDE fact_services
            "capacity_limit": request.capacity_limit,
            "table_count": request.table_count,
            "min_service_duration": request.min_service_duration,
            "terrace_setup_type": request.terrace_setup_type,
            "opens_weekends": request.opens_weekends,
            "has_wifi": request.has_wifi,
            "restaurant_segment": request.restaurant_segment,
            "menu_price": request.menu_price,
            "dist_office_towers": request.dist_office_towers,
            "google_rating": request.google_rating,
            "cuisine_type": request.cuisine_type,
        }

        # LOG: Entrada de predicción
        logger.info("="*80)
        logger.info(f"📍 POST /predict - Solicitud recibida")
        logger.info("="*80)
        logger.info(f"🎯 Input: restaurante_id={request.restaurant_id}, fecha={request.service_date}")
        logger.info(f"   Eventos: stadium={request.is_stadium_event}, azca={request.is_azca_event}")
        logger.info(f"📊 Parámetros automáticos:")
        logger.info(f"   Clima: temp={weather_data['max_temp_c']}°C, precip={weather_data['precipitation_mm']:.1f}mm")
        logger.info(f"   Calendario: business_day={calendar_features['is_business_day']}, holiday={calendar_features['is_holiday']}, payday={calendar_features['is_payday_week']}")
        logger.info(f"   Histórico: lag_7={services_data['services_lag_7']}, avg_4w={services_data['avg_4_weeks']}")
        logger.info("="*80)

        # Llamar al motor de IA
        try:
            prediction_result = prediction_engine.predict("azca-services-model", input_data)
        except Exception as engine_error:
            logger.error("Error real en motor de servicios", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=(
                    "Error en motor de prediccion de servicios. "
                    f"Detalle: {type(engine_error).__name__}: {str(engine_error)[:220]}"
                ),
            ) from engine_error

        # Crear registro de auditoría
        prediction_log = PredictionLog(
            service_date=request.service_date,
            max_temp_c=request.max_temp_c,
            precipitation_mm=request.precipitation_mm,
            is_stadium_event=request.is_stadium_event,
            is_payday_week=request.is_payday_week,
            prediction_result=prediction_result,
            model_version="v1_xgboost",
            full_input_json=json.dumps(input_data, default=str),
        )

        # Guardar en base de datos
        try:
            db.add(prediction_log)
            db.commit()
            db.refresh(prediction_log)
            logger.info(
                f"✅ Predicción guardada (ID: {prediction_log.id}, "
                f"Resultado: {prediction_result})"
            )
        except Exception as db_error:
            logger.warning(f"⚠️  No se guardó en BD (normal si no está configurada): {str(db_error)[:100]}")
            db.rollback()
            # Crear un log simulado con ID ficticio para respuesta
            prediction_log.id = -1
            prediction_log.execution_timestamp = datetime.now()

        # Retornar respuesta
        return PredictionResponse(
            prediction_result=prediction_result,
            service_date=request.service_date,
            model_version="v1_xgboost",
            execution_timestamp=prediction_log.execution_timestamp or datetime.now(),
            log_id=prediction_log.id,
        )

    except ValueError as ve:
        logger.error(f"Error de validación: {str(ve)}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Error en los datos: {str(ve)}",
        )

    except Exception as e:
        logger.error(f"Error durante la predicción: {str(e)}", exc_info=True)
        try:
            db.rollback()
        except:
            pass
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno al procesar la predicción",
        )


@app.post(
    "/predict/starter",
    response_model=StarterPredictionResponse,
    summary="Predecir Platos de Entrada",
    tags=["Predictions"],
    status_code=status.HTTP_201_CREATED,
)
async def predict_starter(
    request: StarterPredictionRequest,
    db: Session = Depends(get_db),
):
    """
    Predice los top 3 platos de entrada (starters) más probables para un restaurante en una fecha.
    
    Inputs del usuario (mínimos):
    - restaurant_id: ID del restaurante
    - service_date: Fecha del servicio
    
    Parámetros auto-calculados (backend):
    - day_of_week, month: Del service_date
    - max_temp_c: De Open-Meteo API (Azca/Bernabéu)
    - is_holiday, is_business_day: Del calendario español
    - cuisine_type, restaurant_segment: De dim_restaurants BD
    
    Returns:
        StarterPredictionResponse: Top 3 starters con scores de probabilidad
    """
<<<<<<< HEAD
    # Acceder al modelo desde app.state (cargado en lifespan o lazy)
    if not _ensure_unified_menu_model_loaded(http_request.app):
        logger.error("Modelo no cargado en app.state")
=======
    global prediction_engine

    model = None
    if _ensure_unified_menu_model_loaded(app):
        model = app.state.model
    elif not _ensure_prediction_engine_loaded():
        logger.error("Motor de predicción no inicializado")
>>>>>>> lucian
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Motor de predicción no disponible. Reinicia la API.",
        )

    try:
        # 1. Obtener detalles del restaurante
        restaurant = db.query(Restaurant).filter(
            Restaurant.restaurant_id == request.restaurant_id
        ).first()
        
        if not restaurant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Restaurante con ID {request.restaurant_id} no encontrado"
            )

        # 2. Calcular automaticamente
        weather_data = get_weather_data(request.service_date)
        calendar_features = calculate_calendar_features(request.service_date)
        
        # Extraer day_of_week (0=Monday) y month (1-12)
        day_of_week = request.service_date.weekday()
        month = request.service_date.month
        
        # 3. Preparar input para modelo de starters (9 features exactas en orden)
        starter_input = {
            "day_of_week": day_of_week,
            "month": month,
            "max_temp_c": weather_data['max_temp_c'],
            "is_holiday": calendar_features['is_holiday'],
            "is_business_day": calendar_features['is_business_day'],
            "restaurant_id": request.restaurant_id,
            "cuisine_type": restaurant.cuisine_type,
            "restaurant_segment": restaurant.restaurant_segment,
            "category": "starter",
        }
        
        # Log de entrada (para debugging)
        logger.info("="*80)
        logger.info(f"📍 POST /predict/starter - Solicitud recibida")
        logger.info("="*80)
        logger.info(f"🎯 Input: restaurante_id={request.restaurant_id}, fecha={request.service_date}")
        logger.info(f"📊 Parámetros auto-calculados:")
        logger.info(f"   Clima: temp={weather_data['max_temp_c']}°C")
        logger.info(f"   Calendario: business_day={calendar_features['is_business_day']}, holiday={calendar_features['is_holiday']}")
        logger.info(f"   Restaurante: {restaurant.name} ({restaurant.cuisine_type})")
        logger.info("="*80)
        
<<<<<<< HEAD
        # 5. Llamar al modelo cargado en memoria para obtener top 3 predicciones
        try:
            top_dishes = predict_top3_dishes(http_request.app.state.model, starter_input)
        except Exception as pred_error:
            logger.error(f"❌ Error durante predict_top3_dishes: {str(pred_error)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al procesar predicción: {str(pred_error)}",
            )
=======
        top_dishes = None
        if model is not None:
            try:
                top_dishes = predict_top3_dishes(
                    model,
                    starter_input,
                    allowed_dish_ids=allowed_dish_ids,
                )
            except Exception as pred_error:
                logger.warning(
                    f"⚠️ Falló modelo unificado para starters, usando motor clásico: {pred_error}",
                    exc_info=True,
                )

        if top_dishes is None:
            prediction = prediction_engine.predict_menu("azca-menus-model", starter_input)
            if not isinstance(prediction, (list, tuple)) or len(prediction) < 3:
                logger.error(f"Modelo devolvió formato inválido: {type(prediction)} - {prediction}")
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"Modelo retornó resultado inválido (esperaba lista de 3+ items): {prediction}",
                )
            top_dishes = list(prediction)
>>>>>>> lucian
        
        # 5. Obtener total de starters del restaurante para calcular counts estimados
        total_starters = get_total_starters(db, request.restaurant_id)
        logger.info(f"📊 Total de starters en el restaurante: {total_starters}")
        
        # Normalizar los scores del top 3 para que sumen 1, luego calcular counts
        scores = [dish[1] for dish in top_dishes[:3]]
        sum_scores = sum(scores)
        if sum_scores > 0:
            normalized_scores = [score / sum_scores for score in scores]
        else:
            normalized_scores = [1/3, 1/3, 1/3]  # Fallback si algo va mal
        
        # 5. Formatear respuesta (top 3 con rank y estimated_count normalizado)
        starter_dishes = [
            StarterDish(
                rank=i+1,
                name=str(resolve_dish_name(db, dish[0]) or dish[0]),
                score=normalized_scores[i],  # Score normalizado (0-1, suma a 1)
                estimated_count=round(normalized_scores[i] * total_starters)  # porcentaje normalizado * total
            )
            for i, dish in enumerate(top_dishes[:3])
        ]
        
        # 6. Retornar respuesta (NO guardar en BD)
        return StarterPredictionResponse(
            top_3_dishes=starter_dishes,
            service_date=request.service_date,
            restaurant_id=request.restaurant_id,
            model_version="azca_menu_starter_v2",
            execution_timestamp=datetime.now(),
        )

    except HTTPException:
        raise
    except ValueError as ve:
        logger.error(f"Error de validación: {str(ve)}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Error en los datos: {str(ve)}",
        )
    except Exception as e:
        logger.error(f"Error durante la predicción de starters: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno al procesar la predicción de starters",
        )


@app.post(
    "/predict/main",
    response_model=MainPredictionResponse,
    summary="Predecir Platos Principales",
    tags=["Predictions"],
    status_code=status.HTTP_201_CREATED,
)
async def predict_main(
    request: MainPredictionRequest,
    db: Session = Depends(get_db),
):
    """
    Predice los top 3 platos principales más probables para un restaurante en una fecha.
    Inputs del usuario (mínimos):
    - restaurant_id: ID del restaurante
    - service_date: Fecha del servicio
    
    Parámetros auto-calculados (backend):
    - day_of_week, month, max_temp_c, is_holiday, is_business_day, cuisine_type, restaurant_segment
    
    Returns:
        MainPredictionResponse: Top 3 platos principales con scores
    """
<<<<<<< HEAD
    # Acceder al modelo desde app.state (cargado en lifespan o lazy)
    if not _ensure_unified_menu_model_loaded(http_request.app):
        logger.error("Modelo no cargado en app.state")
=======
    global prediction_engine

    model = None
    if _ensure_unified_menu_model_loaded(app):
        model = app.state.model
    elif not _ensure_prediction_engine_loaded():
        logger.error("Motor de predicción no inicializado")
>>>>>>> lucian
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Motor de predicción no disponible. Reinicia la API.",
        )

    try:
        # 1. Obtener detalles del restaurante
        restaurant = db.query(Restaurant).filter(
            Restaurant.restaurant_id == request.restaurant_id
        ).first()
        
        if not restaurant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Restaurante con ID {request.restaurant_id} no encontrado"
            )

        # 2. Calcular automaticamente
        weather_data = get_weather_data(request.service_date)
        calendar_features = calculate_calendar_features(request.service_date)
        
        day_of_week = request.service_date.weekday()
        month = request.service_date.month
        
        # 3. Preparar input para modelo de platos principales (9 features exactas en orden)
        main_input = {
            "day_of_week": day_of_week,
            "month": month,
            "max_temp_c": weather_data['max_temp_c'],
            "is_holiday": calendar_features['is_holiday'],
            "is_business_day": calendar_features['is_business_day'],
            "restaurant_id": request.restaurant_id,
            "cuisine_type": restaurant.cuisine_type,
            "restaurant_segment": restaurant.restaurant_segment,
            "category": "main",
        }
        
        logger.info("="*80)
        logger.info(f"📍 POST /predict/main - Solicitud recibida")
        logger.info("="*80)
        logger.info(f"🎯 Input: restaurante_id={request.restaurant_id}, fecha={request.service_date}")
        logger.info(f"📊 Parámetros auto-calculados: temp={weather_data['max_temp_c']}°C, restaurante={restaurant.name}")
        logger.info("="*80)
        
<<<<<<< HEAD
        # 5. Llamar al modelo cargado en memoria para obtener top 3 predicciones
        try:
            top_dishes = predict_top3_dishes(http_request.app.state.model, main_input)
        except Exception as pred_error:
            logger.error(f"❌ Error durante predict_top3_dishes: {str(pred_error)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al procesar predicción: {str(pred_error)}",
            )
=======
        top_dishes = None
        if model is not None:
            try:
                top_dishes = predict_top3_dishes(
                    model,
                    main_input,
                    allowed_dish_ids=allowed_dish_ids,
                )
            except Exception as pred_error:
                logger.warning(
                    f"⚠️ Falló modelo unificado para principales, usando motor clásico: {pred_error}",
                    exc_info=True,
                )

        if top_dishes is None:
            prediction = prediction_engine.predict_menu("azca-menus-model", main_input)
            if not isinstance(prediction, (list, tuple)) or len(prediction) < 3:
                logger.error(f"Modelo devolvió formato inválido: {type(prediction)} - {prediction}")
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"Modelo retornó resultado inválido (esperaba lista de 3+ items): {prediction}",
                )
            top_dishes = list(prediction)
>>>>>>> lucian
        
        # 5. Obtener total de platos principales del restaurante para calcular counts estimados
        total_mains = get_total_mains(db, request.restaurant_id)
        logger.info(f"📊 Total de platos principales en el restaurante: {total_mains}")
        
        # Normalizar los scores del top 3 para que sumen 1, luego calcular counts
        scores = [dish[1] for dish in top_dishes[:3]]
        sum_scores = sum(scores)
        if sum_scores > 0:
            normalized_scores = [score / sum_scores for score in scores]
        else:
            normalized_scores = [1/3, 1/3, 1/3]  # Fallback si algo va mal
        
        # 5. Formatear respuesta
        main_dishes = [
            MainDish(
                rank=i+1,
                name=str(resolve_dish_name(db, dish[0]) or dish[0]),
                score=normalized_scores[i],  # Score normalizado (0-1, suma a 1)
                estimated_count=round(normalized_scores[i] * total_mains)  # porcentaje normalizado * total
            )
            for i, dish in enumerate(top_dishes[:3])
        ]
        
        # 6. Retornar respuesta (NO guardar en BD)
        return MainPredictionResponse(
            top_3_dishes=main_dishes,
            service_date=request.service_date,
            restaurant_id=request.restaurant_id,
            model_version="azca_menu_main_v2",
            execution_timestamp=datetime.now(),
        )

    except HTTPException:
        raise
    except ValueError as ve:
        logger.error(f"Error de validación: {str(ve)}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Error en los datos: {str(ve)}",
        )
    except Exception as e:
        logger.error(f"Error durante la predicción de platos principales: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno al procesar la predicción de platos principales",
        )


@app.post(
    "/predict/dessert",
    response_model=DessertPredictionResponse,
    summary="Predecir Postres",
    tags=["Predictions"],
    status_code=status.HTTP_201_CREATED,
)
async def predict_dessert(
    request: DessertPredictionRequest,
    db: Session = Depends(get_db),
):
    """
    Predice los top 3 postres más probables para un restaurante en una fecha.
    Inputs del usuario (mínimos):
    - restaurant_id: ID del restaurante
    - service_date: Fecha del servicio
    
    Parámetros auto-calculados (backend):
    - day_of_week, month, max_temp_c, is_holiday, is_business_day, cuisine_type, restaurant_segment
    
    Returns:
        DessertPredictionResponse: Top 3 postres con scores
    """
<<<<<<< HEAD
    # Acceder al modelo desde app.state (cargado en lifespan o lazy)
    if not _ensure_unified_menu_model_loaded(http_request.app):
        logger.error("Modelo no cargado en app.state")
=======
    global prediction_engine

    model = None
    if _ensure_unified_menu_model_loaded(app):
        model = app.state.model
    elif not _ensure_prediction_engine_loaded():
        logger.error("Motor de predicción no inicializado")
>>>>>>> lucian
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Motor de predicción no disponible. Reinicia la API.",
        )

    try:
        # 1. Obtener detalles del restaurante
        restaurant = db.query(Restaurant).filter(
            Restaurant.restaurant_id == request.restaurant_id
        ).first()
        
        if not restaurant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Restaurante con ID {request.restaurant_id} no encontrado"
            )

        # 2. Calcular automaticamente
        weather_data = get_weather_data(request.service_date)
        calendar_features = calculate_calendar_features(request.service_date)
        
        day_of_week = request.service_date.weekday()
        month = request.service_date.month
        
        # 3. Preparar input para modelo de postres (9 features exactas en orden)
        dessert_input = {
            "day_of_week": day_of_week,
            "month": month,
            "max_temp_c": weather_data['max_temp_c'],
            "is_holiday": calendar_features['is_holiday'],
            "is_business_day": calendar_features['is_business_day'],
            "restaurant_id": request.restaurant_id,
            "cuisine_type": restaurant.cuisine_type,
            "restaurant_segment": restaurant.restaurant_segment,
            "category": "dessert",
        }
        
        logger.info("="*80)
        logger.info(f"📍 POST /predict/dessert - Solicitud recibida")
        logger.info("="*80)
        logger.info(f"🎯 Input: restaurante_id={request.restaurant_id}, fecha={request.service_date}")
        logger.info(f"📊 Parámetros auto-calculados: temp={weather_data['max_temp_c']}°C, restaurante={restaurant.name}")
        logger.info("="*80)
        
<<<<<<< HEAD
        # 5. Llamar al modelo cargado en memoria para obtener top 3 predicciones
        try:
            top_dishes = predict_top3_dishes(http_request.app.state.model, dessert_input)
        except Exception as pred_error:
            logger.error(f"❌ Error durante predict_top3_dishes: {str(pred_error)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al procesar predicción: {str(pred_error)}",
            )
=======
        top_dishes = None
        if model is not None:
            try:
                top_dishes = predict_top3_dishes(
                    model,
                    dessert_input,
                    allowed_dish_ids=allowed_dish_ids,
                )
            except Exception as pred_error:
                logger.warning(
                    f"⚠️ Falló modelo unificado para postres, usando motor clásico: {pred_error}",
                    exc_info=True,
                )

        if top_dishes is None:
            prediction = prediction_engine.predict_menu("azca-menus-model", dessert_input)
            if not isinstance(prediction, (list, tuple)) or len(prediction) < 3:
                logger.error(f"Modelo devolvió formato inválido: {type(prediction)} - {prediction}")
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"Modelo retornó resultado inválido (esperaba lista de 3+ items): {prediction}",
                )
            top_dishes = list(prediction)
>>>>>>> lucian
        
        # 5. Obtener total de postres del restaurante para calcular counts estimados
        total_desserts = get_total_desserts(db, request.restaurant_id)
        logger.info(f"📊 Total de postres en el restaurante: {total_desserts}")
        
        # Normalizar los scores del top 3 para que sumen 1, luego calcular counts
        scores = [dish[1] for dish in top_dishes[:3]]
        sum_scores = sum(scores)
        if sum_scores > 0:
            normalized_scores = [score / sum_scores for score in scores]
        else:
            normalized_scores = [1/3, 1/3, 1/3]  # Fallback si algo va mal
        
        # 5. Formatear respuesta
        dessert_dishes = [
            DessertDish(
                rank=i+1,
                name=str(resolve_dish_name(db, dish[0]) or dish[0]),
                score=normalized_scores[i],  # Score normalizado (0-1, suma a 1)
                estimated_count=round(normalized_scores[i] * total_desserts)  # porcentaje normalizado * total
            )
            for i, dish in enumerate(top_dishes[:3])
        ]
        
        # 6. Retornar respuesta (NO guardar en BD)
        return DessertPredictionResponse(
            top_3_dishes=dessert_dishes,
            service_date=request.service_date,
            restaurant_id=request.restaurant_id,
            model_version="azca_menu_dessert_v2",
            execution_timestamp=datetime.now(),
        )

    except HTTPException:
        raise
    except ValueError as ve:
        logger.error(f"Error de validación: {str(ve)}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Error en los datos: {str(ve)}",
        )
    except Exception as e:
        logger.error(f"Error durante la predicción de postres: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno al procesar la predicción de postres",
        )


@app.post(
    "/predict/menu-upload",
    response_model=MenuUploadPredictionResponse,
    summary="Subir menú (OCR) y predecir platos",
    tags=["Predictions"],
    status_code=status.HTTP_201_CREATED,
)
async def predict_from_menu_upload(
    restaurant_id: int = Form(...),
    service_date: date = Form(...),
    menu_file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    Flujo por defecto:
    1) OCR con Azure Document Intelligence para extraer el menú subido.
    2) Parser para detectar entrante, principal y postre.
    3) Predicción ML top-3 por categoría en base al menú detectado.

    Request multipart/form-data:
    - restaurant_id: int
    - service_date: YYYY-MM-DD
    - menu_file: archivo (PDF/JPG/PNG, etc.)
    """
    global prediction_engine

    if prediction_engine is None:
        logger.error("Motor de predicción no inicializado")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Motor de predicción no disponible. Reinicia la API.",
        )

    restaurant = db.query(Restaurant).filter(Restaurant.restaurant_id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Restaurante con ID {restaurant_id} no encontrado",
        )

    try:
        file_bytes = await menu_file.read()
        if not file_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El archivo de menú está vacío.",
            )

        # OCR por defecto con Azure Document Intelligence
        raw_text, ocr_provider = extract_menu_text_with_default_ocr(
            file_bytes=file_bytes,
            content_type=menu_file.content_type,
        )

        # Detección de secciones del menú
        sections = MenuSectionExtractor.extract(raw_text)
        persist_extracted_dishes(db, sections)

        # Variables contextuales automáticas (similares al flujo actual)
        weather_data = get_weather_data(service_date)
        calendar_features = calculate_calendar_features(service_date)

        model_input_common = {
            "day_of_week": service_date.weekday(),
            "month": service_date.month,
            "max_temp_c": weather_data["max_temp_c"],
            "precipitation_mm": 0.0,
            "is_holiday": calendar_features["is_holiday"],
            "is_payday_week": calendar_features["is_payday_week"],
            "is_stadium_event": False,
            "is_azca_event": False,
            "restaurant_id": restaurant.restaurant_id,
            "menu_price": restaurant.menu_price or 15.0,
            "cuisine_type": restaurant.cuisine_type,
            "restaurant_segment": restaurant.restaurant_segment,
        }

        menu_predictor = MenuMLPredictor(
            prediction_engine.model_provider,
            dish_id_resolver=lambda name: resolve_dish_id(db, name),
        )
        predictions = menu_predictor.predict_from_menu(model_input_common, sections)

        return MenuUploadPredictionResponse(
            restaurant_id=restaurant_id,
            service_date=service_date,
            ocr_provider=ocr_provider,
            extracted_menu=build_extracted_menu(sections),
            starter_prediction=to_ranked_dishes(predictions["starter"], db=db),
            main_prediction=to_ranked_dishes(predictions["main"], db=db),
            dessert_prediction=to_ranked_dishes(predictions["dessert"], db=db),
            model_version="azca-menus-model",
            execution_timestamp=datetime.now(),
        )

    except HTTPException:
        raise
    except RuntimeError as runtime_error:
        logger.error(f"OCR no disponible: {runtime_error}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(runtime_error),
        )
    except Exception as exc:
        logger.error(f"Error en /predict/menu-upload: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno al procesar OCR y predicción del menú.",
        )


# ============================================================================
# RAÍZ (Para documentación)
# ============================================================================


@app.get(
    "/",
    tags=["Info"],
    summary="Información de la API",
)
async def root():
    """
    Endpoint raíz con información general de la API.

    Redirige a `/docs` para la documentación interactiva Swagger.
    """
    return {
        "name": "AZCA Prediction API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
        "prediction": "/predict",
    }


# ============================================================================
# EJECUCIÓN (Para desarrollo local)
# ============================================================================

if __name__ == "__main__":
    import uvicorn

    # Ejecutar con: python -m azca.api.main
    # o: uvicorn azca.api.main:app --reload
    uvicorn.run(
        "azca.api.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )
