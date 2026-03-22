"""
ORM model definitions for the Azure SQL database.

This module defines SQLAlchemy models that map database tables
de la database. Actualmente contiene el modelo PredictionLog
used for auditing and model retraining.

Classes:
    PredictionLog: Model for the prediction audit table.
    FactServices: Model for historical fact table.
"""

from datetime import datetime
from sqlalchemy import Column, Integer, Float, DateTime, Date, Boolean, String, Text, CheckConstraint, LargeBinary
from sqlalchemy.sql import func
from .database import Base


SEGMENT_OPTIONS = ("gourmet", "traditional", "business", "family")
TERRACE_OPTIONS = ("yearround", "summer", "none")
CUISINE_OPTIONS = (
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
)


class Restaurant(Base):
    """
    ORM model for table dim_restaurants.
    
    Contains all restaurant information used for prediction.
    """
    __tablename__ = "dim_restaurants"
    __table_args__ = (
        CheckConstraint(
            "restaurant_segment IN ('gourmet','traditional','business','family')",
            name="ck_dim_restaurants_segment",
        ),
        CheckConstraint(
            "terrace_setup_type IN ('yearround','summer','none')",
            name="ck_dim_restaurants_terrace",
        ),
        CheckConstraint(
            "cuisine_type IN ('grill','spanish','mediterranean','stew','fried','italian','asian','latin','arabic','avantgarde','plantbased','streetfood')",
            name="ck_dim_restaurants_cuisine",
        ),
    )
    
    restaurant_id = Column(Integer, primary_key=True, autoincrement=False)
    name = Column(String(255), nullable=False)
    capacity_limit = Column(Integer, nullable=True)
    table_count = Column(Integer, nullable=True)
    min_service_duration = Column(Integer, nullable=True)
    terrace_setup_type = Column(String(100), nullable=True)
    opens_weekends = Column(Boolean, nullable=True)
    has_wifi = Column(Boolean, nullable=True)
    restaurant_segment = Column(String(100), nullable=True)
    menu_price = Column(Float, nullable=True)
    dist_office_towers = Column(Integer, nullable=True)
    google_rating = Column(Float, nullable=True)
    cuisine_type = Column(String(100), nullable=True)
    login_email = Column(String(255), nullable=True, unique=True)
    password_hash = Column(String(255), nullable=True)
    image_url = Column(String(500), nullable=True)
    image_data = Column(LargeBinary, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    def __repr__(self):
        return f"<Restaurant(id={self.restaurant_id}, name='{self.name}')>"


class DailyMenu(Base):
    """
    ORM model for table dbo.daily_menus.
    
    Stores daily menus uploaded by restaurants via OCR or manually.
    """
    __tablename__ = "daily_menus"
    
    menu_id = Column(Integer, primary_key=True, autoincrement=True)
    restaurant_id = Column(Integer, nullable=False)
    date = Column(Date, nullable=False, default=datetime.utcnow().date)
    starter = Column(Text, nullable=True)
    main = Column(Text, nullable=True)
    dessert = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<DailyMenu(rest_id={self.restaurant_id}, date={self.date})>"


class Inscripcion(Base):
    """
    ORM model for table dbo.inscriptions.

    Stores restaurant signup requests pending administrative review.
    """

    __tablename__ = "inscriptions"
    __table_args__ = (
        CheckConstraint(
            "restaurant_segment IN ('gourmet','traditional','business','family')",
            name="ck_inscripciones_segment",
        ),
        CheckConstraint(
            "terrace_setup_type IN ('yearround','summer','none')",
            name="ck_inscripciones_terrace",
        ),
        CheckConstraint(
            "cuisine_type IN ('grill','spanish','mediterranean','stew','fried','italian','asian','latin','arabic','avantgarde','plantbased','streetfood')",
            name="ck_inscripciones_cuisine",
        ),
    )

    inscripcion_id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    capacity_limit = Column(Integer, nullable=True)
    table_count = Column(Integer, nullable=True)
    min_service = Column(String(100), nullable=True)
    terrace_setup_type = Column(String(100), nullable=True)
    opens_weekends = Column(Boolean, nullable=True)
    has_wifi = Column(Boolean, nullable=True)
    restaurant_segment = Column(String(100), nullable=True)
    menu_price = Column(Float, nullable=True)
    dist_office_towers = Column(Integer, nullable=True)
    google_rating = Column(Float, nullable=True)
    cuisine_type = Column(String(100), nullable=True)
    login_email = Column(String(255), nullable=True)
    password_hash = Column(String(255), nullable=True)
    image_url = Column(String(500), nullable=True)
    google_maps_link = Column(String(500), nullable=False)
    estado_inscripcion = Column(String(100), nullable=True)
    date_solicitud = Column(DateTime, nullable=True, default=datetime.utcnow)

    def __repr__(self):
        return (
            f"<Inscripcion(id={self.inscripcion_id}, name='{self.name}', "
            f"estado='{self.estado_inscripcion}')>"
        )


class DimDish(Base):
    """
    ORM model for table dim_dishes.

    Stores normalized dishes extracted by OCR and their course type.
    """

    __tablename__ = "dim_dishes"

    dish_id = Column(Integer, primary_key=True, autoincrement=True)
    course_type = Column(String(50), nullable=False)
    dish_name = Column(String(500), nullable=False)

    def __repr__(self):
        return f"<DimDish(id={self.dish_id}, course_type='{self.course_type}', dish_name='{self.dish_name}')>"


DimDishes = DimDish


class PredictionLog(Base):
    """
    ORM model for table audit PredictionLogs.

    This table records each prediction generated by the AI model,
    including input parameters, generated prediction, and
    metadatos relevantes. Se utiliza para:

    1. **Auditing**: Maintain a complete history of all predictions.
    2. **Re-entrenamiento**: Recopilar datos de entrada y salida para
       model validation and retraining with new historical data.
    3. **Debugging**: Facilitate investigation of incorrect predictions.

    Attributes:
        id (int): Auto-increment unique identifier (BIGINT IDENTITY).
        execution_timestamp (datetime): Timestamp of when the prediction was executed.
            Por defecto, se asigna la date/hora actual del servidor.
        service_date (date): Date being predicted.
        max_temp_c (float): Maximum predicted temperature in Celsius.
        precipitation_mm (float): Predicted precipitation in millimeters.
        is_stadium_event (bool): Indicator of whether there is a stadium event (football match).
        is_payday_week (bool): Indicador de si es semana de cobro/salario.
        prediction_result (int): Resultado de la prediction del modelo IA
            (ej: cantidad predicha de users).
        model_version (str): Model version that generated the prediction
            (ej: 'v1_xgboost', 'v2_lstm', etc.).
        full_input_json (str): JSON con el conjunto completo de inputs
            for reproducibility and auditing.
    """

    __tablename__ = "PredictionLogs"

    # Campos de la tabla
    id = Column(Integer, primary_key=True, autoincrement=True)
    execution_timestamp = Column(
        DateTime,
        server_default=func.now(),
        nullable=False,
        doc="Prediction execution timestamp"
    )
    service_date = Column(
        Date,
        nullable=False,
        doc="Date being predicted"
    )
    max_temp_c = Column(
        Float,
        nullable=True,
        doc="Maximum temperature in Celsius"
    )
    precipitation_mm = Column(
        Float,
        nullable=True,
        doc="Precipitation in millimeters"
    )
    is_stadium_event = Column(
        Boolean,
        nullable=True,
        doc="¿Hay evento en estadio?"
    )
    is_payday_week = Column(
        Boolean,
        nullable=True,
        doc="¿Es semana de cobro?"
    )
    prediction_result = Column(
        Integer,
        nullable=False,
        doc="Resultado de la prediction del modelo"
    )
    model_version = Column(
        String(50),
        nullable=True,
        default="v1_xgboost",
        doc="Model version used"
    )
    full_input_json = Column(
        Text,
        nullable=True,
        doc="JSON con todos los inputs para reproducibilidad"
    )

    def __repr__(self):
        """String representation of the PredictionLog object."""
        return (
            f"<PredictionLog("
            f"id={self.id}, "
            f"service_date={self.service_date}, "
            f"prediction_result={self.prediction_result}, "
            f"model_version={self.model_version})>"
        )

    def to_dict(self):
        """
        Converts the record to a dictionary for JSON serialization.

        Returns:
            dict: Diccionario con los atributos del registro.
        """
        return {
            "id": self.id,
            "execution_timestamp": self.execution_timestamp.isoformat()
            if self.execution_timestamp else None,
            "service_date": self.service_date.isoformat()
            if self.service_date else None,
            "max_temp_c": self.max_temp_c,
            "precipitation_mm": self.precipitation_mm,
            "is_stadium_event": self.is_stadium_event,
            "is_payday_week": self.is_payday_week,
            "prediction_result": self.prediction_result,
            "model_version": self.model_version,
            "full_input_json": self.full_input_json,
        }


class FactServices(Base):
    """
    ORM model for table fact_services.
    
    Contains historical service data by restaurant and date.
    Se utiliza para recuperar valores lag (services_lag_7 y avg_4_weeks)
    para alimentar el modelo de prediction.
    
    Attributes:
        date_id: Identificador de date en formato YYYYMMDD (entero)
        restaurant_id: ID del restaurant
        services_lag_7: Number of services 7 days ago
        avg_4_weeks: Promedio de services latests 4 semanas
    """
    __tablename__ = "fact_services"
    
    date_id = Column(Integer, primary_key=True)
    restaurant_id = Column(Integer, primary_key=True)
    services_lag_7 = Column(Float, nullable=True)
    avg_4_weeks = Column(Float, nullable=True)
    
    def __repr__(self):
        return f"<FactServices(date={self.date_id}, rest_id={self.restaurant_id}, lag7={self.services_lag_7}, avg4w={self.avg_4_weeks})>"


class MenusAzca(Base):
    """
    ORM model for table Menus_Azca.
    
    Contiene el historial de menus servidos en cada restaurant,
    incluyendo dishes de entrada, dish principal y postre.
    Used to count how many dishes of each type each restaurant serves.
    
    Attributes:
        restaurant_id: ID del restaurant
        first_course: Nombre del dish de entrada
        second_course: Nombre del dish principal
        dessert: Nombre del postre
    """
    __tablename__ = "Menus_Azca"
    
    restaurant_id = Column(Integer, primary_key=True, index=True)
    first_course = Column(String(255), primary_key=True, nullable=True)
    second_course = Column(String(255), nullable=True)
    dessert = Column(String(255), nullable=True)
    
    def __repr__(self):
        return f"<MenusAzca(rest_id={self.restaurant_id}, first='{self.first_course}', second='{self.second_course}', dessert='{self.dessert}')>"


class FactMenuItems(Base):
    """
    ORM model for table fact_menu_items.
    
    Fact table linking menus with specific dishes.
    """
    __tablename__ = "fact_menu_items"

    item_id = Column(Integer, primary_key=True)
    menu_id = Column(Integer, nullable=False, index=True)
    dish_id = Column(Integer, nullable=False, index=True)
    
    def __repr__(self):
        return f"<FactMenuItems(item_id={self.item_id}, menu_id={self.menu_id}, dish_id={self.dish_id})>"


class FactMenus(Base):
    """
    ORM model for table fact_menus.
    
    Table de hechos con historial de menus servidos por restaurant y date.
    """
    __tablename__ = "fact_menus"
    
    menu_id = Column(Integer, primary_key=True)
    restaurant_id = Column(Integer, nullable=False, index=True)
    date_id = Column(Integer, nullable=False)  # YYYYMMDD format
    includes_drink = Column(Boolean, nullable=False, default=False)
    
    def __repr__(self):
        return f"<FactMenus(menu_id={self.menu_id}, rest_id={self.restaurant_id}, date={self.date_id})>"


class RestaurantContext(Base):
    """
    Modelo ORM para la vista v_current_restaurant_context.
    
    Vista optimizada que centraliza los datos del restaurant y los latest dishes
    served by course type. Avoids multiple JOINs in Python code.
    
    Atributos:
        restaurant_id: ID del restaurant (PK)
        cuisine_type: Tipo de cocina
        restaurant_segment: Segmento del restaurant
        menu_price: Average menu price
        terrace_setup_type: Tipo de setup de terraza
        last_starter_id: ID of the last starter dish served (nullable)
        last_main_id: ID of the last main dish served (nullable)
        last_dessert_id: ID of the last dessert served (nullable)
    """
    __tablename__ = "v_current_restaurant_context"
    
    restaurant_id = Column(Integer, primary_key=True)
    cuisine_type = Column(String(100), nullable=True)
    restaurant_segment = Column(String(100), nullable=True)
    menu_price = Column(Float, nullable=True)
    terrace_setup_type = Column(String(100), nullable=True)
    last_starter_id = Column(Integer, nullable=True)
    last_main_id = Column(Integer, nullable=True)
    last_dessert_id = Column(Integer, nullable=True)
    
    def __repr__(self):
        return (
            f"<RestaurantContext(id={self.restaurant_id}, "
            f"cuisine={self.cuisine_type}, "
            f"last_starter={self.last_starter_id}, "
            f"last_main={self.last_main_id}, "
            f"last_dessert={self.last_dessert_id})>"
        )


class FactPredictionLog(Base):
    """
    ORM model for table fact_prediction_logs.
    
    Auditing centralizada de TODAS las predictions del system:
    - Predicciones de menus (MENU_STARTER, MENU_MAIN, MENU_DESSERT)
    - Predicciones de services (SERVICE_LEVEL)
    
    Allows tracing which inputs generated which outputs, comparing with real data,
    medir latency, y auditar el rendimiento del modelo.
    
    Atributos:
        prediction_id: Unique ID (auto-increment)
        execution_date: Execution timestamp
        restaurant_id: ID del restaurant
        prediction_domain: Tipo de prediction ('MENU_STARTER', 'MENU_MAIN', 'MENU_DESSERT', 'SERVICE_LEVEL')
        input_context_json: JSON con los inputs (clima, calendario, restaurant, etc.)
        output_results_json: JSON con los resultados predichos (top 3 dishes o nivel de service)
        model_version: Model version used
        latency_ms: Execution latency in milliseconds
        actual_outcome_json: JSON with actual outcomes (filled after service)
    """
    __tablename__ = "fact_prediction_logs"
    
    prediction_id = Column(Integer, primary_key=True, autoincrement=True)
    execution_date = Column(DateTime, default=datetime.utcnow, nullable=True, index=True)  # Coincide con Azure (nullable=True)
    restaurant_id = Column(Integer, nullable=False, index=True)
    
    # Differentiator: prediction type
    prediction_domain = Column(String(50), nullable=False, index=True)  
    
    # Contexto de entrada (NVARCHAR(MAX) �?' Text en SQLAlchemy)
    input_context_json = Column(Text, nullable=False)
    
    # Resultados de IA (NVARCHAR(MAX) �?' Text en SQLAlchemy)
    output_results_json = Column(Text, nullable=False)
    
    # Rendimiento
    model_version = Column(String(50), nullable=True)
    latency_ms = Column(Integer, nullable=True)
    
    # Predicted vs actual comparison (NVARCHAR(MAX), nullable)
    actual_outcome_json = Column(Text, nullable=True)

    def __repr__(self):
        return (
            f"<FactPredictionLog(id={self.prediction_id}, "
            f"rest_id={self.restaurant_id}, "
            f"domain={self.prediction_domain}, "
            f"latency={self.latency_ms}ms)>"
        )

class User(Base):
    """
    ORM model for table dim.Users.

    Allows restaurants to sign in and manage their credentials.
    """
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, autoincrement=True)
    restaurant_id = Column(Integer, nullable=False)
    login_email = Column(String(255), nullable=False, unique=True)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    role = Column(String(50), default='restaurant_owner')

    def __repr__(self):
        return f"<User(id={self.user_id}, restaurant_id={self.restaurant_id}, email='{self.login_email}')>"


class RestaurantRating(Base):
    """ORM model for table dbo.restaurant_ratings (existente)."""

    __tablename__ = "restaurant_ratings"

    rating_id = Column(Integer, primary_key=True, autoincrement=True)
    restaurant_id = Column(Integer, nullable=False, index=True)
    menu_id = Column(Integer, nullable=True, index=True)
    dish_id = Column(Integer, nullable=True, index=True)
    score = Column(Float, nullable=False)
    comment = Column(String(1000), nullable=True)
    reviewer_name = Column(String(255), nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    def __repr__(self):
        return f"<RestaurantRating(id={self.rating_id}, rest_id={self.restaurant_id}, score={self.score})>"


class DishRating(Base):
    """ORM model for table dbo.dish_ratings (nueva)."""

    __tablename__ = "dish_ratings"

    rating_id = Column(Integer, primary_key=True, autoincrement=True)
    restaurant_id = Column(Integer, nullable=False, index=True)
    rating_date = Column(Date, nullable=False, index=True)
    dish_name = Column(String(500), nullable=False)
    dish_key = Column(String(500), nullable=False, index=True)
    rating = Column(Float, nullable=False)  # �o. Float para aceptar decimales
    menu_id = Column(Integer, nullable=True, index=True)
    dish_id = Column(Integer, nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    def __repr__(self):
        return f"<DishRating(id={self.rating_id}, rest_id={self.restaurant_id}, dish_id={self.dish_id}, rating={self.rating})>"





