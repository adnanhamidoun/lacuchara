"""
FastAPI REST API for service-demand predictions.

This module exposes prediction endpoints, integrating:
- PredictionEngine: AI engine for predictions
- SQLAlchemy + Azure SQL: Audit persistence

Endpoints:
    GET /health: API health check
    POST /predict: Run a prediction and store it
    GET /docs: Automatic documentation (Swagger)
"""

# ============================================================================
# LOAD .ENV AT STARTUP
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
import pickle
import unicodedata
import math
from difflib import SequenceMatcher
from contextlib import asynccontextmanager
from datetime import datetime, date, timedelta
from pathlib import Path
from typing import Any, Literal
from uuid import uuid4
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

import holidays
import requests
import pandas as pd
from fastapi import FastAPI, Depends, HTTPException, status, Request, UploadFile, File, Form, Query, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import Date, case, desc, distinct, func, or_, text
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
    MenusAzca,
    DailyMenu,
    FactMenuItems,
    FactMenus,
    RestaurantContext,
    FactPredictionLog,
    Inscripcion,
    User,
    RestaurantRating,
    DishRating,
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
    get_restaurant_image_url,
)

# Import PredictionEngine with fallback when unavailable
try:
    from ..core import PredictionEngine
    PREDICTION_ENGINE_AVAILABLE = True
except ImportError:
    PREDICTION_ENGINE_AVAILABLE = False
    # Mock for testing without heavy dependencies
    class PredictionEngine:
        def __init__(self, *args, **kwargs):
            pass
        def predict(self, model_name: str, data: dict) -> int:
            """Mock that returns a dummy prediction for testing"""
            return 150

# Import model scheduler (soft " requires Azure ML)
try:
    from ..core.scheduler import start_model_refresh_scheduler
    MODEL_SCHEDULER_AVAILABLE = True
except ImportError:
    MODEL_SCHEDULER_AVAILABLE = False

# ============================================================================
# LOGGING
# ============================================================================
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)
prediction_engine = None

DEFAULT_MENU_REGISTERED_MODEL = "azca-menus-model"
DEFAULT_MENU_MODEL_FILENAME = "azca-menus-model.pkl"
DEFAULT_SERVICES_REGISTERED_MODEL = "azca-services-model"

app = FastAPI(
    title="AZCA Prediction API",
    description=(
        "API REST para predictions de demanda de services con IA.\n\n"
        "Loads the model in memory at startup for maximum performance."
    ),
    version="1.0.0",
    contact={
        "name": "AZCA Project",
        "url": "https://github.com/your-org/azca",
    },
)

# ============================================================================
# PYDANTIC MODELS (For validation and Swagger documentation)
# ============================================================================


class PredictionRequest(BaseModel):
    """
    Request model for running a complete prediction.

    Contains all required parameters for the ML model:
    - Date and weather
    - Special events and calendar
    - Restaurant features
    - Operational data
    """

    # Date
    service_date: date = Field(
        ...,
        description="Date del service (YYYY-MM-DD)",
        example="2026-03-15",
    )
    
    # Identification
    restaurant_id: int = Field(
        ...,
        description="ID del restaurant",
        example=1,
        ge=1,
    )
    
    # Weather (AUTOMATICALLY FETCHED FROM OPEN-METEO)
    max_temp_c: float = Field(
        default=20.0,
        description="Maximum temperature in Celsius (automatically fetched from Open-Meteo if not provided)",
        example=28.5,
        ge=-50,
        le=60,
    )
    precipitation_mm: float = Field(
        default=0.0,
        description="Precipitation in millimeters (automatically fetched from Open-Meteo if not provided)",
        example=0.0,
        ge=0,
        le=500,
    )
    
    # Events and calendar
    is_rain_service_peak: bool = Field(
        default=False,
        description="Rain during peak service time? (automatically calculated from Open-Meteo if not provided)",
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
        description="Holiday? (automatically calculated if not provided)",
        example=False,
    )
    is_bridge_day: bool = Field(
        default=False,
        description="¿Es puente festivo? (automatically calculated if not provided)",
        example=False,
    )
    is_payday_week: bool = Field(
        default=False,
        description="¿Es semana de cobro? (automatically calculated if not provided)",
        example=True,
    )
    is_business_day: bool = Field(
        default=True,
        description="Business day? (automatically calculated if not provided)",
        example=True,
    )
    
    # Historical data
    services_lag_7: int = Field(
        default=0,
        description="Services 7 days ago (automatically loaded from fact_services if not provided)",
        example=120,
        ge=0,
    )
    avg_4_weeks: float = Field(
        default=0.0,
        description="Promedio latests 4 semanas (automatically loaded from fact_services if not provided)",
        example=125.5,
        ge=0,
    )
    
    # Restaurant features
    capacity_limit: int = Field(
        ...,
        description="Capacity limit",
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
        description="Minimum service duration (minutes)",
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
        description="Segmento del restaurant (e.g., casual, fine_dining)",
        example="casual",
    )
    menu_price: float = Field(
        ...,
        description="Average menu price",
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
        description="Google rating",
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
    Response model for a prediction.

    Returns prediction output along with metadata.
    """

    prediction_result: int = Field(
        ...,
        description="AI model prediction result (service count)",
        example=150,
    )
    service_date: date = Field(
        ...,
        description="Date predicha",
        example="2026-03-15",
    )
    model_version: str = Field(
        ...,
        description="Model version utilizado",
        example="v1_xgboost",
    )
    execution_timestamp: datetime = Field(
        ...,
        description="Prediction execution timestamp",
        example="2026-03-11T10:30:00",
    )
    log_id: int = Field(
        ...,
        description="Audit record ID in the database",
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
    Modelo para un dish de entrada (starter).
    Incluye nombre, score de prediction y count estimado.
    """
    rank: int = Field(..., description="Ranking (1=top)", example=1)
    name: str = Field(..., description="Dish name", example="Iberian ham")
    score: float = Field(..., description="Score de probabilidad (0-1)", example=0.85)
    estimated_count: int = Field(..., description="Estimated count of this dish in the restaurant", example=43)


class StarterPredictionRequest(BaseModel):
    """
    Request model to predict starter dishes.
    
    Minimum user inputs:
    - restaurant_id: ID del restaurant
    - service_date: Date del service
    
    All other parameters are auto-calculated.
    """
    restaurant_id: int = Field(
        ...,
        description="ID del restaurant",
        example=1,
        ge=1,
    )
    service_date: date = Field(
        ...,
        description="Date del service (YYYY-MM-DD)",
        example="2026-03-15",
    )


class StarterPredictionResponse(BaseModel):
    """
    Modelo de respuesta para prediction de starters.
    
    Returns top 3 most likely dishes with scores.
    """
    top_3_dishes: list[StarterDish] = Field(
        ...,
        description="Top 3 dishes de entrada ordenados por probabilidad",
        example=[
            {"rank": 1, "name": "Iberian Ham", "score": 0.85},
            {"rank": 2, "name": "Ham Croquettes", "score": 0.78},
            {"rank": 3, "name": "Creamed Asparagus", "score": 0.72},
        ],
    )
    service_date: date = Field(
        ...,
        description="Date predicha",
        example="2026-03-15",
    )
    restaurant_id: int = Field(
        ...,
        description="ID del restaurant",
        example=1,
    )
    model_version: str = Field(
        ...,
        description="Model version",
        example="azca_menu_starter_v2",
    )
    execution_timestamp: datetime = Field(
        ...,
        description="Execution timestamp",
        example="2026-03-14T10:30:00",
    )


class MainDish(BaseModel):
    """
    Modelo para un dish principal (main course).
    Incluye nombre, score de prediction y count estimado.
    """
    rank: int = Field(..., description="Ranking (1=top)", example=1)
    name: str = Field(..., description="Dish name", example="Carne a la Sal")
    score: float = Field(..., description="Score de probabilidad (0-1)", example=0.88)
    estimated_count: int = Field(..., description="Estimated count of this dish in the restaurant", example=44)


class MainPredictionRequest(BaseModel):
    """
    Request model to predict main dishes.
    Minimum user input: restaurant_id + service_date.
    """
    restaurant_id: int = Field(..., description="ID del restaurant", example=1, ge=1)
    service_date: date = Field(..., description="Date del service (YYYY-MM-DD)", example="2026-03-15")


class MainPredictionResponse(BaseModel):
    """
    Modelo de respuesta para prediction de dishes principales.
    Returns top 3 most likely dishes.
    """
    top_3_dishes: list[MainDish] = Field(
        ...,
        description="Top 3 dishes principales ordenados por probabilidad",
        example=[
            {"rank": 1, "name": "Carne a la Sal", "score": 0.88},
            {"rank": 2, "name": "Merluza a la Gallega", "score": 0.82},
            {"rank": 3, "name": "Cordero Lechal", "score": 0.76},
        ],
    )
    service_date: date = Field(..., description="Date predicha", example="2026-03-15")
    restaurant_id: int = Field(..., description="ID del restaurant", example=1)
    model_version: str = Field(..., description="Model version", example="azca_menu_main_v2")
    execution_timestamp: datetime = Field(..., description="Execution timestamp", example="2026-03-14T10:30:00")


class DessertDish(BaseModel):
    """
    Modelo para un postre (dessert).
    Incluye nombre, score de prediction y count estimado.
    """
    rank: int = Field(..., description="Ranking (1=top)", example=1)
    name: str = Field(..., description="Nombre del postre", example="Flan Casero")
    score: float = Field(..., description="Score de probabilidad (0-1)", example=0.83)
    estimated_count: int = Field(..., description="Estimated count of this dessert in the restaurant", example=42)


class DessertPredictionRequest(BaseModel):
    """
    Request model to predict desserts.
    Minimum user input: restaurant_id + service_date.
    """
    restaurant_id: int = Field(..., description="ID del restaurant", example=1, ge=1)
    service_date: date = Field(..., description="Date del service (YYYY-MM-DD)", example="2026-03-15")


class DessertPredictionResponse(BaseModel):
    """
    Modelo de respuesta para prediction de postres.
    Returns top 3 most likely desserts.
    """
    top_3_dishes: list[DessertDish] = Field(
        ...,
        description="Top 3 postres ordenados por probabilidad",
        example=[
            {"rank": 1, "name": "Flan Casero", "score": 0.83},
            {"rank": 2, "name": "Tiramisu", "score": 0.79},
            {"rank": 3, "name": "Churros con Chocolate", "score": 0.75},
        ],
    )
    service_date: date = Field(..., description="Date predicha", example="2026-03-15")
    restaurant_id: int = Field(..., description="ID del restaurant", example=1)
    model_version: str = Field(..., description="Model version", example="azca_menu_dessert_v2")
    execution_timestamp: datetime = Field(..., description="Execution timestamp", example="2026-03-14T10:30:00")


class OCRExtractedMenu(BaseModel):
    """
    OCR extraction result from uploaded menu.
    """

    starter: str = Field(..., description="Starter detected by OCR", example="Caesar salad")
    main: str = Field(..., description="Principal detectado por OCR", example="Merluza a la Gallega")
    dessert: str = Field(..., description="Postre detectado por OCR", example="Flan Casero")
    starter_options: list[str] = Field(default_factory=list, description="Todos los entrantes detectados")
    main_options: list[str] = Field(default_factory=list, description="Todos los principales detectados")
    dessert_options: list[str] = Field(default_factory=list, description="Todos los postres detectados")
    detected_lines: list[str] = Field(default_factory=list, description="Useful lines detected by OCR")


class OCRPredictedDish(BaseModel):
    """
    Dish predicted by the model for a category.
    """

    rank: int = Field(..., description="Ranking (1=top)", example=1)
    name: str = Field(..., description="Dish name", example="Merluza a la Gallega")
    score: float = Field(..., description="Probabilidad estimada (0-1)", example=0.82)


class MenuUploadPredictionResponse(BaseModel):
    """
    Combined OCR + ML prediction response for the uploaded menu.
    """

    restaurant_id: int = Field(..., description="ID del restaurant", example=1)
    service_date: date = Field(..., description="Date del service", example="2026-03-15")
    ocr_provider: str = Field(..., description="Proveedor OCR usado", example="azure_document_intelligence")
    extracted_menu: OCRExtractedMenu = Field(..., description="Dishes detected from the menu")
    starter_prediction: list[OCRPredictedDish] = Field(..., description="Top 3 entrantes predichos")
    main_prediction: list[OCRPredictedDish] = Field(..., description="Top 3 principales predichos")
    dessert_prediction: list[OCRPredictedDish] = Field(..., description="Top 3 postres predichos")
    model_version: str = Field(..., description="Model stack version", example="azca_menu_v2")
    execution_timestamp: datetime = Field(..., description="Execution timestamp")


class MenuOCRSectionsResponse(BaseModel):
    """
    Respuesta OCR pura (sin prediction) para inspeccionar secciones detectadas.
    """

    ocr_provider: str = Field(..., description="Proveedor OCR usado", example="azure_document_intelligence")
    extracted_menu: OCRExtractedMenu = Field(..., description="Dishes detected from the menu")
    raw_text: str = Field(..., description="Full OCR text for debugging")
    execution_timestamp: datetime = Field(..., description="Execution timestamp")


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
        example="API y database funcionando correctamente",
    )


class RestaurantItem(BaseModel):
    """
    Modelo de respuesta para un restaurant individual (lista).
    Includes basic information and location to calculate distances.
    """
    restaurant_id: int = Field(..., description="Unique restaurant ID")
    name: str = Field(..., description="Nombre del restaurant")
    latitude: float | None = Field(None, description="Latitud del restaurant")
    longitude: float | None = Field(None, description="Longitud del restaurant")

    class Config:
        from_attributes = True


class RestaurantDetailItem(BaseModel):
    """
    Modelo de respuesta detallado para un restaurant.
    Incluye todos los campos para llenar el formulario de prediction.
    """
    restaurant_id: int = Field(..., description="Unique restaurant ID")
    name: str = Field(..., description="Nombre del restaurant")
    capacity_limit: int | None = Field(None, description="Capacity limit")
    table_count: int | None = Field(None, description="Cantidad de mesas")
    min_service_duration: int | None = Field(None, description="Minimum service duration (minutes)")
    terrace_setup_type: str | None = Field(None, description="Tipo de setup terraza")
    opens_weekends: bool | None = Field(None, description="¿Abre fines de semana?")
    has_wifi: bool | None = Field(None, description="¿Tiene Wi-Fi?")
    restaurant_segment: str | None = Field(None, description="Segmento del restaurant")
    menu_price: float | None = Field(None, description="Average menu price")
    dist_office_towers: int | None = Field(None, description="Distancia a torres de oficina (metros)")
    google_rating: float | None = Field(None, description="Google rating")
    cuisine_type: str | None = Field(None, description="Tipo de cocina")
    image_url: str | None = Field(None, description="Public image URL for the restaurant")
    latitude: float | None = Field(None, description="Latitud del restaurant")
    longitude: float | None = Field(None, description="Longitud del restaurant")

    class Config:
        from_attributes = True


class RestaurantWithDistance(BaseModel):
    """
    Response model for restaurant with distance calculated from user location.
    """
    restaurant_id: int = Field(..., description="Unique restaurant ID")
    name: str = Field(..., description="Nombre del restaurant")
    latitude: float | None = Field(None, description="Latitud del restaurant")
    longitude: float | None = Field(None, description="Longitud del restaurant")
    distance_km: float = Field(..., description="Distancia desde el user en km")
    image_url: str | None = Field(None, description="URL de imagen del restaurant")
    google_rating: float | None = Field(None, description="Google rating")
    cuisine_type: str | None = Field(None, description="Tipo de cocina")

    class Config:
        from_attributes = True


class RestaurantNearbyResponse(BaseModel):
    """
    Response for nearby restaurant search with calculated distances.
    """
    count: int = Field(..., description="Cantidad de restaurants")
    user_latitude: float = Field(..., description="Latitud del user")
    user_longitude: float = Field(..., description="Longitud del user")
    restaurants: list[RestaurantWithDistance] = Field(..., description="Restaurants ordenados por distancia")


class RestaurantUpdateRequest(BaseModel):
    name: str | None = Field(None, description="Nombre del restaurant")
    capacity_limit: int | None = Field(None, description="Capacity limit", ge=1)
    table_count: int | None = Field(None, description="Cantidad de mesas", ge=1)
    min_service_duration: int | None = Field(None, description="Minimum service duration", ge=1)
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
    ] | None = Field(None, description="Segmento del restaurant")
    menu_price: float | None = Field(None, description="Menu price", ge=0)
    dist_office_towers: int | None = Field(None, description="Distancia a oficinas", ge=0)
    google_rating: float | None = Field(None, description="Google rating", ge=0, le=5)
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
    Modelo de respuesta para la lista de restaurants.
    """
    count: int = Field(..., description="Cantidad total de restaurants")
    restaurants: list[RestaurantItem] = Field(..., description="Lista de restaurants")


class RestaurantsDetailListResponse(BaseModel):
    """Modelo de respuesta para la lista de restaurants con detalle completo."""

    count: int = Field(..., description="Cantidad total de restaurants")
    restaurants: list[RestaurantDetailItem] = Field(..., description="Lista detallada de restaurants")


class InscripcionCreateRequest(BaseModel):
    """Modelo de alta para solicitudes en dbo.inscriptions."""

    name: str = Field(..., description="Nombre del restaurant", min_length=1)
    capacity_limit: int | None = Field(None, description="Capacity limit", ge=1)
    table_count: int | None = Field(None, description="Cantidad de mesas", ge=1)
    min_service: str | None = Field(None, description="Minimum service duration (text)")
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
    ] | None = Field(None, description="Segmento del restaurant")
    menu_price: float | None = Field(None, description="Average menu price", ge=0)
    dist_office_towers: int | None = Field(None, description="Distancia a oficinas en metros", ge=0)
    google_rating: float | None = Field(None, description="Average rating (0-5)", ge=0, le=5)
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
    login_email: str | None = Field(None, description="Email para acceso del restaurant")
    password: str | None = Field(None, description="Password de acceso (se almacena hasheada)")
    image_url: str | None = Field(None, description="URL inicial de imagen del restaurant")
    google_maps_link: str = Field(..., description="Google Reviews/Maps link (required)", min_length=5)
    image_url: str | None = Field(None, description="URL inicial de imagen del restaurant")
    google_maps_link: str = Field(..., description="Google Reviews/Maps link (required)", min_length=5)


class InscripcionItem(BaseModel):
    """Modelo de respuesta para una solicitud en dbo.inscriptions."""

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
    date_solicitud: datetime | None = None

    class Config:
        from_attributes = True


class InscripcionesListResponse(BaseModel):
    """Respuesta para listados de inscripciones."""

    count: int
    inscripciones: list[InscripcionItem]


class InscripcionActionResponse(BaseModel):
    """Standard response for administrative registration actions."""

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


class DishRatingCreateRequest(BaseModel):
    restaurant_id: int
    dish_name: str = Field(..., min_length=1, max_length=500)
    rating: float = Field(..., ge=1, le=5)  # Float para aceptar decimales (ej: 4.5)
    rating_date: date | None = None


class DishRatingWriteResponse(BaseModel):
    success: bool
    restaurant_id: int
    rating_date: date
    dish_name: str
    dish_key: str
    rating: float  # Float para retornar decimales


class DishRatingSummaryItem(BaseModel):
    dish_name: str
    dish_key: str
    avg_rating: float
    votes: int


class DishRatingSummaryResponse(BaseModel):
    restaurant_id: int
    rating_date: date
    items: list[DishRatingSummaryItem]


class DishSearchRestaurantResult(BaseModel):
    restaurant_id: int
    best_score: float
    matches: list[str]
    in_today_menu: bool = False
    last_seen: date | None = None
    seen_count: int = 0


class DishSearchResponse(BaseModel):
    query: str
    service_date: date
    restaurants: list[DishSearchRestaurantResult]


class RestaurantRankingItem(BaseModel):
    restaurant_id: int
    avg_rating: float | None = None
    votes: int
    trend_7d: float | None = None


class RestaurantRankingResponse(BaseModel):
    date_from: date
    date_to: date
    order_by: Literal["avg", "votes", "trend"]
    restaurants: list[RestaurantRankingItem]


class DishRankingItem(BaseModel):
    dish_id: int | None = None  # Opcional: permite valoraciones sin dish_id asignado
    dish_name: str
    restaurant_id: int  # ID del restaurant
    restaurant_name: str  # Nombre del restaurant
    avg_rating: float | None = None
    votes: int
    trend_7d: float | None = None


class DishRankingResponse(BaseModel):
    date_from: date
    date_to: date
    order_by: Literal["avg", "votes", "trend"]
    dishes: list[DishRankingItem]


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
    restaurant_id: int = Field(..., description="0 para admin, >0 para restaurant")
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
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session.")
    return payload


def _require_admin_auth(authorization: str | None) -> dict:
    """Requiere que el user sea admin (restaurant_id=0)"""
    payload = _require_auth(authorization)
    if payload.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session for administrator.")
    return payload


def _require_restaurant_or_admin_auth(authorization: str | None, requested_restaurant_id: int | None) -> dict:
    """
    Requiere que el user sea restaurant_owner o admin.
    If role is restaurant_owner, validates access only to its own restaurant.
    
    Args:
        authorization: Authorization header
        requested_restaurant_id: ID del restaurant solicitado (para validar permisos)
        
    Returns:
        Token payload if authorization is valid
    """
    payload = _require_auth(authorization)
    role = payload.get("role")
    user_restaurant_id = payload.get("restaurant_id")
    
    # Admin puede acceder a cualquier restaurant
    if role == "admin":
        return payload
    
    # Restaurant owner solo puede acceder a su propio restaurant
    if role == "restaurant_owner":
        if user_restaurant_id != requested_restaurant_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para acceder a este restaurant."
            )
        return payload
    
    # Cualquier otro rol es rechazado
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Unauthorized role for menu predictions."
    )


# ============================================================================
# APP INITIALIZATION
# ============================================================================

class CacheManager:
    """
    In-memory cache manager for weather, calendar, and dish-count data.
    
    Evita llamadas repetidas a Open-Meteo API y queries costosas a BD.
    
    Beneficio: 
    - Clima/Calendario: Reducir 200-500ms por prediction 3 = hasta 1.5s ahorrados
    - Dish Counts: Delete 3 JOINs + COUNT(DISTINCT) por prediction
    
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
            ttl_minutes: Minutes that weather/calendar data remains cached (default: 20 min)
            dish_count_ttl_minutes: Minutes that dish counts remain cached (default: 60 min)
        """
        self.ttl = timedelta(minutes=ttl_minutes)
        self.dish_count_ttl = timedelta(minutes=dish_count_ttl_minutes)
        self.weather_cache = {}
        self.calendar_cache = {}
        self.dish_count_cache = {}
        logger.info(f"CacheManager initialized with weather/calendar TTL={ttl_minutes}min, dish-count TTL={dish_count_ttl_minutes}min")
    
    def _is_expired(self, cached_timestamp: datetime, ttl: timedelta) -> bool:
        """Checks whether a cache entry has expired."""
        return datetime.now() - cached_timestamp > ttl
    
    def get_weather(self, service_date: date) -> dict | None:
        """
        Gets weather data from cache if present and not expired.
        
        Args:
            service_date: Date para consultar
            
        Returns:
            dict with weather data, or None if not cached or expired
        """
        if service_date in self.weather_cache:
            data, timestamp = self.weather_cache[service_date]
            if not self._is_expired(timestamp, self.ttl):
                logger.info(f"Weather cache hit for {service_date} (age: {(datetime.now() - timestamp).total_seconds():.0f}s)")
                return data
            else:
                # Delete expired entry
                del self.weather_cache[service_date]
                logger.info(f"Weather cache expired for {service_date}")
        
        return None
    
    def set_weather(self, service_date: date, data: dict) -> None:
        """Stores weather data in cache."""
        self.weather_cache[service_date] = (data, datetime.now())
        logger.info(f"Weather cached for {service_date}")
    
    def get_calendar(self, service_date: date) -> dict | None:
        """
        Gets calendar data from cache if present and not expired.
        
        Args:
            service_date: Date to query
            
        Returns:
            dict with calendar data, or None if not cached or expired
        """
        if service_date in self.calendar_cache:
            data, timestamp = self.calendar_cache[service_date]
            if not self._is_expired(timestamp, self.ttl):
                logger.info(f"Calendar cache hit for {service_date} (age: {(datetime.now() - timestamp).total_seconds():.0f}s)")
                return data
            else:
                # Delete expired entry
                del self.calendar_cache[service_date]
                logger.info(f"Calendar cache expired for {service_date}")
        
        return None
    
    def set_calendar(self, service_date: date, data: dict) -> None:
        """Stores calendar data in cache."""
        self.calendar_cache[service_date] = (data, datetime.now())
        logger.info(f"Calendar cached for {service_date}")
    
    def get_dish_count(self, restaurant_id: int, course_type: str) -> int | None:
        """
        Gets dish count from cache if present and not expired.
        
        Args:
            restaurant_id: Restaurant ID
            course_type: Dish type ('first_course', 'second_course', 'dessert')
            
        Returns:
            int count, or None if not cached or expired
        """
        cache_key = (restaurant_id, course_type)
        if cache_key in self.dish_count_cache:
            count, timestamp = self.dish_count_cache[cache_key]
            if not self._is_expired(timestamp, self.dish_count_ttl):
                logger.info(f"Dish count cache hit for restaurant {restaurant_id}, {course_type} (age: {(datetime.now() - timestamp).total_seconds():.0f}s)")
                return count
            else:
                # Delete expired entry
                del self.dish_count_cache[cache_key]
                logger.info(f"Dish count cache expired for restaurant {restaurant_id}, {course_type}")
        
        return None
    
    def set_dish_count(self, restaurant_id: int, course_type: str, count: int) -> None:
        """Stores dish count in cache."""
        cache_key = (restaurant_id, course_type)
        self.dish_count_cache[cache_key] = (count, datetime.now())
        logger.info(f"Dish count cached for restaurant {restaurant_id}, {course_type}: {count} dishes")
    
    def clear_expired(self) -> None:
        """Removes all expired cache entries."""
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
            logger.info(f"Cache cleanup: removed {len(expired_weather)} weather, {len(expired_calendar)} calendar, {len(expired_counts)} count entries")
    
    def stats(self) -> dict:
        """Returns cache statistics."""
        return {
            "weather_items": len(self.weather_cache),
            "calendar_items": len(self.calendar_cache),
            "dish_count_items": len(self.dish_count_cache),
            "ttl_minutes": int(self.ttl.total_seconds() / 60),
            "dish_count_ttl_minutes": int(self.dish_count_ttl.total_seconds() / 60),
        }


def _ensure_auth_columns_exist() -> None:
    """Creates auth/image/geolocation columns in tables if DB migration is pending. Idempotent."""
    statements = [
        "IF COL_LENGTH('dbo.dim_restaurants', 'login_email') IS NULL ALTER TABLE dbo.dim_restaurants ADD login_email NVARCHAR(255) NULL;",
        "IF COL_LENGTH('dbo.dim_restaurants', 'password_hash') IS NULL ALTER TABLE dbo.dim_restaurants ADD password_hash NVARCHAR(255) NULL;",
        "IF COL_LENGTH('dbo.dim_restaurants', 'image_url') IS NULL ALTER TABLE dbo.dim_restaurants ADD image_url NVARCHAR(500) NULL;",
        "IF COL_LENGTH('dbo.dim_restaurants', 'latitude') IS NULL ALTER TABLE dbo.dim_restaurants ADD latitude FLOAT NULL;",
        "IF COL_LENGTH('dbo.dim_restaurants', 'longitude') IS NULL ALTER TABLE dbo.dim_restaurants ADD longitude FLOAT NULL;",
        "IF COL_LENGTH('dbo.dim_restaurants', 'image_data') IS NULL ALTER TABLE dbo.dim_restaurants ADD image_data VARBINARY(MAX) NULL;",
        "IF COL_LENGTH('dbo.inscriptions', 'login_email') IS NULL ALTER TABLE dbo.inscriptions ADD login_email NVARCHAR(255) NULL;",
        "IF COL_LENGTH('dbo.inscriptions', 'password_hash') IS NULL ALTER TABLE dbo.inscriptions ADD password_hash NVARCHAR(255) NULL;",
        "IF COL_LENGTH('dbo.inscriptions', 'image_url') IS NULL ALTER TABLE dbo.inscriptions ADD image_url NVARCHAR(500) NULL;",
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


def _menu_registered_model_name() -> str:
    configured_name = os.getenv("AZCA_MENU_REGISTERED_MODEL", "").strip()
    return configured_name or DEFAULT_MENU_REGISTERED_MODEL


def _menu_model_filename() -> str:
    configured_name = os.getenv("AZCA_MENU_MODEL_FILENAME", "").strip()
    return configured_name or DEFAULT_MENU_MODEL_FILENAME


def _sync_menu_model_from_azureml(provider: Any) -> Path | None:
    """
    Try downloading the latest unified menu model from Azure ML and persist it
    under artifacts with a stable filename used by the API.
    """
    if provider is None or not hasattr(provider, "download_model_to_artifacts"):
        return None

    disable_azure = os.getenv("AZCA_DISABLE_AZURE_ML_MODELS", "0").strip().lower() in {
        "1",
        "true",
        "yes",
        "on",
    }
    if disable_azure:
        logger.info("Azure ML disabled by AZCA_DISABLE_AZURE_ML_MODELS; using local model.")
        return None

    model_name = _menu_registered_model_name()
    artifacts_path = Path(__file__).parent.parent / "azca" / "artifacts"
    destination_path = artifacts_path / _menu_model_filename()

    try:
        downloaded_path = provider.download_model_to_artifacts(
            registered_name=model_name,
            dest_pkl_path=destination_path,
        )
        logger.info(
            "Menu model updated from Azure ML: %s (%s)",
            model_name,
            downloaded_path.name,
        )
        return downloaded_path
    except Exception as exc:
        logger.warning(
            "Could not update '%s' from Azure ML (%s). Local fallback will be used.",
            model_name,
            exc,
        )
        return None


def _resolve_unified_menu_model_path() -> Path:
    """Locates the menu model compatible with old and new names."""
    artifacts_path = Path(__file__).parent.parent / "azca" / "artifacts"

    configured_name = os.getenv("AZCA_MENU_MODEL_FILENAME", "").strip()
    candidate_names_raw = [
        configured_name,
        DEFAULT_MENU_MODEL_FILENAME,
        "azca-secondary-menus-model.pkl",
        "azca-menus-model.pkl",
        "AzcaMenuModel.pkl",
    ]

    candidate_names: list[str] = []
    for name in candidate_names_raw:
        if name and name not in candidate_names:
            candidate_names.append(name)

    for candidate_name in candidate_names:
        candidate_path = artifacts_path / candidate_name
        if candidate_path.exists():
            return candidate_path

    raise FileNotFoundError(
        f"No menu model found in {artifacts_path}. "
        f"Probados: {', '.join(candidate_names)}"
    )


# ============================================================================
# EVENTOS DE STARTUP Y SHUTDOWN
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """
    Evento de inicio de la API.

    - Inicializa la database (crea tables si no existen)
    - Loads the prediction engine (PredictionEngine)
    - Performs basic validations
    """
    global prediction_engine

    try:
        # Inicializar database
        init_db()
        _ensure_auth_columns_exist()
        logger.info("Auth/image columns verified")
    except Exception as migration_error:
        logger.warning(f"Could not verify auth columns: {str(migration_error)[:120]}")

    # 2. Intentar conectar a BD y verify restaurants
    try:
        db = SessionLocal()
        restaurant_count = db.query(Restaurant).count()
        db.close()
        logger.info(f"Connected to DB: {restaurant_count} restaurants disponibles")
    except Exception as db_error:
        logger.error(f"Error connecting to DB: {str(db_error)}", exc_info=True)
        raise
    
    # 3. Initialize prediction engine
    try:
        prediction_engine = PredictionEngine()
        logger.info("Prediction engine initialized")
    except Exception as engine_error:
        logger.warning("Prediction engine not available: %s", str(engine_error)[:100])
        prediction_engine = None  # Allows mock fallback in endpoints

    # 4. Sync menu model from Azure ML and start monthly scheduler
    app.state.model_refresh_task = None
    if prediction_engine is not None:
        model_provider = getattr(prediction_engine, "model_provider", None)

        # Intenta desload model.pkl desde Azure ML y savelo renombrado
        # como azca-menus-model.pkl para uso local consistente.
        _sync_menu_model_from_azureml(model_provider)

        # Intenta desload el modelo de services para que /predict use
        # artifacts/azca-services-model.pkl como origen principal local.
        try:
            model_provider.download_model_to_artifacts(
                registered_name=DEFAULT_SERVICES_REGISTERED_MODEL,
                dest_pkl_path=(
                    Path(__file__).parent.parent
                    / "azca"
                    / "artifacts"
                    / f"{DEFAULT_SERVICES_REGISTERED_MODEL}.pkl"
                ),
            )
            logger.info("Services model updated: %s", DEFAULT_SERVICES_REGISTERED_MODEL)
        except Exception as exc:
            logger.warning(
                "Could not update '%s' from Azure ML (%s). Local fallback will be used.",
                DEFAULT_SERVICES_REGISTERED_MODEL,
                exc,
            )

        if MODEL_SCHEDULER_AVAILABLE and model_provider is not None:
            scheduler_models = list(
                dict.fromkeys([
                    DEFAULT_SERVICES_REGISTERED_MODEL,
                    _menu_registered_model_name(),
                ])
            )

            try:
                app.state.model_refresh_task = start_model_refresh_scheduler(
                    model_provider,
                    scheduler_models,
                )
                logger.info(
                    "Monthly model scheduler started (%s)",
                    ", ".join(scheduler_models),
                )
            except Exception as scheduler_error:
                logger.warning(
                    "Could not start monthly model scheduler: %s",
                    scheduler_error,
                )
        elif not MODEL_SCHEDULER_AVAILABLE:
            logger.warning("Model scheduler not available; monthly refresh is skipped.")

    # 5. Load pickle model in memory (key optimization)
    model_path: Path | None = None
    try:
        model_path = _resolve_unified_menu_model_path()
        
        logger.info(f"Loading model from: {model_path}")
        
        # Pre-importar onnx para registrar sus DLL nativas en Windows antes
        # so pickle.load does not try to import it through the chain
        # azureml -> skl2onnx -> onnx_cpp2py_export (which could cause DLL init failure)
        try:
            import onnx  # noqa: F401
            import onnxruntime  # noqa: F401
        except ImportError:
            pass

        with open(model_path, "rb") as f:
            model = pickle.load(f)
        
        app.state.model = model
        logger.info(f"Model loaded into memory (app.state.model)")
        logger.info(f"   Tipo de modelo: {type(model).__name__}")
        
    except FileNotFoundError:
        logger.error(
            "Model not found. Candidate paths: %s",
            "azca-menus-model.pkl, azca-secondary-menus-model.pkl, AzcaMenuModel.pkl",
        )
        # No re-lanzar para permitir que el servidor inicie
        app.state.model = None
        logger.warning("Server will start without prediction model")
    except Exception as model_error:
        logger.error(f"Error loading model: {str(model_error)}", exc_info=True)
        # No re-lanzar para permitir que el servidor inicie sin modelo
        # Los endpoints de imagen no necesitan el modelo
        app.state.model = None
        logger.warning("Server will start without prediction model")
    
    # 6. Initialize in-memory cache (weather and calendar)
    # 6. Initialize in-memory cache (weather and calendar)
    try:
        app.state.cache = CacheManager(ttl_minutes=20)
        logger.info(f"In-memory cache initialized")
    except Exception as cache_error:
        logger.warning(f"Error initializing cache (non-critical): {str(cache_error)}")
    
    logger.info("Application ready to serve predictions")

# Configurar CORS para permitir requests desde el frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, change to ["https://your-domain.com"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

static_dir = Path(__file__).parent / "static"
if static_dir.exists():
    app.mount("/static", StaticFiles(directory=static_dir), name="static")


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
        message="API y database funcionando correctamente",
    )


@app.get(
    "/restaurants",
    response_model=RestaurantsListResponse,
    summary="Get list of restaurants",
    tags=["Data"],
)
async def get_restaurants(db: Session = Depends(get_db)):
    """
    Obtiene la lista de todos los restaurants disponibles desde Azure SQL.

    Returns:
        RestaurantsListResponse: List of restaurants with basic information
    """
    try:
        restaurants = db.query(Restaurant).all()
        
        response = RestaurantsListResponse(
            count=len(restaurants),
            restaurants=[
                RestaurantItem(
                    restaurant_id=r.restaurant_id,
                    name=r.name,
                    latitude=r.latitude,
                    longitude=r.longitude
                )
                for r in restaurants
            ]
        )
        
        return response
    except Exception as e:
        logger.error(f"Error in GET /restaurants: {str(e)}", exc_info=True)
        # Return an empty list instead of 500 to keep the UI functional.
        # This helps when DB is unavailable or configuration is missing.
        return RestaurantsListResponse(count=0, restaurants=[])


@app.get(
    "/restaurants/nearby",
    response_model=RestaurantNearbyResponse,
    summary="Get nearby restaurants",
    tags=["Data"],
)
async def get_restaurants_nearby(
    user_latitude: float = Query(..., description="Latitud del user"),
    user_longitude: float = Query(..., description="Longitud del user"),
    db: Session = Depends(get_db)
):
    """
    Gets all restaurants ordered by distance from user location.
    
    Args:
        user_latitude: Latitude of user location
        user_longitude: Longitude of user location
        
    Returns:
        RestaurantNearbyResponse: Lista de restaurants con distancias calculadas, ordenados por proximidad
    """
    try:
        restaurants = db.query(Restaurant).all()
        
        restaurants_with_distance = []
        
        for restaurant in restaurants:
            # Si el restaurant tiene coordenadas, calcular distancia
            if restaurant.latitude and restaurant.longitude:
                distance = calculate_distance_haversine(
                    user_latitude,
                    user_longitude,
                    restaurant.latitude,
                    restaurant.longitude
                )
            else:
                # Si no tiene coordenadas, asignar distancia muy grande para ordenar al final
                distance = 9999.0
            
            restaurants_with_distance.append(
                RestaurantWithDistance(
                    restaurant_id=restaurant.restaurant_id,
                    name=restaurant.name,
                    latitude=restaurant.latitude,
                    longitude=restaurant.longitude,
                    distance_km=round(distance, 2),
                    image_url=restaurant.image_url,
                    google_rating=restaurant.google_rating,
                    cuisine_type=restaurant.cuisine_type
                )
            )
        
        # Ordenar por distancia
        restaurants_with_distance.sort(key=lambda x: x.distance_km)
        
        response = RestaurantNearbyResponse(
            count=len(restaurants_with_distance),
            user_latitude=user_latitude,
            user_longitude=user_longitude,
            restaurants=restaurants_with_distance
        )
        
        return response
    except Exception as e:
        logger.error(f"Error in GET /restaurants/nearby: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving restaurants cercanos: {str(e)}"
        )



@app.get(
    "/restaurants/details",
    response_model=RestaurantsDetailListResponse,
    summary="Get detailed restaurant list",
    tags=["Data"],
)
async def get_restaurants_details(db: Session = Depends(get_db)):
    """Obtiene todos los restaurants con detalle completo en una sola consulta."""
    try:
        restaurants = db.query(Restaurant).all()

        detail_rows = [RestaurantDetailItem.from_orm(row) for row in restaurants]
        detail_rows.sort(key=lambda row: row.name.casefold())

        return RestaurantsDetailListResponse(count=len(detail_rows), restaurants=detail_rows)
    except Exception as e:
        logger.error(f"Error in GET /restaurants/details: {str(e)}", exc_info=True)
        return RestaurantsDetailListResponse(count=0, restaurants=[])


@app.get(
    "/restaurants/{restaurant_id}",
    response_model=RestaurantDetailItem,
    summary="Get restaurant details",
    tags=["Data"],
)
async def get_restaurant_detail(restaurant_id: int, db: Session = Depends(get_db)):
    """
    Gets all details of a specific restaurant by ID.
    
    Devuelve todos los campos necesarios para llenar el formulario de prediction.

    Args:
        restaurant_id: Restaurant ID to retrieve

    Returns:
        RestaurantDetailItem: Detalles completos del restaurant
    """
    try:
        restaurant = db.query(Restaurant).filter(Restaurant.restaurant_id == restaurant_id).first()
        
        if not restaurant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Restaurant con ID {restaurant_id} not found"
            )
        
        return RestaurantDetailItem.from_orm(restaurant)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in GET /restaurants/{restaurant_id}: {str(e)}", exc_info=True)
        # Return a minimal object to keep UI operational
        return RestaurantDetailItem(
            restaurant_id=restaurant_id,
            name=f"Restaurant {restaurant_id}",
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
    summary="Get restaurant image URL",
    tags=["Data"],
    response_model=dict,
)
async def get_restaurant_image(
    restaurant_id: int,
    db: Session = Depends(get_db)
):
    """
    Obtiene la URL de la imagen del restaurant.
    
    Si el restaurant no tiene imagen personalizada en Blob Storage,
    returns the default image based on cuisine type.

    Args:
        restaurant_id: ID del restaurant

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
                detail=f"Restaurant con ID {restaurant_id} not found"
            )

        # Si tiene URL personalizada (del Blob Storage), usarla
        if restaurant.image_url:
            return {
                "image_url": restaurant.image_url,
                "is_default": False,
                "restaurant_id": restaurant_id
            }

        # Otherwise, return default image based on cuisine type
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
            f"Error in GET /restaurants/{restaurant_id}/image: {str(e)}",
            exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving imagen del restaurant"
        )


@app.get(
    "/company/logo",
    summary="Get AML company logos",
    tags=["Company"],
    response_model=dict,
)
async def get_company_logos():
    """
    Obtiene las URLs de los logos de AML desde Azure Blob Storage.
    
    Retorna:
    - Logo.png: Full logo with text (for About Us page)
    - Logo_sin.png: Logo sin texto (para header principal)
    """
    try:
        import os
        
        storage_account = os.getenv("AZURE_STORAGE_ACCOUNT_NAME", "storagemenus")
        container = os.getenv("AZURE_BLOB_CONTAINER_EMPRESA", "company-assets")
        
        base_url = f"https://{storage_account}.blob.core.windows.net/{container}"
        
        logos = {
            "logo_completo": f"{base_url}/Logo.png",
            "logo_sin_texto": f"{base_url}/Logo_sin.png",
        }
        
        logger.info(f"Company logos served from: {base_url}")
        
        return logos
        
    except Exception as e:
        logger.error(
            f"Error retrieving company logos: {str(e)}",
            exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving logos de la empresa"
        )


def _parse_min_service_duration(min_service: str | None) -> int | None:
    """Converts min_service (nvarchar) to integer minutes when possible."""
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


def _capitalize_first(value: str | None) -> str | None:
    """Returns text with first letter capitalized, preserving the rest."""
    if value is None:
        return None
    trimmed = value.strip()
    if not trimmed:
        return None
    return trimmed[0].upper() + trimmed[1:]


@app.post(
    "/inscripciones",
    response_model=InscripcionItem,
    summary="Create registration request",
    tags=["Data"],
    status_code=status.HTTP_201_CREATED,
)
async def create_inscripcion(request: InscripcionCreateRequest, db: Session = Depends(get_db)):
    """Crea una solicitud de alta en dbo.inscriptions."""
    try:
        normalized_login_email = request.login_email.strip().lower() if request.login_email else None
        normalized_password = request.password.strip() if request.password else None

        if bool(normalized_login_email) != bool(normalized_password):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Debes enviar email y password juntos.",
            )

        if normalized_password and len(normalized_password) < 6:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="La password debe tener al menos 6 caracteres.",
            )

        if normalized_login_email:
            existing_user = db.query(User).filter(User.login_email == normalized_login_email).first()
            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Ya existe un user registrado con ese email.",
                )

        password_hash = hash_password(normalized_password) if normalized_password else None

        inscripcion = Inscripcion(
            name=request.name.strip(),
            capacity_limit=request.capacity_limit,
            table_count=request.table_count,
            min_service=request.min_service,
            terrace_setup_type=request.terrace_setup_type,
            opens_weekends=request.opens_weekends,
            has_wifi=request.has_wifi,
            restaurant_segment=_capitalize_first(request.restaurant_segment),
            menu_price=request.menu_price,
            dist_office_towers=request.dist_office_towers,
            google_rating=request.google_rating,
            cuisine_type=_capitalize_first(request.cuisine_type),
            login_email=normalized_login_email,
            password_hash=password_hash,
            image_url=request.image_url.strip() if request.image_url else None,
            google_maps_link=request.google_maps_link.strip(),
            estado_inscripcion="pendiente",
            date_solicitud=datetime.now(),
        )

        db.add(inscripcion)
        db.flush()

        if normalized_login_email and password_hash:
            provisional_restaurant_id = -inscripcion.inscripcion_id
            db.add(
                User(
                    restaurant_id=provisional_restaurant_id,
                    login_email=normalized_login_email,
                    password_hash=password_hash,
                    is_active=False,
                    role="restaurant_owner",
                )
            )

        db.commit()
        db.refresh(inscripcion)
        return InscripcionItem.from_orm(inscripcion)

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error in POST /inscripciones: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error while creating registration request",
        )


@app.get(
    "/inscripciones/pending",
    response_model=InscripcionesListResponse,
    summary="Get pending registrations",
    tags=["Data"],
)
async def get_pending_inscripciones(db: Session = Depends(get_db)):
    """Obtiene solicitudes pendientes desde dbo.inscriptions."""
    try:
        rows = (
            db.query(Inscripcion)
            .filter(
                or_(
                    Inscripcion.estado_inscripcion.is_(None),
                    func.lower(Inscripcion.estado_inscripcion) == "pendiente",
                )
            )
            .order_by(desc(Inscripcion.date_solicitud), desc(Inscripcion.inscripcion_id))
            .all()
        )

        return InscripcionesListResponse(
            count=len(rows),
            inscripciones=[InscripcionItem.from_orm(row) for row in rows],
        )

    except Exception as e:
        logger.error(f"Error in GET /inscripciones/pending: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving inscripciones pendientes",
        )


@app.get(
    "/restaurants/{restaurant_id}",
    response_model=RestaurantDetailItem,
    summary="Get restaurant details",
    tags=["Restaurants"],
)
async def get_restaurant(
    restaurant_id: int, 
    db: Session = Depends(get_db), 
    authorization: str | None = Header(default=None)
):
    """
    Gets restaurant information by ID.
    El admin puede ver cualquiera. 
    Un owner solo puede ver su propio restaurant.
    """
    payload = _require_auth(authorization)
    role = payload.get("role")
    user_restaurant_id = payload.get("restaurant_id")
    
    # Validar permisos
    if role == "restaurant_owner" and user_restaurant_id != restaurant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="No tienes permisos para ver los detalles de este restaurant"
        )
        
    restaurant = db.query(Restaurant).filter(
        Restaurant.restaurant_id == restaurant_id
    ).first()
    
    if not restaurant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Restaurant not found"
        )
        
    return RestaurantDetailItem.from_orm(restaurant)


@app.patch(
    "/restaurants/{restaurant_id}",
    response_model=RestaurantDetailItem,
    summary="Update restaurant data",
    tags=["Restaurants"],
)
async def update_restaurant(
    restaurant_id: int,
    request: RestaurantUpdateRequest,
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
):
    """
    Actualiza los campos editables de un restaurant.

    - Admin puede editar cualquier restaurant.
    - Owner can edit only their own restaurant.
    - Optional fields sent as null or empty string are cleaned in DB.
    """
    payload = _require_auth(authorization)
    role = payload.get("role")
    user_restaurant_id = payload.get("restaurant_id")

    if role == "restaurant_owner" and user_restaurant_id != restaurant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para editar este restaurant",
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
            detail="Restaurant not found",
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
                    detail="Restaurant name cannot be empty",
                )
            if field_name != "name" and not value:
                value = None

        setattr(restaurant, field_name, value)

    db.commit()
    db.refresh(restaurant)
    return RestaurantDetailItem.from_orm(restaurant)


@app.delete(
    "/restaurants/{restaurant_id}",
    summary="Delete restaurant",
    tags=["Restaurants"],
)
async def delete_restaurant_endpoint(
    restaurant_id: int,
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
):
    """
    Elimina un restaurant de forma permanente.

    - Only admin-role users can run this action.
    - Also removes associated credentials from users table.
    """
    _require_admin_auth(authorization)

    restaurant = db.query(Restaurant).filter(Restaurant.restaurant_id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Restaurant not found",
        )

    try:
        # Limpiar datos dependientes para evitar violaciones de FK (NO_ACTION)
        menu_ids = [
            int(row[0])
            for row in db.query(FactMenus.menu_id)
            .filter(FactMenus.restaurant_id == restaurant_id)
            .all()
        ]

        if menu_ids:
            db.query(FactMenuItems).filter(FactMenuItems.menu_id.in_(menu_ids)).delete(synchronize_session=False)

        db.query(FactMenus).filter(FactMenus.restaurant_id == restaurant_id).delete(synchronize_session=False)
        db.query(FactServices).filter(FactServices.restaurant_id == restaurant_id).delete(synchronize_session=False)
        db.query(RestaurantRating).filter(RestaurantRating.restaurant_id == restaurant_id).delete(synchronize_session=False)

        # Limpieza adicional de tables sin FK directa pero con datos del restaurant
        db.query(DailyMenu).filter(DailyMenu.restaurant_id == restaurant_id).delete(synchronize_session=False)
        db.query(DishRating).filter(DishRating.restaurant_id == restaurant_id).delete(synchronize_session=False)
        db.query(FactPredictionLog).filter(FactPredictionLog.restaurant_id == restaurant_id).delete(synchronize_session=False)
        db.query(MenusAzca).filter(MenusAzca.restaurant_id == restaurant_id).delete(synchronize_session=False)

        db.query(User).filter(User.restaurant_id == restaurant_id).delete(synchronize_session=False)
        db.delete(restaurant)
        db.commit()
        return {"success": True, "message": f"Restaurant {restaurant_id} eliminado correctamente."}
    except Exception as e:
        db.rollback()
        logger.error(
            "Error in DELETE /restaurants/%s: %s",
            restaurant_id,
            str(e),
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error while delete restaurant",
        )


@app.get(
    "/inscripciones",
    response_model=InscripcionesListResponse,
    summary="Get registrations",
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

        rows = query.order_by(desc(Inscripcion.date_solicitud), desc(Inscripcion.inscripcion_id)).all()

        return InscripcionesListResponse(
            count=len(rows),
            inscripciones=[InscripcionItem.from_orm(row) for row in rows],
        )

    except Exception as e:
        logger.error(f"Error in GET /inscripciones: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving inscripciones",
        )


@app.post(
    "/inscripciones/{inscripcion_id}/approve",
    response_model=InscripcionActionResponse,
    summary="Approve registration",
    tags=["Data"],
)
async def approve_inscripcion(inscripcion_id: int, db: Session = Depends(get_db)):
    """
    Approves a registration:
    - Inserta los datos del restaurant en dim_restaurants.
    - Marks registration as approved.
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
                detail=f"Registration with ID {inscripcion_id} not found",
            )

        restaurant_data = {
            "name": inscripcion.name,
            "capacity_limit": inscripcion.capacity_limit,
            "table_count": inscripcion.table_count,
            "min_service_duration": _parse_min_service_duration(inscripcion.min_service),
            "terrace_setup_type": inscripcion.terrace_setup_type or "none",
            "opens_weekends": inscripcion.opens_weekends,
            "has_wifi": inscripcion.has_wifi,
            "restaurant_segment": inscripcion.restaurant_segment,
            "menu_price": inscripcion.menu_price,
            "dist_office_towers": inscripcion.dist_office_towers,
            "google_rating": inscripcion.google_rating,
            "cuisine_type": inscripcion.cuisine_type,
            "login_email": inscripcion.login_email,
            "password_hash": inscripcion.password_hash,
            "login_email": inscripcion.login_email,
            "password_hash": inscripcion.password_hash,
            "image_url": inscripcion.image_url,
        }

        next_restaurant_id = (db.query(func.max(Restaurant.restaurant_id)).scalar() or 0) + 1
        restaurant = Restaurant(restaurant_id=next_restaurant_id, **restaurant_data)

        db.add(restaurant)
        db.flush()

        # Create user en table users si hay email y password
        if inscripcion.login_email and inscripcion.password_hash:
            normalized_email = inscripcion.login_email.strip().lower()
            existing_user = db.query(User).filter(User.login_email == normalized_email).first()
            if existing_user:
                existing_user.restaurant_id = next_restaurant_id
                existing_user.password_hash = inscripcion.password_hash
                existing_user.is_active = True
                existing_user.role = "restaurant_owner"
            else:
                new_user = User(
                    restaurant_id=next_restaurant_id,
                    login_email=normalized_email,
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
            message="Registration approved, moved to restaurants, and removed from registrations.",
            restaurant_id=restaurant.restaurant_id,
        )

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error in POST /inscripciones/{inscripcion_id}/approve: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error while approving registration",
        )


@app.post(
    "/inscripciones/{inscripcion_id}/reject",
    response_model=InscripcionActionResponse,
    summary="Request changes or reject registration",
    tags=["Data"],
)
async def reject_inscripcion(inscripcion_id: int, db: Session = Depends(get_db)):
    """Rejects a registration and removes it from pending table."""
    try:
        inscripcion = (
            db.query(Inscripcion)
            .filter(Inscripcion.inscripcion_id == inscripcion_id)
            .first()
        )

        if not inscripcion:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Registration with ID {inscripcion_id} not found",
            )

        if inscripcion.login_email:
            normalized_email = inscripcion.login_email.strip().lower()
            db.query(User).filter(User.login_email == normalized_email).delete(synchronize_session=False)

        db.delete(inscripcion)
        db.commit()

        return InscripcionActionResponse(
            inscripcion_id=inscripcion_id,
            status="rechazada",
            message="Registration rejected and removed from pending list.",
        )

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error in POST /inscripciones/{inscripcion_id}/reject: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error while updating registration",
        )


@app.delete(
    "/inscripciones/history/approved",
    response_model=ClearApprovalHistoryResponse,
    summary="Limpiar historial de aprobadas",
    tags=["Data"],
)
async def clear_approval_history(db: Session = Depends(get_db)):
    """Removes approved registrations from history."""
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
        logger.error("Error in DELETE /inscripciones/history/approved: %s", str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error while limpiar historial de aprobaciones",
        )


@app.post(
    "/auth/login",
    response_model=AuthUserResponse,
    summary="Sign in",
    tags=["Auth"],
)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    """
    Login desde table users.
    
    - Busca el user en la table users por email
    - Verifica la password con hash PBKDF2
    - Si es admin (restaurant_id=0), retorna role="admin"
    - Si es restaurant normal (restaurant_id>0), retorna role="restaurant_owner"
    - Validates that is_active=True
    """
    # Buscar user en table users
    user = db.query(User).filter(
        User.login_email == request.email.strip().lower()
    ).first()
    
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Email o password no valids."
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="User is disabled."
        )
    
    # Determine role by restaurant_id
    role = "admin" if user.restaurant_id == 0 else "restaurant_owner"
    
    # Get restaurant data if not admin
    restaurant_id = user.restaurant_id if user.restaurant_id != 0 else None
    restaurant_name = None
    if restaurant_id:
        restaurant = db.query(Restaurant).filter(
            Restaurant.restaurant_id == restaurant_id
        ).first()
        if restaurant:
            restaurant_name = restaurant.name
    
    # Create token con rol y restaurant_id
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
    summary="Get current session",
    tags=["Auth"],
)
async def auth_me(authorization: str | None = Header(default=None), db: Session = Depends(get_db)):
    payload = _require_auth(authorization)
    token = _extract_bearer_token(authorization) or ""
    
    email = payload.get("email", "")
    role = payload.get("role", "")
    restaurant_id = payload.get("restaurant_id")
    restaurant_name = None
    
    # If role is restaurant_owner, get restaurant name
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
# ADMIN ENDPOINTS: USER MANAGEMENT
# =============================

@app.get(
    "/admin/users",
    response_model=list[UserAdminResponse],
    summary="Listar todos los users",
    tags=["Admin - Users"],
)
async def admin_list_users(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    """Devuelve todos los users registrados. Solo accesible por admin."""
    _require_admin_auth(authorization)

    users = db.query(User).order_by(User.user_id).all()

    # Load nombres de restaurants en batch
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
    summary="Create un user",
    tags=["Admin - Users"],
)
async def admin_create_user(
    body: UserCreateRequest,
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    """Crea un user manualmente (p. ej. el admin o un restaurant ya existente). Solo admin."""
    _require_admin_auth(authorization)

    email_normalized = body.email.strip().lower()
    if db.query(User).filter(User.login_email == email_normalized).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Ya existe un user con ese email.")

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
    summary="Update a user",
    tags=["Admin - Users"],
)
async def admin_update_user(
    user_id: int,
    body: UserUpdateRequest,
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    """Permite al admin activar/desactivar un user, cambiar su rol o email."""
    _require_admin_auth(authorization)

    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"User {user_id} not found.")

    if body.is_active is not None:
        user.is_active = body.is_active
    if body.role is not None:
        user.role = body.role
    if body.email is not None:
        email_normalized = body.email.strip().lower()
        conflict = db.query(User).filter(User.login_email == email_normalized, User.user_id != user_id).first()
        if conflict:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Ya existe un user con ese email.")
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
    summary="Restablecer password de un user",
    tags=["Admin - Users"],
)
async def admin_reset_password(
    user_id: int,
    body: UserResetPasswordRequest,
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    """Restablece la password de cualquier user. Solo admin."""
    _require_admin_auth(authorization)

    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"User {user_id} not found.")

    user.password_hash = hash_password(body.new_password)
    db.commit()
    return {"success": True, "message": f"Password del user {user_id} actualizada."}


@app.delete(
    "/admin/users/{user_id}",
    summary="Delete un user",
    tags=["Admin - Users"],
)
async def admin_delete_user(
    user_id: int,
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    """Elimina permanentemente un user. Solo admin."""
    _require_admin_auth(authorization)

    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"User {user_id} not found.")

    db.delete(user)
    db.commit()
    return {"success": True, "message": f"User {user_id} deleted."}


@app.post(
    "/auth/change-password",
    summary="Cambiar propia password",
    tags=["Auth"],
)
async def auth_change_password(
    body: UserResetPasswordRequest,
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    """Permite a cualquier user autenticado cambiar su propia password."""
    payload = _require_auth(authorization)
    email = payload.get("email", "")

    user = db.query(User).filter(User.login_email == email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    user.password_hash = hash_password(body.new_password)
    db.commit()
    return {"success": True, "message": "Password actualizada correctamente."}


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


def _dish_match_score(query_key: str, dish_key: str) -> float:
    """Devuelve un score [0..1] aproximado de similitud entre consulta y dish."""
    query_key = (query_key or "").strip()
    dish_key = (dish_key or "").strip()

    if not query_key or not dish_key:
        return 0.0
    if query_key == dish_key:
        return 1.0
    if query_key in dish_key:
        return 0.93

    query_tokens = [token for token in query_key.split() if len(token) >= 3]
    if query_tokens and all(token in dish_key for token in query_tokens):
        return 0.88

    return SequenceMatcher(None, query_key, dish_key).ratio()


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
    try:
        return datetime.now(ZoneInfo("Europe/Madrid")).date()
    except ZoneInfoNotFoundError:
        logger.warning(
            "ZoneInfo Europe/Madrid not available (tzdata missing). "
            "Using local system date."
        )
        return datetime.now().date()
    try:
        return datetime.now(ZoneInfo("Europe/Madrid")).date()
    except ZoneInfoNotFoundError:
        logger.warning(
            "ZoneInfo Europe/Madrid not available (tzdata missing). "
            "Using local system date."
        )
        return datetime.now().date()


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


@app.post(
    "/restaurants/{restaurant_id}/menu",
    response_model=DailyMenuResponse,
    summary="Publish daily menu",
    tags=["Restaurants"],
)
async def post_daily_menu(
    restaurant_id: int,
    request: DailyMenuRequest,
    db: Session = Depends(get_db),
):
    restaurant = db.query(Restaurant).filter(Restaurant.restaurant_id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Restaurant not found")

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
        logger.error("Error in POST /restaurants/%s/menu: %s", restaurant_id, str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error saving daily menu",
        )


@app.get(
    "/restaurants/{restaurant_id}/menu/today",
    response_model=DailyMenuResponse,
    summary="Get today's actual menu",
    tags=["Restaurants"],
)
async def get_daily_menu(
    restaurant_id: int,
    db: Session = Depends(get_db),
):
    service_date = _current_service_date()
    service_date_sql = service_date.isoformat()
    date_id = int(service_date.strftime("%Y%m%d"))

    # FIRST: Search in daily_menus (current daily menu)
    daily_menu = db.execute(
        text(
            """
            SELECT menu_id, starter, main, dessert
            FROM dbo.daily_menus
            WHERE restaurant_id = :restaurant_id AND CAST(date AS DATE) = :target_date
            ORDER BY created_at DESC
            """
        ),
        {"restaurant_id": restaurant_id, "target_date": service_date_sql},
    ).first()

    if daily_menu:
        # Menu uploaded today by the restaurant
        menu_id = int(daily_menu[0])
        starter_str = daily_menu[1] or ""
        main_str = daily_menu[2] or ""
        dessert_str = daily_menu[3] or ""

        grouped = {
            "first_course": [s.strip() for s in starter_str.split(";") if s.strip()],
            "second_course": [m.strip() for m in main_str.split(";") if m.strip()],
            "dessert": [d.strip() for d in dessert_str.split(";") if d.strip()],
        }

        restaurant = db.query(Restaurant).filter(Restaurant.restaurant_id == restaurant_id).first()

        return DailyMenuResponse(
            menu_id=menu_id,
            restaurant_id=restaurant_id,
            date=service_date,
            starter="; ".join(grouped["first_course"]) if grouped["first_course"] else None,
            main="; ".join(grouped["second_course"]) if grouped["second_course"] else None,
            dessert="; ".join(grouped["dessert"]) if grouped["dessert"] else None,
            includes_drink=False,  # daily_menus no tiene este campo; asumir False
            menu_price=restaurant.menu_price if restaurant else None,
        )

    # FALLBACK: Search in fact_menus (historical if available)
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
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="There is no menu published for today")

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


@app.get(
    "/restaurants/dish-search",
    response_model=DishSearchResponse,
    summary="Search restaurants by dish in today's menu (includes similar dishes)",
    tags=["Restaurants"],
)
async def search_restaurants_by_dish(
    query: str = Query(..., min_length=2, max_length=200),
    service_date: date | None = None,
    limit: int = Query(70, ge=1, le=200),
    db: Session = Depends(get_db),
):
    target_date = service_date or _current_service_date()
    date_id = int(target_date.strftime("%Y%m%d"))
    query_key = _normalize_dish_name(query)

    if not query_key:
        return DishSearchResponse(query=query, service_date=target_date, restaurants=[])

    query_tokens = [token for token in query_key.split() if len(token) >= 3]
    primary_token = max(query_tokens, key=len) if query_tokens else query_key
    like_pattern = f"%{primary_token}%"

    # 1) TODAY menu (if available)
    today_rows = db.execute(
        text(
            """
            SELECT fm.restaurant_id, d.dish_name
            FROM dbo.fact_menus fm
            INNER JOIN dbo.fact_menu_items fmi ON fmi.menu_id = fm.menu_id
            INNER JOIN dbo.dim_dishes d ON d.dish_id = fmi.dish_id
            WHERE fm.date_id = :date_id
            """
        ),
        {"date_id": date_id},
    ).fetchall()

    # 2) Historical (fact_*): dishes over time
    historical_rows = db.execute(
        text(
            """
            SELECT TOP 5000 fm.restaurant_id, d.dish_name, fm.date_id
            FROM dbo.fact_menus fm
            INNER JOIN dbo.fact_menu_items fmi ON fmi.menu_id = fm.menu_id
            INNER JOIN dbo.dim_dishes d ON d.dish_id = fmi.dish_id
            WHERE LOWER(d.dish_name) LIKE :pattern
            ORDER BY fm.date_id DESC
            """
        ),
        {"pattern": like_pattern},
    ).fetchall()

    # Aggregation by restaurant
    best_by_restaurant: dict[int, dict[str, Any]] = {}

    def ensure_payload(restaurant_id: int) -> dict[str, Any]:
        payload = best_by_restaurant.get(restaurant_id)
        if payload is None:
            payload = {
                "best_score_today": 0.0,
                "matches_today": [],
                "best_score_hist": 0.0,
                "matches_hist": [],
                "seen_count": 0,
                "last_seen": None,
            }
            best_by_restaurant[restaurant_id] = payload
        return payload

    for row in today_rows:
        restaurant_id = int(row[0])
        dish_name = " ".join(str(row[1] or "").strip().split())
        dish_key = _normalize_dish_name(dish_name)
        score = _dish_match_score(query_key, dish_key)

        payload = ensure_payload(restaurant_id)
        if score > float(payload["best_score_today"]):
            payload["best_score_today"] = score
        if score >= 0.75 and dish_name not in payload["matches_today"]:
            payload["matches_today"].append(dish_name)

    for row in historical_rows:
        restaurant_id = int(row[0])

        # row shape: (restaurant_id, dish_name, date_id)
        dish_candidates: list[str] = []
        dish_candidates.append(" ".join(str(row[1] or "").strip().split()))

        best_local = 0.0
        best_local_name = None
        for candidate in dish_candidates:
            candidate_key = _normalize_dish_name(candidate)
            score = _dish_match_score(query_key, candidate_key)
            if score > best_local:
                best_local = score
                best_local_name = candidate

        if best_local <= 0:
            continue

        payload = ensure_payload(restaurant_id)
        payload["seen_count"] += 1
        if best_local > float(payload["best_score_hist"]):
            payload["best_score_hist"] = best_local
        if best_local >= 0.75 and best_local_name and best_local_name not in payload["matches_hist"]:
            payload["matches_hist"].append(best_local_name)

        row_date_id = None
        if len(row) == 3:
            try:
                row_date_id = int(row[2])
            except Exception:
                row_date_id = None

        if row_date_id:
            try:
                last_seen_candidate = datetime.strptime(str(row_date_id), "%Y%m%d").date()
                current_last = payload["last_seen"]
                if current_last is None or last_seen_candidate > current_last:
                    payload["last_seen"] = last_seen_candidate
            except Exception:
                pass

    scored: list[DishSearchRestaurantResult] = []
    for restaurant_id, payload in best_by_restaurant.items():
        best_today = float(payload["best_score_today"])
        best_hist = float(payload["best_score_hist"])
        best_score = max(best_today, best_hist)
        if best_score < 0.66:
            continue

        in_today = best_today >= 0.66
        matches = (payload["matches_today"] if in_today else payload["matches_hist"])[:3]
        last_seen = target_date if in_today else payload["last_seen"]

        scored.append(
            DishSearchRestaurantResult(
                restaurant_id=int(restaurant_id),
                best_score=best_score,
                matches=matches,
                in_today_menu=in_today,
                last_seen=last_seen,
                seen_count=int(payload["seen_count"] or 0),
            )
        )

    scored.sort(
        key=lambda item: (
            item.in_today_menu,
            item.best_score,
            item.last_seen or date.min,
            item.seen_count,
        ),
        reverse=True,
    )

    return DishSearchResponse(query=query, service_date=target_date, restaurants=scored[:limit])


@app.post(
    "/ratings/dishes",
    response_model=DishRatingWriteResponse,
    summary="Valorar un dish de un restaurant",
    tags=["Ratings"],
)
async def rate_dish(
    body: DishRatingCreateRequest,
    db: Session = Depends(get_db),
):
    try:
        restaurant = db.query(Restaurant).filter(Restaurant.restaurant_id == body.restaurant_id).first()
        if not restaurant:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Restaurant not found")

        rating_date = body.rating_date or _current_service_date()
        rating_date_sql = rating_date.isoformat()
        dish_name = " ".join(body.dish_name.strip().split())
        dish_key = _normalize_dish_name(dish_name)
        if not dish_key:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid dish name")

        # Try to get menu_id from daily_menus (optional, may be None)
        menu_id: int | None = None
        menu_row = db.execute(
            text(
                """
                SELECT TOP 1 menu_id
                FROM dbo.daily_menus
                WHERE restaurant_id = :restaurant_id AND CAST(date AS DATE) = :rating_date
                ORDER BY menu_id DESC
                """
            ),
            {"restaurant_id": body.restaurant_id, "rating_date": rating_date_sql},
        ).first()
        if menu_row:
            menu_id = int(menu_row[0])

        # Save anonymous rating (with menu_id if available)
        new_rating = DishRating(
            restaurant_id=body.restaurant_id,
            rating_date=rating_date,
            dish_name=dish_name,
            dish_key=dish_key,
            rating=float(body.rating),  # Aceptar decimales
            menu_id=menu_id,
            created_at=datetime.utcnow(),
        )
        db.add(new_rating)
        db.flush()

        # UPDATE dish ranking: calculate average from all ratings
        avg_rating = db.execute(
            text(
                """
                SELECT AVG(CAST(rating AS FLOAT)) as avg_rating
                FROM dbo.dish_ratings
                WHERE restaurant_id = :restaurant_id AND dish_key = :dish_key AND rating_date = :rating_date
                """
            ),
            {
                "restaurant_id": body.restaurant_id,
                "dish_key": dish_key,
                "rating_date": rating_date,
            },
        ).scalar()

        db.commit()
        db.refresh(new_rating)

        logger.info(
            f"Rating saved: {dish_name} (avg: {avg_rating:.2f}) for restaurant_id={body.restaurant_id}"
        )

        return DishRatingWriteResponse(
            success=True,
            restaurant_id=body.restaurant_id,
            rating_date=rating_date,
            dish_name=dish_name,
            dish_key=dish_key,
            rating=float(body.rating),  # Retorna con decimales
        )

    except HTTPException:
        db.rollback()
        raise
    except Exception as exc:
        db.rollback()
        logger.error(f"Error saving rating: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error saving rating: {str(exc)}",
        )


@app.get(
    "/ratings/dishes/summary",
    response_model=DishRatingSummaryResponse,
    summary="Dish ratings summary by restaurant and day",
    tags=["Ratings"],
)
async def get_dish_rating_summary(
    restaurant_id: int = Query(..., ge=1),
    rating_date: date | None = None,
    db: Session = Depends(get_db),
):
    target_date = rating_date or _current_service_date()

    rows = (
        db.query(
            func.max(DishRating.dish_name).label("dish_name"),
            DishRating.dish_key.label("dish_key"),
            func.avg(DishRating.rating).label("avg_rating"),
            func.count(DishRating.rating).label("votes"),
        )
        .filter(
            DishRating.restaurant_id == restaurant_id,
            DishRating.rating_date == target_date,
        )
        .group_by(DishRating.dish_key)
        .all()
    )

    items: list[DishRatingSummaryItem] = []
    for row in rows:
        dish_name = " ".join(str(row.dish_name or "").strip().split())
        dish_key = str(row.dish_key or "").strip()
        items.append(
            DishRatingSummaryItem(
                dish_name=dish_name,
                dish_key=dish_key,
                avg_rating=float(row.avg_rating or 0.0),
                votes=int(row.votes or 0),
            )
        )

    items.sort(key=lambda item: (item.avg_rating, item.votes), reverse=True)

    return DishRatingSummaryResponse(
        restaurant_id=restaurant_id,
        rating_date=target_date,
        items=items,
    )


@app.get(
    "/rankings/restaurants",
    response_model=RestaurantRankingResponse,
    summary="Ranking de restaurants basado en valoraciones de dishes",
    tags=["Ratings"],
)
async def get_restaurant_rankings(
    order_by: Literal["avg", "votes", "trend"] = "avg",
    date_to: date | None = None,
    days: int = Query(14, ge=7, le=90),
    db: Session = Depends(get_db),
):
    target_to = date_to or _current_service_date()
    target_from = target_to - timedelta(days=days - 1)

    last7_start = target_to - timedelta(days=6)
    prev7_start = target_to - timedelta(days=13)
    prev7_end = target_to - timedelta(days=7)

    service_date = DishRating.rating_date

    rows = (
        db.query(
            DishRating.restaurant_id.label("restaurant_id"),
            func.avg(DishRating.rating).label("avg_rating"),
            func.count(DishRating.rating).label("votes"),
            func.avg(
                case(
                    (service_date >= last7_start, DishRating.rating),
                    else_=None,
                )
            ).label("avg_last_7"),
            func.avg(
                case(
                    (service_date.between(prev7_start, prev7_end), DishRating.rating),
                    else_=None,
                )
            ).label("avg_prev_7"),
        )
        .filter(service_date.between(target_from, target_to))
        .group_by(DishRating.restaurant_id)
        .all()
    )

    items: list[RestaurantRankingItem] = []
    for row in rows:
        avg_rating = float(row.avg_rating) if row.avg_rating is not None else None
        votes = int(row.votes or 0)

        avg_last_7 = float(row.avg_last_7) if row.avg_last_7 is not None else None
        avg_prev_7 = float(row.avg_prev_7) if row.avg_prev_7 is not None else None
        trend_7d = (avg_last_7 - avg_prev_7) if (avg_last_7 is not None and avg_prev_7 is not None) else None

        items.append(
            RestaurantRankingItem(
                restaurant_id=int(row.restaurant_id),
                avg_rating=avg_rating,
                votes=votes,
                trend_7d=trend_7d,
            )
        )

    if order_by == "votes":
        items.sort(key=lambda item: (item.votes, item.avg_rating or 0.0), reverse=True)
    elif order_by == "trend":
        items.sort(key=lambda item: (item.trend_7d is not None, item.trend_7d or -999, item.avg_rating or 0.0), reverse=True)
    else:
        items.sort(key=lambda item: (item.avg_rating or 0.0, item.votes), reverse=True)

    return RestaurantRankingResponse(
        date_from=target_from,
        date_to=target_to,
        order_by=order_by,
        restaurants=items,
    )


@app.get(
    "/rankings/dishes",
    response_model=DishRankingResponse,
    summary="Ranking de dishes basado en valoraciones",
    tags=["Ratings"],
)
async def get_dish_rankings(
    order_by: Literal["avg", "votes", "trend"] = "avg",
    date_to: date | None = None,
    days: int = Query(14, ge=7, le=90),
    limit: int = Query(50, ge=1, le=500),
    min_votes: int = Query(1, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    target_to = date_to or _current_service_date()
    target_from = target_to - timedelta(days=days - 1)

    last7_start = target_to - timedelta(days=6)
    prev7_start = target_to - timedelta(days=13)
    prev7_end = target_to - timedelta(days=7)

    service_date = DishRating.rating_date

    # CHANGE: Group by restaurant_id + dish_key to include daily-menu ratings
    rows = (
        db.query(
            DishRating.restaurant_id.label("restaurant_id"),
            func.max(Restaurant.name).label("restaurant_name"),
            func.max(DishRating.dish_name).label("dish_name"),
            DishRating.dish_key.label("dish_key"),
            func.avg(DishRating.rating).label("avg_rating"),
            func.count(DishRating.rating).label("votes"),
            func.avg(
                case(
                    (service_date >= last7_start, DishRating.rating),
                    else_=None,
                )
            ).label("avg_last_7"),
            func.avg(
                case(
                    (service_date.between(prev7_start, prev7_end), DishRating.rating),
                    else_=None,
                )
            ).label("avg_prev_7"),
        )
        .join(Restaurant, DishRating.restaurant_id == Restaurant.restaurant_id)
        .filter(
            service_date.between(target_from, target_to),
            DishRating.dish_key.isnot(None),
        )
        .group_by(DishRating.restaurant_id, DishRating.dish_key)
        .having(func.count(DishRating.rating) >= min_votes)
        .all()
    )

    items: list[DishRankingItem] = []
    for row in rows:
        avg_rating = float(row.avg_rating) if row.avg_rating is not None else None
        votes = int(row.votes or 0)

        avg_last_7 = float(row.avg_last_7) if row.avg_last_7 is not None else None
        avg_prev_7 = float(row.avg_prev_7) if row.avg_prev_7 is not None else None
        trend_7d = (avg_last_7 - avg_prev_7) if (avg_last_7 is not None and avg_prev_7 is not None) else None

        dish_name = " ".join(str(row.dish_name or "").strip().split())
        restaurant_name = " ".join(str(row.restaurant_name or "").strip().split())
        items.append(
            DishRankingItem(
                dish_id=None,  # No asignamos dish_id, usamos dish_name como identificador
                dish_name=dish_name,
                restaurant_id=int(row.restaurant_id),
                restaurant_name=restaurant_name,
                avg_rating=avg_rating,
                votes=votes,
                trend_7d=trend_7d,
            )
        )

    if order_by == "votes":
        items.sort(key=lambda item: (item.votes, item.avg_rating or 0.0), reverse=True)
    elif order_by == "trend":
        items.sort(key=lambda item: (item.trend_7d is not None, item.trend_7d or -999, item.avg_rating or 0.0), reverse=True)
    else:
        items.sort(key=lambda item: (item.avg_rating or 0.0, item.votes), reverse=True)

    return DishRankingResponse(
        date_from=target_from,
        date_to=target_to,
        order_by=order_by,
        dishes=items[:limit],
    )


def _ensure_prediction_engine_loaded() -> bool:
    global prediction_engine
    if prediction_engine is not None:
        return True
    try:
        prediction_engine = PredictionEngine()
        logger.info("Prediction engine initialized (lazy)")
        return True
    except Exception as engine_error:
        logger.error("Could not initialize PredictionEngine: %s", str(engine_error), exc_info=True)
        return False


def _ensure_unified_menu_model_loaded(app: FastAPI) -> bool:
    if hasattr(app.state, "model") and app.state.model is not None:
        return True
    try:
        model_path = _resolve_unified_menu_model_path()
        try:
            import onnx  # noqa: F401
            import onnxruntime  # noqa: F401
        except ImportError:
            pass
        with open(model_path, "rb") as f:
            app.state.model = pickle.load(f)
        logger.info("Menu model loaded in app.state (lazy): %s", model_path.name)
        return True
    except Exception as model_error:
        logger.error("Error loading menu model (lazy): %s", str(model_error), exc_info=True)
        return False


def get_model_lazy():
    """Compatibilidad: algunos endpoints llaman a get_model_lazy()."""
    if not _ensure_unified_menu_model_loaded(app):
        raise RuntimeError("Menu model not available")
    model = getattr(app.state, "model", None)
    if model is None:
        raise RuntimeError("Menu model not available")
    return model


# =============================
# ENDPOINTS FOR RESTAURANT IMAGES
# =============================

@app.post("/upload-inscripcion-image")
async def post_upload_inscripcion_image(
    file: UploadFile = File(...),
):
    """
    Upload image used during inscription onboarding.

    Returns a public image URL that can be stored as `image_url` in dbo.inscriptions.
    """
    try:
        file_content = await file.read()

        if not file.content_type or "image" not in file.content_type:
            raise HTTPException(status_code=400, detail="Invalid file type. Images only.")

        if len(file_content) > 5 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large (max 5MB)")

        extension = Path(file.filename or "image.jpg").suffix.lower() or ".jpg"
        if extension not in {".jpg", ".jpeg", ".png", ".webp", ".gif"}:
            raise HTTPException(status_code=400, detail="Formato no permitido. Usa JPG, PNG, WEBP o GIF.")

        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        unique_suffix = uuid4().hex[:8]
        blob_filename = f"ins_{timestamp}_{unique_suffix}{extension}"

        blob_manager = get_blob_manager()
        blob_name = blob_manager.upload_restaurant_image(
            restaurant_id=0,
            file_content=file_content,
            filename=blob_filename,
        )

        if not blob_name:
            raise HTTPException(status_code=500, detail="Error in la carga del archivo")

        image_url = blob_manager.get_blob_sas_url(blob_name)
        if not image_url:
            raise HTTPException(status_code=500, detail="Error generando URL de acceso")

        logger.info("Registration image uploaded: %s", blob_name)
        return {
            "success": True,
            "image_url": image_url,
            "message": "Imagen subida exitosamente",
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error uploading registration image: %s", str(e), exc_info=True)
        raise HTTPException(status_code=500, detail="Error in la carga")

@app.post("/upload-restaurant-image")
async def post_upload_restaurant_image(
    restaurant_id: int = Form(...),
    file: UploadFile = File(...),
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    """
    Upload restaurant image to Blob Storage (container: fotos)
    
    - Admin: puede subir fotos para cualquier restaurant
    - Restaurant owner: puede subir fotos solo para su propio restaurant
    """
    payload = _require_auth(authorization)
    role = payload.get("role")
    user_restaurant_id = payload.get("restaurant_id")
    
    # Validar permisos
    if role == "admin":
        # Admin puede subir para cualquier restaurant
        pass
    elif role == "restaurant_owner":
        # Restaurant owner solo puede subir para su propio restaurant
        if user_restaurant_id != restaurant_id:
            raise HTTPException(
                status_code=403, 
                detail="No tienes permisos para subir fotos a este restaurant"
            )
    else:
        raise HTTPException(status_code=403, detail="Rol no autorizado")
    
    restaurant = db.query(Restaurant).filter(Restaurant.restaurant_id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    try:
        file_content = await file.read()
        if not file.content_type or "image" not in file.content_type:
            raise HTTPException(status_code=400, detail="Invalid file type. Images only.")
        
        if len(file_content) > 5 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large (max 5MB)")
        
        # Nombre del blob: res_{restaurant_id}.jpg
        blob_filename = f"res_{restaurant_id}.jpg"
        
        blob_manager = get_blob_manager()
        blob_name = blob_manager.upload_restaurant_image(
            restaurant_id=restaurant_id,
            file_content=file_content,
            filename=blob_filename
        )
        
        if not blob_name:
            raise HTTPException(status_code=500, detail="Error in la carga del archivo")
        
        sas_url = blob_manager.get_blob_sas_url(blob_name)
        if not sas_url:
            raise HTTPException(status_code=500, detail="Error generando URL de acceso")
        
        restaurant.image_url = sas_url
        db.commit()
        db.refresh(restaurant)
        
        logger.info(f"Photo uploaded for restaurant {restaurant_id}: {blob_name}")
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
        raise HTTPException(status_code=500, detail="Error in la carga")


@app.get("/get-restaurant-image/{restaurant_id}")
async def get_rest_image(restaurant_id: int, db: Session = Depends(get_db)):
    """Get restaurant image URL from Azure Storage or default image"""
    try:
        restaurant = db.query(Restaurant).filter(Restaurant.restaurant_id == restaurant_id).first()
        
        if not restaurant:
            logger.warning(f"Restaurant not found: {restaurant_id}")
            raise HTTPException(status_code=404, detail="Restaurant not found")
        
        # Try to get image from Azure Storage first
        azure_image_url = get_restaurant_image_url(restaurant_id)
        logger.info(f"Generated Azure URL for restaurant {restaurant_id}: {azure_image_url}")
        
        if restaurant.image_url:
            logger.info(f"Using stored image URL for restaurant {restaurant_id}")
            return {"image_url": restaurant.image_url, "is_default": False, "restaurant_id": restaurant_id}
        
        # Return Azure Storage URL
        logger.info(f"Returning Azure Storage URL for restaurant {restaurant_id}")
        return {"image_url": azure_image_url, "is_default": False, "restaurant_id": restaurant_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting restaurant image for {restaurant_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error getting image: {str(e)}")


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
        
        logger.info(f"Image uploaded for restaurant {restaurant_id}: {blob_name}")
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
    summary="Update restaurant image (legacy)",
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
    
    Actualiza la URL de imagen del restaurant.
    Mantener por compatibilidad con versiones antiguas.
    """
    payload = _require_auth(authorization)
    if payload.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No autorizado.")

    restaurant = db.query(Restaurant).filter(Restaurant.restaurant_id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Restaurant not found.")

    restaurant.image_url = request.image_url.strip()
    db.commit()
    db.refresh(restaurant)
    return RestaurantDetailItem.from_orm(restaurant)



# ============================================================================
# HELPER FUNCTIONS FOR AUTOMATIC CALCULATION
# ============================================================================

def calculate_distance_haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculates distance in kilometers between two geographic points using the Haversine formula.
    
    Args:
        lat1, lon1: Coordenadas del user (latitud, longitud en grados)
        lat2, lon2: Coordenadas del restaurant (latitud, longitud en grados)
        
    Returns:
        float: Distance in kilometers
    """
    R = 6371  # Radio de la Tierra en km
    
    lat1_rad = math.radians(lat1)
    lon1_rad = math.radians(lon1)
    lat2_rad = math.radians(lat2)
    lon2_rad = math.radians(lon2)
    
    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad
    
    a = math.sin(dlat / 2) ** 2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2) ** 2
    c = 2 * math.asin(math.sqrt(a))
    
    return R * c


def get_weather_data(service_date: date) -> dict:
    """
    Retrieves weather data from Open-Meteo for Azca (Madrid).
    
    Open-Meteo is a free weather API that does not require an API key.
    Azca Madrid coordinates (Bernabeu): 40.4532° N, -3.6885° W
    
    Args:
        service_date: Date para la cual se obtiene el clima (date object)
        
    Returns:
        dict: {
            'max_temp_c': float (maximum temperature in C),
            'precipitation_mm': float (precipitation in mm),
            'is_rain_service_peak': bool (si llueve en horas pico 12-20)
        }
    """
    # Azca coordinates (Madrid, near Bernabeu)
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
            
            # Find indexes for hours 12-20 of requested day
            peak_hours_rain = sum(
                1 for i, t in enumerate(hourly_times)
                if service_date.strftime('%Y-%m-%d') in t and 
                   12 <= int(t.split('T')[1].split(':')[0]) < 20 and
                   hourly_precip[i] > 0
            )
            is_rain_peak = peak_hours_rain > 0
        
        return {
            'max_temp_c': float(max_temp),
            'precipitation_mm': float(precipitation),
            'is_rain_service_peak': is_rain_peak,
        }
        
    except requests.exceptions.RequestException as e:
        logger.warning(f" Open-Meteo not available: {str(e)[:50]}, using default values")
        return {
            'max_temp_c': 20.0,
            'precipitation_mm': 0.0,
            'is_rain_service_peak': False,
        }


def get_services_data(db: Session, restaurant_id: int, service_date: date, capacity_limit: int) -> dict:
    """
    Recupera services_lag_7 y avg_4_weeks desde fact_services.
    
    If the exact date does not exist (e.g., future dates), find the most recent record
    para ese restaurant. Si no hay registros, usa valores por defecto (70% capacidad).
    
    Args:
        db: Database session
        restaurant_id: ID del restaurant
        service_date: Date del service (date object)
        capacity_limit: Restaurant capacity (for fallback calculation)
        
    Returns:
        dict: {'services_lag_7': float, 'avg_4_weeks': float}
    """
    # Convertir date YYYY-MM-DD a YYYYMMDD (formato date_id)
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
    
    # 2. If not found, search for the most recent record
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
    Automatically calculates calendar parameters based on date.
    Uses the 'holidays' library for Spanish holidays in Madrid (Azca location).
    
    Args:
        service_date: Date del service (date object)
        
    Returns:
        dict: {
            'is_business_day': bool (lunes-viernes),
            'is_holiday': bool (festivos en Madrid),
            'is_bridge_day': bool (puente festivo),
            'is_payday_week': bool (semana de pago)
        }
    """
    # Initialize Spanish holiday calendar (Madrid subdivision)
    es_holidays = holidays.Spain(subdiv='MD')
    
    weekday = service_date.weekday()  # 0=lunes, 6=domingo
    
    # 1. is_business_day: lunes(0) a viernes(4)
    is_business_day = weekday < 5
    
    # 2. is_holiday: present in Madrid holiday calendar
    is_holiday = service_date in es_holidays
    
    # 3. is_bridge_day: day between holiday and weekend
    # (e.g., Friday after a holiday, or Monday before a holiday)
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
    
    # 4. is_payday_week: last days of month (25-31)
    # Typically between 25-31 of the month
    day_of_month = service_date.day
    is_payday_week = 25 <= day_of_month <= 31
    
    return {
        'is_business_day': is_business_day,
        'is_holiday': is_holiday,
        'is_bridge_day': is_bridge_day,
        'is_payday_week': is_payday_week,
    }


def _get_total_course_count(db: Session, restaurant_id: int, course_column, fallback: int = 30) -> int:
    """Estimates service volume for a course using historical and operational fallback data."""
    recent_services = (
        db.query(FactServices.avg_4_weeks)
        .filter(FactServices.restaurant_id == restaurant_id)
        .order_by(desc(FactServices.date_id))
        .first()
    )
    if recent_services and recent_services[0]:
        return max(1, int(round(float(recent_services[0]))))

    historical_rows = (
        db.query(func.count())
        .select_from(MenusAzca)
        .filter(
            MenusAzca.restaurant_id == restaurant_id,
            course_column.is_not(None),
            course_column != "",
        )
        .scalar()
    )
    if historical_rows and historical_rows > 0:
        return int(historical_rows)

    restaurant = db.query(Restaurant).filter(Restaurant.restaurant_id == restaurant_id).first()
    if restaurant and restaurant.capacity_limit and restaurant.capacity_limit > 0:
        return max(1, int(round(float(restaurant.capacity_limit) * 0.7)))

    return fallback


def get_total_starters(db: Session, restaurant_id: int) -> int:
    return _get_total_course_count(db, restaurant_id, MenusAzca.first_course)


def get_total_mains(db: Session, restaurant_id: int) -> int:
    return _get_total_course_count(db, restaurant_id, MenusAzca.second_course)


def get_total_desserts(db: Session, restaurant_id: int) -> int:
    return _get_total_course_count(db, restaurant_id, MenusAzca.dessert)


def get_restaurant_historical_dish_ids(
    db: Session,
    restaurant_id: int,
    course_type: str,
) -> list[int]:
    """Gets restaurant historical dishes for the selected course."""
    rows = (
        db.query(distinct(DimDishes.dish_id))
        .join(FactMenuItems, DimDishes.dish_id == FactMenuItems.dish_id)
        .join(FactMenus, FactMenuItems.menu_id == FactMenus.menu_id)
        .filter(
            FactMenus.restaurant_id == restaurant_id,
            DimDishes.course_type == course_type,
        )
        .all()
    )
    dish_ids = [int(dish_id) for (dish_id,) in rows if dish_id is not None]
    if dish_ids:
        return dish_ids

    fallback_rows = (
        db.query(DimDishes.dish_id)
        .filter(DimDishes.course_type == course_type)
        .all()
    )
    return [int(dish_id) for (dish_id,) in fallback_rows if dish_id is not None]


def get_prev_dish_id(db: Session, restaurant_id: int, course_type: str) -> float:
    """
    Gets ID of most recently served dish of a type (course_type) in a restaurant.
    
    OPTIMIZADO: Ahora accede a la vista v_current_restaurant_context en lugar de hacer
    multiple manual JOINs. Depending on course_type, returns last_starter_id, last_main_id, or last_dessert_id.
    
    Args:
        db: SQLAlchemy session
        restaurant_id: ID del restaurant
        course_type: Tipo de dish ('first_course', 'second_course', 'dessert')
    
    Returns:
        dish_id of most recent dish (float). If no data, returns 0.0.
    """
    try:
        # Acceder a la vista optimizada v_current_restaurant_context
        context = db.query(RestaurantContext).filter(
            RestaurantContext.restaurant_id == restaurant_id
        ).first()
        
        if not context:
            logger.warning(f"Restaurant {restaurant_id} not found en v_current_restaurant_context")
            return 0.0
        
        # Mapear course_type a el campo correspondiente de la vista
        if course_type == 'first_course':
            prev_dish_id = context.last_starter_id
        elif course_type == 'second_course':
            prev_dish_id = context.last_main_id
        elif course_type == 'dessert':
            prev_dish_id = context.last_dessert_id
        else:
            logger.warning(f"course_type invalid: {course_type}")
            return 0.0
        
        if prev_dish_id:
            logger.info(f"prev_dish_id for {course_type}: {prev_dish_id} (from view)")
            return float(prev_dish_id)
        else:
            logger.info(f"No historical data for {course_type}; using 0.0")
            return 0.0
            
    except Exception as e:
        logger.error(f"Error obteniendo prev_dish_id from view: {str(e)}", exc_info=True)
        return 0.0


def get_dish_name_by_id(db: Session, dish_id: int) -> str:
    """
    Obtiene el nombre del dish (dish_name) desde dim_dishes usando dish_id.
    
    Args:
        db: SQLAlchemy session
        dish_id: ID del dish
    
    Returns:
        Dish name (string). Raises exception if it does not exist.
    """
    dish = db.query(DimDishes.dish_name).filter(
        DimDishes.dish_id == dish_id
    ).first()
    
    if not dish:
        raise ValueError(f"Dish with dish_id={dish_id} not found in dim_dishes. Is your model predicting non-existent IDs?")
    
    return dish[0]


def resolve_dish_name(db: Session, dish_identifier) -> str | None:
    if dish_identifier is None:
        return None

    if isinstance(dish_identifier, int) or str(dish_identifier).isdigit():
        dish = db.query(DimDishes).filter(DimDishes.dish_id == int(dish_identifier)).first()
        return dish.dish_name if dish else None

    normalized_name = str(dish_identifier).strip().lower()
    dish = db.query(DimDishes).filter(func.lower(DimDishes.dish_name) == normalized_name).first()
    return dish.dish_name if dish else None


def resolve_dish_id(db: Session, dish_name: str | None) -> int | None:
    if not dish_name:
        return None

    dish = (
        db.query(DimDishes)
        .filter(func.lower(DimDishes.dish_name) == str(dish_name).strip().lower())
        .first()
    )
    return int(dish.dish_id) if dish else None


def save_prediction_log(
    db: Session,
    restaurant_id: int,
    prediction_domain: str,
    input_context: dict,
    output_results: list,
    model_version: str,
    latency_ms: int,
) -> int:
    """
    Stores a full prediction in fact_prediction_logs for auditing.
    
    Centraliza todas las predictions (menus, services) en una sola table con formato JSON.
    
    Args:
        db: SQLAlchemy session
        restaurant_id: ID del restaurant
        prediction_domain: Tipo de prediction ('MENU_STARTER', 'MENU_MAIN', 'MENU_DESSERT', 'SERVICE_LEVEL')
        input_context: Dict con los inputs (clima, calendario, etc.)
        output_results: List de tuples [(dish_id, probability), ...] o scalar para services
        model_version: Model version
        latency_ms: Execution time in ms
        
    Returns:
        prediction_id saved en BD
    """
    try:
        # Convertir input_context a JSON
        input_json = json.dumps(input_context, default=str)
        
        # Convertir output_results a JSON
        # If it is a menu: [(dish_id, prob), ...] -> [{"id": dish_id, "prob": prob}, ...]
        # If it is a service: scalar -> {"level": value}
        if isinstance(output_results, list) and len(output_results) > 0 and isinstance(output_results[0], tuple):
            # It is a menu (list of tuples)
            output_json = json.dumps(
                [{"id": int(r[0]), "probability": float(r[1])} for r in output_results],
                default=str
            )
        else:
            # Es service (scalar o valor simple)
            output_json = json.dumps({"level": output_results}, default=str)
        
        # Create log with explicit execution_date
        prediction_log = FactPredictionLog(
            execution_date=datetime.now(),  # Asegurar que se setea la date
            restaurant_id=restaurant_id,
            prediction_domain=prediction_domain,
            input_context_json=input_json,
            output_results_json=output_json,
            model_version=model_version,
            latency_ms=latency_ms,
        )
        
        db.add(prediction_log)
        db.commit()
        db.refresh(prediction_log)
        
        logger.info(f"Prediction saved in fact_prediction_logs (ID: {prediction_log.prediction_id}, domain: {prediction_domain}, latency: {latency_ms}ms)")
        
        return prediction_log.prediction_id
        
    except Exception as e:
        logger.error(f"Error saving prediction log: {str(e)}", exc_info=True)
        try:
            db.rollback()
        except:
            pass
        return -1


def predict_top3_dishes(model, features_dict: dict, allowed_dish_ids: list[int] | None = None, top_k: int = 3, db: Session | None = None) -> list[tuple[int, float]]:
    """Genera un ranking de dishes candidatos usando el nuevo modelo de menus."""
    logger.info("Predicting for each historical dish...")
    logger.info(f"   Tipo de modelo: {type(model).__name__}")

    if not allowed_dish_ids:
        logger.warning("No candidate dishes to predict")
        return []

    predictions_by_dish: list[tuple[int, float]] = []
    for dish_id in allowed_dish_ids:
        try:
            dish_name = get_dish_name_by_id(db, dish_id) if db else f"Dish_{dish_id}"
            dish_features = features_dict.copy()
            dish_features["dish_id"] = str(dish_id)
            dish_features["dish_name"] = dish_name
            df_dish = pd.DataFrame([dish_features])
            prediction = model.predict(df_dish)
            score = float(prediction[0]) if hasattr(prediction, "__iter__") else float(prediction)
            predictions_by_dish.append((int(dish_id), score))
        except Exception as error:
            logger.warning(f"Error predicting dish_id={dish_id}: {str(error)[:100]}")

    ranked_predictions = sorted(predictions_by_dish, key=lambda item: item[1], reverse=True)
    result = ranked_predictions[:top_k]
    if result:
        logger.info(f"Top {len(result)} predictions: {result}")
        return result

    logger.error("Could not get predictions for any dish")
    return []


# ============================================================================
# FUNCIONES OCR (HEAD)
# ============================================================================

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
        raise RuntimeError("Document Intelligence did not return extractable text.")

    return extracted_text, "azure_document_intelligence"


def to_ranked_dishes(
    items: list[tuple[str, float]],
    db: Session | None = None,
) -> list[OCRPredictedDish]:
    """Convierte lista [(name, score)] en objetos tipados con ranking.

    If `db` is passed, it will try to resolve numeric IDs to names in dim_dishes.
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
    """Converts extractor output into the standard response model."""
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
    Persists OCR-extracted dishes into dim_dishes.

    course_type uses values: first_course, second_course, dessert.
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
    summary="Upload menu and run OCR section detection only",
    tags=["Predictions"],
    status_code=status.HTTP_200_OK,
)
async def extract_menu_sections_ocr_only(
    menu_file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    Pure OCR flow (without ML prediction):
    1) OCR con Azure Document Intelligence.
    2) Parser to detect starter, main, and dessert.

    Request multipart/form-data:
    - menu_file: archivo (PDF/JPG/PNG, etc.)
    """
    try:
        file_bytes = await menu_file.read()
        if not file_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded menu file is empty.",
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
        logger.error(f"OCR not available: {runtime_error}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(runtime_error),
        )
    except Exception as exc:
        logger.error(f"Error in /ocr/menu-sections: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal error while processing menu OCR.",
        )


@app.post(
    "/restaurants/{restaurant_id}/menu-upload",
    response_model=dict,
    tags=["Restaurants"],
    summary="Upload restaurant menu (automatic OCR)",
)
async def upload_restaurant_menu(
    restaurant_id: int,
    menu_file: UploadFile = File(...),
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    """
    Uploads a menu for a specific restaurant and extracts dishes with OCR.
    Only the restaurant owner or an administrator can perform this action.
    """
    payload = _require_auth(authorization)
    role = payload.get("role")
    user_restaurant_id = payload.get("restaurant_id")
    
    # Validate permissions
    if role == "restaurant_owner" and user_restaurant_id != restaurant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="You do not have permission to upload the menu for this restaurant"
        )
    elif role not in ("admin", "restaurant_owner"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized role")
        
    restaurant = db.query(Restaurant).filter(Restaurant.restaurant_id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Restaurant not found")

    try:
        file_bytes = await menu_file.read()
        if not file_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded menu file is empty.",
            )

        raw_text, ocr_provider = extract_menu_text_with_default_ocr(
            file_bytes=file_bytes,
            content_type=menu_file.content_type,
        )
        sections = MenuSectionExtractor.extract(raw_text)
        
        # Optional: persist extracted dishes
        persist_extracted_dishes(db, sections)
        
        # Create a MenusAzca record for today and this restaurant
        today = datetime.now().date()
        
        starter = next((s[0] for s in sections.get("starter", []) if s), None)
        main = next((s[0] for s in sections.get("main", []) if s), None)
        dessert = next((s[0] for s in sections.get("dessert", []) if s), None)
        
        # GUARDAR EN daily_menus para archivado posterior a fact_menus
        daily_menu = DailyMenu(
            restaurant_id=restaurant_id,
            date=today,
            starter=starter,
            main=main,
            dessert=dessert,
            created_at=datetime.now(),
        )
        db.add(daily_menu)
        db.commit()
        db.refresh(daily_menu)
        logger.info(f"Menu saved in daily_menus (menu_id={daily_menu.menu_id}) for {restaurant_id} en {today}")
        
        extracted_menu_data = build_extracted_menu(sections)

        return {
            "success": True,
            "restaurant_id": restaurant_id,
            "menu_id": daily_menu.menu_id,
            "date": str(today),
            "message": "Menu procesado exitosamente por OCR y saved en daily_menus.",
            "ocr_provider": ocr_provider,
            "extracted_menu": extracted_menu_data.dict()
        }

    except HTTPException:
        raise
    except RuntimeError as runtime_error:
        logger.error(f"OCR not available: {runtime_error}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(runtime_error),
        )
    except Exception as exc:
        logger.error(f"Error procesando menu para restaurant {restaurant_id}: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal error while processing menu OCR.",
        )


@app.post(
    "/predict",
    response_model=PredictionResponse,
    summary="Run Prediction",
    tags=["Predictions"],
    status_code=status.HTTP_201_CREATED,
)
async def create_prediction(
    request: PredictionRequest,
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    """
    Runs a service-demand prediction.

    **Flow:**
    1. Validates input parameters (Pydantic)
    2. Llama al motor de IA (PredictionEngine)
    3. Stores the result in audit logs (Azure SQL)
    4. Returns the prediction

    **JSON body parameters:**
    - `service_date`: Date to predict for (YYYY-MM-DD)
    - `max_temp_c`: Maximum temperature in Celsius
    - `precipitation_mm`: Precipitation in millimeters
    - `is_stadium_event`: Whether there is a stadium event
    - `is_payday_week`: Whether it is payday week

    Args:
        request: PredictionRequest object with parameters
        db: Database session (injected by FastAPI)

    Returns:
        PredictionResponse: Prediction and metadata

    Raises:
        HTTPException: If prediction fails
    """
    # Verify that caller is admin or owner of the restaurant
    _require_restaurant_or_admin_auth(authorization, request.restaurant_id)
    
    global prediction_engine

    # Validation: loaded engine
    if prediction_engine is None:
        logger.error("Prediction engine not initialized")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Prediction engine not available. Restart the API.",
        )

    try:
        # Automatically calculate calendar features
        calendar_features = calculate_calendar_features(request.service_date)
        
        # Retrieve historical data from fact_services
        # (services_lag_7 and avg_4_weeks from DB, with 70% capacity fallback)
        services_data = get_services_data(
            db=db,
            restaurant_id=request.restaurant_id,
            service_date=request.service_date,
            capacity_limit=request.capacity_limit
        )
        
        # Retrieve weather data from Open-Meteo
        weather_data = get_weather_data(request.service_date)
        
        # Build engine input (request + auto-calculated features)
        input_data = {
            "service_date": request.service_date,
            "restaurant_id": request.restaurant_id,
            "max_temp_c": weather_data['max_temp_c'],  # FROM Open-Meteo
            "precipitation_mm": weather_data['precipitation_mm'],  # FROM Open-Meteo
            "is_rain_service_peak": weather_data['is_rain_service_peak'],  # FROM Open-Meteo
            "is_stadium_event": request.is_stadium_event,
            "is_azca_event": request.is_azca_event,
            "is_holiday": calendar_features['is_holiday'],  # CALCULATED
            "is_bridge_day": calendar_features['is_bridge_day'],  # CALCULATED
            "is_payday_week": calendar_features['is_payday_week'],  # CALCULATED
            "is_business_day": calendar_features['is_business_day'],  # CALCULATED
            "services_lag_7": services_data['services_lag_7'],  # FROM fact_services
            "avg_4_weeks": services_data['avg_4_weeks'],  # FROM fact_services
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

        # LOG: prediction input
        logger.info("="*80)
        logger.info("POST /predict - request received")
        logger.info("="*80)
        logger.info(f"Input: restaurant_id={request.restaurant_id}, date={request.service_date}")
        logger.info(f"   Events: stadium={request.is_stadium_event}, azca={request.is_azca_event}")
        logger.info("   Auto-calculated parameters:")
        logger.info(f"   Weather: temp={weather_data['max_temp_c']}C, precip={weather_data['precipitation_mm']:.1f}mm")
        logger.info(f"   Calendar: business_day={calendar_features['is_business_day']}, holiday={calendar_features['is_holiday']}, payday={calendar_features['is_payday_week']}")
        logger.info(f"   History: lag_7={services_data['services_lag_7']}, avg_4w={services_data['avg_4_weeks']}")
        logger.info("="*80)

        # Llamar al motor de IA
        try:
            prediction_result = prediction_engine.predict("azca-services-model", input_data)
        except Exception as engine_error:
            logger.error("Runtime error in services engine", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=(
                    "Error in services prediction engine. "
                    f"Detail: {type(engine_error).__name__}: {str(engine_error)[:220]}"
                ),
            ) from engine_error

        # Create audit record
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

        # Store in database
        try:
            db.add(prediction_log)
            db.commit()
            db.refresh(prediction_log)
            logger.info(
                f"Prediction saved (ID: {prediction_log.id}, "
                f"Result: {prediction_result})"
            )
        except Exception as db_error:
            logger.warning(f"Not persisted to DB (normal if not configured): {str(db_error)[:100]}")
            db.rollback()
            # Create a simulated log with placeholder ID for response
            prediction_log.id = -1
            prediction_log.execution_timestamp = datetime.now()

        # Return response
        return PredictionResponse(
            prediction_result=prediction_result,
            service_date=request.service_date,
            model_version="v1_xgboost",
            execution_timestamp=prediction_log.execution_timestamp or datetime.now(),
            log_id=prediction_log.id,
        )

    except ValueError as ve:
        logger.error(f"Validation error in /predict: {str(ve)}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Input data error: {str(ve)}",
        )

    except Exception as e:
        error_msg = f"Error during prediction: {type(e).__name__}: {str(e)}"
        logger.error(error_msg, exc_info=True)
        try:
            db.rollback()
        except:
            pass
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error_msg,
        )


@app.post(
    "/predict/starter",
    response_model=StarterPredictionResponse,
    summary="Predict Starter Dishes",
    tags=["Predictions"],
    status_code=status.HTTP_201_CREATED,
)
async def predict_starter(
    request: StarterPredictionRequest,
    http_request: Request,
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    """Predicts the 3 most likely starters using the new menu model."""
    # Verify caller is admin or owner of the restaurant
    _require_restaurant_or_admin_auth(authorization, request.restaurant_id)
    
    if not _ensure_unified_menu_model_loaded(http_request.app):
        logger.error("Model not loaded in app.state")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Prediction engine not available. Restart the API.",
        )

    try:
        restaurant = db.query(Restaurant).filter(
            Restaurant.restaurant_id == request.restaurant_id
        ).first()
        if not restaurant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Restaurant with ID {request.restaurant_id} not found",
            )

        weather_data = get_weather_data(request.service_date)
        calendar_features = calculate_calendar_features(request.service_date)
        day_of_week = request.service_date.weekday()
        month = request.service_date.month
        allowed_dish_ids = get_restaurant_historical_dish_ids(
            db,
            request.restaurant_id,
            "first_course",
        )

        starter_input = {
            "restaurant_id": str(request.restaurant_id),
            "restaurant_segment": restaurant.restaurant_segment or "",
            "cuisine_type": restaurant.cuisine_type or "",
            "dist_office_towers": int(restaurant.dist_office_towers or 0),
            "google_rating": float(restaurant.google_rating or 0.0),
            "month": str(month),
            "day_of_week": str(day_of_week),
            "max_temp_c": float(weather_data["max_temp_c"]),
            "is_payday_week": bool(calendar_features.get("is_payday_week", False)),
            "is_azca_event": False,
            "course_type": "first_course",
        }

        top_dishes = predict_top3_dishes(
            http_request.app.state.model,
            starter_input,
            allowed_dish_ids=allowed_dish_ids,
            db=db,
        )
        if not top_dishes:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Could not generate starter predictions for this restaurant.",
            )

        total_starters = get_total_starters(db, request.restaurant_id)
        scores = [dish[1] for dish in top_dishes[:3]]
        sum_scores = sum(scores)
        normalized_scores = [score / sum_scores for score in scores] if sum_scores > 0 else [1 / 3, 1 / 3, 1 / 3]

        starter_dishes = [
            StarterDish(
                rank=i + 1,
                name=str(resolve_dish_name(db, dish[0]) or dish[0]),
                score=normalized_scores[i],
                estimated_count=round(normalized_scores[i] * total_starters),
            )
            for i, dish in enumerate(top_dishes[:3])
        ]

        return StarterPredictionResponse(
            top_3_dishes=starter_dishes,
            service_date=request.service_date,
            restaurant_id=request.restaurant_id,
            model_version=_menu_registered_model_name(),
            execution_timestamp=datetime.now(),
        )
    except HTTPException:
        raise
    except Exception as error:
        logger.error(f"Error during starter prediction: {error}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal error while processing starter prediction.",
        )


@app.post(
    "/predict/main",
    response_model=MainPredictionResponse,
    summary="Predict Main Dishes",
    tags=["Predictions"],
    status_code=status.HTTP_201_CREATED,
)
async def predict_main(
    request: MainPredictionRequest,
    http_request: Request,
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    """Predicts the 3 most likely mains using the new menu model."""
    # Verify caller is admin or owner of the restaurant
    _require_restaurant_or_admin_auth(authorization, request.restaurant_id)
    
    if not _ensure_unified_menu_model_loaded(http_request.app):
        logger.error("Model not loaded in app.state")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Prediction engine not available. Restart the API.",
        )

    try:
        restaurant = db.query(Restaurant).filter(
            Restaurant.restaurant_id == request.restaurant_id
        ).first()
        if not restaurant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Restaurant with ID {request.restaurant_id} not found",
            )

        weather_data = get_weather_data(request.service_date)
        calendar_features = calculate_calendar_features(request.service_date)
        day_of_week = request.service_date.weekday()
        month = request.service_date.month
        allowed_dish_ids = get_restaurant_historical_dish_ids(
            db,
            request.restaurant_id,
            "second_course",
        )

        main_input = {
            "restaurant_id": str(request.restaurant_id),
            "restaurant_segment": restaurant.restaurant_segment or "",
            "cuisine_type": restaurant.cuisine_type or "",
            "dist_office_towers": int(restaurant.dist_office_towers or 0),
            "google_rating": float(restaurant.google_rating or 0.0),
            "month": str(month),
            "day_of_week": str(day_of_week),
            "max_temp_c": float(weather_data["max_temp_c"]),
            "is_payday_week": bool(calendar_features.get("is_payday_week", False)),
            "is_azca_event": False,
            "course_type": "second_course",
        }

        top_dishes = predict_top3_dishes(
            http_request.app.state.model,
            main_input,
            allowed_dish_ids=allowed_dish_ids,
            db=db,
        )
        if not top_dishes:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Could not generate main-course predictions for this restaurant.",
            )

        total_mains = get_total_mains(db, request.restaurant_id)
        scores = [dish[1] for dish in top_dishes[:3]]
        sum_scores = sum(scores)
        normalized_scores = [score / sum_scores for score in scores] if sum_scores > 0 else [1 / 3, 1 / 3, 1 / 3]

        main_dishes = [
            MainDish(
                rank=i + 1,
                name=str(resolve_dish_name(db, dish[0]) or dish[0]),
                score=normalized_scores[i],
                estimated_count=round(normalized_scores[i] * total_mains),
            )
            for i, dish in enumerate(top_dishes[:3])
        ]

        return MainPredictionResponse(
            top_3_dishes=main_dishes,
            service_date=request.service_date,
            restaurant_id=request.restaurant_id,
            model_version=_menu_registered_model_name(),
            execution_timestamp=datetime.now(),
        )
    except HTTPException:
        raise
    except Exception as error:
        logger.error(f"Error during main-course prediction: {error}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal error while processing main-course prediction.",
        )


@app.post(
    "/predict/dessert",
    response_model=DessertPredictionResponse,
    summary="Predict Desserts",
    tags=["Predictions"],
    status_code=status.HTTP_201_CREATED,
)
async def predict_dessert(
    request: DessertPredictionRequest,
    http_request: Request,
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    """Predicts the 3 most likely desserts using the new menu model."""
    # Verify caller is admin or owner of the restaurant
    _require_restaurant_or_admin_auth(authorization, request.restaurant_id)
    
    if not _ensure_unified_menu_model_loaded(http_request.app):
        logger.error("Model not loaded in app.state")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Prediction engine not available. Restart the API.",
        )

    try:
        restaurant = db.query(Restaurant).filter(
            Restaurant.restaurant_id == request.restaurant_id
        ).first()
        if not restaurant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Restaurant with ID {request.restaurant_id} not found",
            )

        weather_data = get_weather_data(request.service_date)
        calendar_features = calculate_calendar_features(request.service_date)
        day_of_week = request.service_date.weekday()
        month = request.service_date.month
        allowed_dish_ids = get_restaurant_historical_dish_ids(
            db,
            request.restaurant_id,
            "dessert",
        )

        dessert_input = {
            "restaurant_id": str(request.restaurant_id),
            "restaurant_segment": restaurant.restaurant_segment or "",
            "cuisine_type": restaurant.cuisine_type or "",
            "dist_office_towers": int(restaurant.dist_office_towers or 0),
            "google_rating": float(restaurant.google_rating or 0.0),
            "month": str(month),
            "day_of_week": str(day_of_week),
            "max_temp_c": float(weather_data["max_temp_c"]),
            "is_payday_week": bool(calendar_features.get("is_payday_week", False)),
            "is_azca_event": False,
            "course_type": "dessert",
        }

        top_dishes = predict_top3_dishes(
            http_request.app.state.model,
            dessert_input,
            allowed_dish_ids=allowed_dish_ids,
            db=db,
        )
        if not top_dishes:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Could not generate dessert predictions for this restaurant.",
            )

        total_desserts = get_total_desserts(db, request.restaurant_id)
        scores = [dish[1] for dish in top_dishes[:3]]
        sum_scores = sum(scores)
        normalized_scores = [score / sum_scores for score in scores] if sum_scores > 0 else [1 / 3, 1 / 3, 1 / 3]

        dessert_dishes = [
            DessertDish(
                rank=i + 1,
                name=str(resolve_dish_name(db, dish[0]) or dish[0]),
                score=normalized_scores[i],
                estimated_count=round(normalized_scores[i] * total_desserts),
            )
            for i, dish in enumerate(top_dishes[:3])
        ]

        return DessertPredictionResponse(
            top_3_dishes=dessert_dishes,
            service_date=request.service_date,
            restaurant_id=request.restaurant_id,
            model_version=_menu_registered_model_name(),
            execution_timestamp=datetime.now(),
        )
    except HTTPException:
        raise
    except Exception as error:
        logger.error(f"Error during dessert prediction: {error}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal error while processing dessert prediction.",
        )


# ============================================================================
# ENDPOINT: Top 3 dish prediction using REGRESSION model v2
# ============================================================================

class DishScorePrediction(BaseModel):
    """Prediction for an individual dish from the regression model."""
    dish_id: int = Field(..., description="Dish ID")
    dish_name: str = Field(..., description="Dish name")
    score: float = Field(..., description="Demand score predicted by the model")
    course_type: str = Field(..., description="Course type (starter/main/dessert)")


class TopDishesResponse(BaseModel):
    """Response containing the 3 highest-scoring dishes."""
    restaurant_id: int = Field(..., description="Restaurant ID")
    service_date: date = Field(..., description="Service date")
    top_3_dishes: list[DishScorePrediction] = Field(..., description="Top 3 dishes with highest predicted score")
    model_version: str = Field(..., description="Model version used")
    execution_timestamp: datetime = Field(..., description="Execution timestamp")


def fetch_menu_data_for_prediction(db: Session, restaurant_id: int, service_date: date) -> pd.DataFrame:
    """
    Runs the SQL query to fetch the 13 regression-model features.
    
    Required data:
    - dim_restaurants: restaurant_id, restaurant_segment, cuisine_type, dist_office_towers, google_rating
    - dim_calendar: month, day_of_week, max_temp_c, is_payday_week, is_azca_event
    - dim_dishes/fact_menu_items/fact_menus: dish_id, dish_name, course_type
    
    Returns:
        DataFrame with one row per available dish for the restaurant
    """
    try:
        # SQL query that retrieves required data
        query = text("""
            SELECT
                -- Restaurant features (5)
                r.restaurant_id,
                r.restaurant_segment,
                r.cuisine_type,
                r.dist_office_towers,
                r.google_rating,
                
                -- Calendar features (5)
                c.month,
                c.day_of_week,
                c.max_temp_c,
                c.is_payday_week,
                c.is_azca_event,
                
                -- Dish features (3)
                d.dish_id,
                d.dish_name,
                d.course_type
            FROM dim_restaurants r
            CROSS JOIN dim_calendar c
            INNER JOIN fact_menus m ON r.restaurant_id = m.restaurant_id
            INNER JOIN fact_menu_items mi ON m.menu_id = mi.menu_id
            INNER JOIN dim_dishes d ON mi.dish_id = d.dish_id
            WHERE
                r.restaurant_id = :restaurant_id
                AND c.calendar_date = :service_date
                AND m.menu_date <= :service_date
            ORDER BY d.course_type, d.dish_id
        """)
        
        result = db.execute(query, {
            "restaurant_id": restaurant_id,
            "service_date": service_date
        })
        
        columns = result.keys()
        rows = result.fetchall()
        
        if not rows:
            logger.warning(f"No data found for restaurant {restaurant_id} on date {service_date}")
            return pd.DataFrame()
        
        logger.info(f"Retrieved {len(rows)} dish rows for restaurant {restaurant_id}")
        
        # Convert to DataFrame
        df = pd.DataFrame(rows, columns=columns)
        logger.info(f"Shape: {df.shape} | Columns: {list(df.columns)}")
        
        return df
        
    except Exception as e:
        logger.error(f"Error in SQL query: {type(e).__name__}: {str(e)}", exc_info=True)
        raise


def cast_features_for_model(df: pd.DataFrame) -> pd.DataFrame:
    """
    Casts exact data types expected by the regression model.
    
    Required casting:
    - Strings: restaurant_id, restaurant_segment, cuisine_type, month, day_of_week, 
               dish_id, dish_name, course_type
    - Floats: google_rating, max_temp_c
    - Long/Int: dist_office_towers
    - Booleans: is_payday_week, is_azca_event
    """
    try:
        # Copy to avoid mutating original
        df_casted = df.copy()
        
        # Strings
        for col in ['restaurant_segment', 'cuisine_type', 'dish_name', 'course_type']:
            if col in df_casted.columns:
                df_casted[col] = df_casted[col].astype(str)
                logger.info(f"   {col}: str")
        
        # Convert ID columns to strings (some models expect string IDs)
        for col in ['restaurant_id', 'dish_id']:
            if col in df_casted.columns:
                df_casted[col] = df_casted[col].astype(str)
                logger.info(f"   {col}: str")
        
        # Month and day_of_week as strings (categories)
        for col in ['month', 'day_of_week']:
            if col in df_casted.columns:
                df_casted[col] = df_casted[col].astype(str)
                logger.info(f"   {col}: str")
        
        # Floats
        for col in ['google_rating', 'max_temp_c']:
            if col in df_casted.columns:
                df_casted[col] = pd.to_numeric(df_casted[col], errors='coerce').astype(float)
                logger.info(f"   {col}: float")
        
        # Integer para distancia
        if 'dist_office_towers' in df_casted.columns:
            df_casted['dist_office_towers'] = pd.to_numeric(df_casted['dist_office_towers'], errors='coerce').astype('Int64')
            logger.info(f"   dist_office_towers: int")
        
        # Booleanos
        for col in ['is_payday_week', 'is_azca_event']:
            if col in df_casted.columns:
                if df_casted[col].dtype == bool:
                    df_casted[col] = df_casted[col].astype(bool)
                else:
                    df_casted[col] = df_casted[col].isin([1, True, 'True', 'true', 'yes']).astype(bool)
                logger.info(f"   {col}: bool")
        
        logger.info(f"Casting completed: {df_casted.shape}")
        return df_casted
        
    except Exception as e:
        logger.error(f"Error in casting: {type(e).__name__}: {str(e)}", exc_info=True)
        raise


@app.get(
    "/predict/top-dishes/{restaurant_id}",
    response_model=TopDishesResponse,
    summary="Predict top 3 dishes",
    tags=["Predictions"],
    status_code=status.HTTP_200_OK,
)
async def predict_top_dishes_regression(
    restaurant_id: int,
    service_date: date = Query(..., description="Service date (YYYY-MM-DD)"),
    authorization: str | None = Header(default=None),
    request: Request = None,
    db: Session = Depends(get_db),
):
    """
    Predicts the top 3 dishes for a restaurant on a specific date.
    
    Uses regression model azca_menu_model_v2.pkl, which returns a numeric
    score for each dish based on:
    - Restaurant features (segment, cuisine, distance, rating)
    - Date features (month, day of week, weather, events)
    - Dish features (name, course type)
    
    Query Parameters:
    - service_date: Service date (YYYY-MM-DD)
    
    Returns:
        TopDishesResponse: Top 3 dishes with highest predicted score
    """
    # Verify caller is admin or owner of the restaurant
    _require_restaurant_or_admin_auth(authorization, restaurant_id)
    
    try:
        exec_start = datetime.now()
        logger.info(f"GET /predict/top-dishes/{restaurant_id}?service_date={service_date}")
        
        # 1. Load model on demand
        logger.info("Loading model...")
        try:
            model = get_model_lazy()
        except Exception as model_error:
            logger.error(f"Failed to load model: {str(model_error)}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Prediction model not available: {str(model_error)}"
            )
        
        # 2. Retrieve data from database
        logger.info(f"Querying data for restaurant {restaurant_id} on {service_date}...")
        df_menu = fetch_menu_data_for_prediction(db, restaurant_id, service_date)
        
        if df_menu.empty:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No dishes found for restaurant {restaurant_id} on date {service_date}"
            )
        
        # 3. Cast feature types
        logger.info("Casting feature data types...")
        df_casted = cast_features_for_model(df_menu)
        
        # 4. Run prediction per dish
        logger.info("Running model prediction...")
        
        predictions = model.predict(df_casted)
        logger.info(f"Prediction completed: {len(predictions)} scores")
        
        # 5. Build result with scores
        results = []
        for idx, row in df_casted.iterrows():
            results.append({
                'dish_id': int(row['dish_id']),
                'dish_name': str(row['dish_name']),
                'score': float(predictions[idx]) if isinstance(predictions, (list, tuple)) else float(predictions[idx] if hasattr(predictions, '__getitem__') else predictions),
                'course_type': str(row['course_type'])
            })
        
        # 6. Sort by score descending and take top 3
        results_sorted = sorted(results, key=lambda x: x['score'], reverse=True)
        top_3 = results_sorted[:3]
        
        logger.info("Top 3 predicted dishes:")
        for i, dish in enumerate(top_3, 1):
            logger.info(f"   {i}. {dish['dish_name']} ({dish['dish_id']}): {dish['score']:.4f}")
        
        # 7. Return response
        latency_ms = int((datetime.now() - exec_start).total_seconds() * 1000)
        logger.info(f"⏱️  Latencia total: {latency_ms}ms")
        
        return TopDishesResponse(
            restaurant_id=restaurant_id,
            service_date=service_date,
            top_3_dishes=[DishScorePrediction(**dish) for dish in top_3],
            model_version="azca_menu_model_v2",
            execution_timestamp=datetime.now(),
        )
        
    except HTTPException:
        raise
    except Exception as e:
        error_msg = f"Error during prediction: {type(e).__name__}: {str(e)}"
        logger.error(error_msg, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error_msg,
        )


@app.post(
    "/predict/menu-upload",
    response_model=MenuUploadPredictionResponse,
    summary="Upload menu (OCR) and predict dishes",
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
    Default flow:
    1) OCR con Azure Document Intelligence para extraer el menu subido.
    2) Parser to detect starter, main, and dessert.
    3) ML top-3 prediction by category based on detected menu.

    Request multipart/form-data:
    - restaurant_id: int
    - service_date: YYYY-MM-DD
    - menu_file: archivo (PDF/JPG/PNG, etc.)
    """
    global prediction_engine

    if prediction_engine is None:
        logger.error("Prediction engine not initialized")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Prediction engine not available. Restart the API.",
        )

    restaurant = db.query(Restaurant).filter(Restaurant.restaurant_id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Restaurant con ID {restaurant_id} not found",
        )

    try:
        file_bytes = await menu_file.read()
        if not file_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded menu file is empty.",
            )

        # Default OCR using Azure Document Intelligence
        raw_text, ocr_provider = extract_menu_text_with_default_ocr(
            file_bytes=file_bytes,
            content_type=menu_file.content_type,
        )

        # Menu section detection
        sections = MenuSectionExtractor.extract(raw_text)
        persist_extracted_dishes(db, sections)

        # Automatic contextual variables (similar to current flow)
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
        logger.error(f"OCR not available: {runtime_error}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(runtime_error),
        )
    except Exception as exc:
        logger.error(f"Error in /predict/menu-upload: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno al procesar OCR y prediction del menu.",
        )


# ============================================================================
# MENU ARCHIVAL (Daily -> Fact)
# ============================================================================


@app.post(
    "/admin/menus/archive",
    response_model=dict,
    tags=["Admin"],
    summary="Archive previous day menus to fact_menus",
)
async def archive_daily_menus(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    """
     Archives yesterday menus from `daily_menus` to `fact_menus` + `fact_menu_items`.
    
     Only administrators can execute this operation.
     Flow:
     1. Finds all menus in `daily_menus` with date before today
     2. For each menu:
         - Creates entry in `fact_menus` (if it does not exist)
         - Generates `fact_menu_items` from `starter`, `main`, `dessert`
         - Links `dish_ratings` to the new `menu_id` in fact_menus
     3. Marks `daily_menus` rows as archived (optional: remove them)
    """
     # Validate admin permission
    payload = _require_auth(authorization)
    role = payload.get("role")
    if role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can archive menus",
        )

    try:
        today = _current_service_date()
        yesterday = today - timedelta(days=1)
        yesterday_sql = yesterday.isoformat()

        # 1. Get yesterday menus from daily_menus
        daily_menus = db.execute(
            text(
                """
                SELECT menu_id, restaurant_id, date, starter, main, dessert
                FROM dbo.daily_menus
                WHERE CAST(date AS DATE) = :target_date
                """
            ),
            {"target_date": yesterday_sql},
        ).fetchall()

        if not daily_menus:
            return {
                "success": True,
                "message": f"No menus to archive for {yesterday}",
                "archived_count": 0,
            }

        archived_count = 0
        date_id = int(yesterday.strftime("%Y%m%d"))

        for daily_menu in daily_menus:
            daily_menu_id = daily_menu[0]
            restaurant_id = daily_menu[1]
            starter = daily_menu[3]
            main = daily_menu[4]
            dessert = daily_menu[5]

            # 2. Create/get menu in fact_menus
            fact_menu = db.execute(
                text(
                    """
                    SELECT menu_id
                    FROM dbo.fact_menus
                    WHERE restaurant_id = :restaurant_id AND date_id = :date_id
                    """
                ),
                {"restaurant_id": restaurant_id, "date_id": date_id},
            ).first()

            if not fact_menu:
                # Create new menu in fact_menus
                result = db.execute(
                    text(
                        """
                        INSERT INTO dbo.fact_menus (restaurant_id, date_id, includes_drink)
                        VALUES (:restaurant_id, :date_id, 0)
                        """
                    ),
                    {"restaurant_id": restaurant_id, "date_id": date_id},
                )
                db.commit()
                fact_menu_id = result.lastrowid
            else:
                fact_menu_id = fact_menu[0]

            # 3. Create fact_menu_items from dishes
            dishes_to_add = []
            if starter:
                for dish_name in starter.split(";"):
                    dishes_to_add.append((dish_name.strip(), "first_course"))
            if main:
                for dish_name in main.split(";"):
                    dishes_to_add.append((dish_name.strip(), "second_course"))
            if dessert:
                for dish_name in dessert.split(";"):
                    dishes_to_add.append((dish_name.strip(), "dessert"))

            for dish_name, course_type in dishes_to_add:
                if not dish_name:
                    continue

                # Find or create dish_id
                dish_row = db.execute(
                    text(
                        """
                        SELECT dish_id
                        FROM dbo.dim_dishes
                        WHERE dish_name = :dish_name AND course_type = :course_type
                        LIMIT 1
                        """
                    ),
                    {"dish_name": dish_name, "course_type": course_type},
                ).first()

                if dish_row:
                    dish_id = dish_row[0]
                else:
                    # Create new dish
                    result = db.execute(
                        text(
                            """
                            INSERT INTO dbo.dim_dishes (dish_name, course_type)
                            VALUES (:dish_name, :course_type)
                            """
                        ),
                        {"dish_name": dish_name, "course_type": course_type},
                    )
                    db.commit()
                    dish_id = result.lastrowid

                # Add to fact_menu_items
                db.execute(
                    text(
                        """
                        INSERT INTO dbo.fact_menu_items (menu_id, dish_id)
                        VALUES (:menu_id, :dish_id)
                        """
                    ),
                    {"menu_id": fact_menu_id, "dish_id": dish_id},
                )

            # 4. Update ratings to point to fact_menus menu_id
            db.execute(
                text(
                    """
                    UPDATE dbo.dish_ratings
                    SET menu_id = :fact_menu_id
                    WHERE menu_id = :daily_menu_id
                    """
                ),
                {"fact_menu_id": fact_menu_id, "daily_menu_id": daily_menu_id},
            )

            archived_count += 1

        db.commit()

        return {
            "success": True,
            "message": f"Menus from {yesterday} archived successfully",
            "archived_count": archived_count,
        }

    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        logger.error(f"Error archiving menus: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error while archiving menus: {str(exc)}",
        )


# ============================================================================
# ROOT (for documentation)
# ============================================================================


@app.get(
    "/",
    tags=["Info"],
    summary="API information",
)
async def root():
    """
    Root endpoint with general API information.

    Redirects to `/docs` for interactive Swagger documentation.
    """
    return {
        "name": "AZCA Prediction API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
        "prediction": "/predict",
    }


# ============================================================================
# EXECUTION (for local development)
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













