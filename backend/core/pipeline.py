import pandas as pd
from datetime import datetime
from pathlib import Path
from typing import Any


class InferencePipeline:
    # Column order expected by Azure AutoML model
    MODEL_COLUMNS = [
        "service_date",
        "restaurant_id",
        "max_temp_c",
        "precipitation_mm",
        "is_rain_service_peak",
        "is_stadium_event",
        "is_azca_event",
        "is_holiday",
        "is_bridge_day",
        "is_payday_week",
        "is_business_day",
        "services_lag_7",
        "avg_4_weeks",
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
    ]

    # Legacy (current API payload) schema used by older menu endpoints.
    MENU_COLUMNS = [
        "day_of_week",
        "month",
        "max_temp_c",
        "is_holiday",
        "is_business_day",
        "restaurant_id",
        "cuisine_type",
        "restaurant_segment",
        "category",
    ]

    # Numeric schema used by the unified historical menu training table.
    NUMERIC_MENU_COLUMNS = [
        "day_of_week",
        "month",
        "max_temp_c",
        "precipitation_mm",
        "is_holiday",
        "is_payday_week",
        "is_stadium_event",
        "is_azca_event",
        "restaurant_id",
        "menu_price",
        "cuisine_type_id",
        "restaurant_segment_id",
        "terrace_setup_type_id",
        "course_type_id",
        "prev_dish_id",
        "dish_id",
    ]

    NUMERIC_MENU_COLUMNS_NO_DISH_ID = [
        col for col in NUMERIC_MENU_COLUMNS
        if col != "dish_id"
    ]

    CUISINE_TYPE_ID = {
        "grill": 1,
        "spanish": 2,
        "mediterranean": 3,
        "stew": 4,
        "fried": 5,
        "italian": 6,
        "asian": 7,
        "latin": 8,
        "arabic": 9,
        "avantgarde": 10,
        "plantbased": 11,
        "streetfood": 12,
    }

    RESTAURANT_SEGMENT_ID = {
        "gourmet": 1,
        "traditional": 2,
        "business": 3,
        "family": 4,
        "casual": 2,
        "fine_dining": 1,
    }

    TERRACE_SETUP_TYPE_ID = {
        "yearround": 1,
        "summer": 2,
        "none": 3,
        "standard": 3,
        "outdoor": 2,
    }

    COURSE_TYPE_ID = {
        "starter": 1,
        "first_course": 1,
        "main": 2,
        "second_course": 2,
        "dessert": 3,
    }

    def __init__(self, fixed_fields: dict | None = None) -> None:
        """
        Initialize pipeline with optional fixed field overrides.

        Args:
            fixed_fields: dict with default values for restaurant fields.
                         If None, uses generic defaults.
        """
        # Set defaults
        self.fixed_fields = {
            "restaurant_id": 1,
            "capacity_limit": 100,
            "table_count": 20,
            "min_service_duration": 45,
            "terrace_setup_type": "standard",
            "opens_weekends": True,
            "has_wifi": True,
            "restaurant_segment": "casual",
            "menu_price": 15.0,
            "dist_office_towers": 500,
            "google_rating": 4.0,
            "cuisine_type": "mediterranean",
        }
        # Override with custom values if provided
        if fixed_fields:
            self.fixed_fields.update(fixed_fields)

    def build_features(self, data: dict, expected_columns: list[str] | None = None) -> pd.DataFrame:
        """
        Transform basic input (date, temp, rain, stadium event, payday) 
        into the exact 24-column DataFrame required by the Azure AutoML model.

        Args:
            data: dict with required keys:
                - service_date: datetime or string (YYYY-MM-DD)
                - max_temp_c: float
                - precipitation_mm: float (default: 0)
                - is_stadium_event: bool (default: False)
                - is_payday_week: bool (default: False)
              optional:
                - is_azca_event: bool (default: False)
                - is_holiday: bool (default: False)
                - is_bridge_day: bool (default: False)
                - services_lag_7: int (default: 100)
                - avg_4_weeks: float (default: 100.0)

        Returns:
            pd.DataFrame with 24 columns in model-expected order
        """
        # Extract and validate required fields
        service_date = data["service_date"]
        
        # Convert service_date to datetime if it's a string
        if isinstance(service_date, str):
            service_date = pd.to_datetime(service_date)
        elif isinstance(service_date, pd.Timestamp):
            pass  # Already datetime
        elif hasattr(service_date, 'date'):  # datetime.date object
            service_date = pd.to_datetime(service_date)
        
        # Get the date part for is_business_day calculation
        service_date_for_calc = service_date.date() if hasattr(service_date, 'date') else service_date
        
        max_temp_c = float(data["max_temp_c"])
        precipitation_mm = float(data.get("precipitation_mm", 0))

        # Build the dynamic feature row (request-derived values)
        day_of_week = int(service_date_for_calc.weekday()) if hasattr(service_date_for_calc, "weekday") else 0
        month = int(service_date_for_calc.month) if hasattr(service_date_for_calc, "month") else 1
        row = {
            "service_date": service_date,  # Keep as datetime/Timestamp
            "day_of_week": day_of_week,
            "month": month,
            "max_temp_c": max_temp_c,
            "precipitation_mm": precipitation_mm,
            "is_rain_service_peak": bool(precipitation_mm > 10),
            "is_stadium_event": bool(data.get("is_stadium_event", False)),
            "is_azca_event": bool(data.get("is_azca_event", False)),
            "is_holiday": bool(data.get("is_holiday", False)),
            "is_bridge_day": bool(data.get("is_bridge_day", False)),
            "is_payday_week": bool(data.get("is_payday_week", False)),
            "is_business_day": bool(service_date_for_calc.weekday() < 5),
            "services_lag_7": int(data.get("services_lag_7", 100)),
            "avg_4_weeks": float(data.get("avg_4_weeks", 100.0)),
        }

        # Start with fixed fields and override them with request values when present.
        row.update(self.fixed_fields)
        for key in self.fixed_fields.keys():
            if key in data and data[key] is not None:
                row[key] = data[key]

        if "service_date" in data and data["service_date"] is not None:
            row["service_date"] = service_date
        
        # Ensure correct types for all fields
        row["restaurant_id"] = int(row["restaurant_id"])
        row["capacity_limit"] = int(row["capacity_limit"])
        row["table_count"] = int(row["table_count"])
        row["min_service_duration"] = int(row["min_service_duration"])
        row["menu_price"] = float(row["menu_price"])
        row["dist_office_towers"] = int(row["dist_office_towers"])
        row["google_rating"] = float(row["google_rating"])
        row["opens_weekends"] = bool(row["opens_weekends"])
        row["has_wifi"] = bool(row["has_wifi"])

        selected_columns = [str(col) for col in (expected_columns or self.MODEL_COLUMNS)]
        for col in selected_columns:
            if col not in row:
                if col == "service_date":
                    row[col] = service_date
                elif col == "day_of_week":
                    row[col] = day_of_week
                elif col.startswith("is_") or col in {"opens_weekends", "has_wifi"}:
                    row[col] = False
                elif col.endswith("_id") or col in {
                    "restaurant_id",
                    "capacity_limit",
                    "table_count",
                    "min_service_duration",
                    "dist_office_towers",
                    "services_lag_7",
                    "day_of_week",
                    "month",
                }:
                    row[col] = 0
                elif col in {
                    "max_temp_c",
                    "precipitation_mm",
                    "avg_4_weeks",
                    "menu_price",
                    "google_rating",
                } or col.endswith("_mm") or col.endswith("_price") or col.endswith("_rating"):
                    row[col] = 0.0
                elif col.endswith("_duration"):
                    row[col] = 0
                elif col in {
                    "restaurant_segment_id",
                    "cuisine_type_id",
                    "terrace_setup_type_id",
                    "course_type_id",
                    "dish_id",
                    "prev_dish_id",
                }:
                    row[col] = 0
                else:
                    row[col] = ""

        # Create DataFrame and select columns in requested model order
        df = pd.DataFrame([[row[col] for col in selected_columns]], columns=selected_columns)

        int_columns = {
            "day_of_week",
            "month",
            "restaurant_id",
            "services_lag_7",
            "capacity_limit",
            "table_count",
            "min_service_duration",
            "dist_office_towers",
            "dish_id",
            "prev_dish_id",
            "restaurant_segment_id",
            "cuisine_type_id",
            "terrace_setup_type_id",
            "course_type_id",
        }
        float_columns = {
            "max_temp_c",
            "precipitation_mm",
            "avg_4_weeks",
            "menu_price",
            "google_rating",
        }
        bool_columns = {
            "is_rain_service_peak",
            "is_stadium_event",
            "is_azca_event",
            "is_holiday",
            "is_bridge_day",
            "is_payday_week",
            "is_business_day",
            "opens_weekends",
            "has_wifi",
        }

        # Dynamic typing guards for AutoML schemas with engineered *_id / is_* columns.
        for col in df.columns:
            if col.endswith("_id"):
                int_columns.add(col)
            if col.startswith("is_"):
                bool_columns.add(col)

        for col in int_columns.intersection(df.columns):
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0).astype("int64")

        for col in float_columns.intersection(df.columns):
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0.0).astype("float64")

        for col in bool_columns.intersection(df.columns):
            df[col] = df[col].astype(bool)

        if "service_date" in df.columns:
            df["service_date"] = pd.to_datetime(df["service_date"], errors="coerce")

        
        print(f"📊 DataFrame construido:")
        print(f"   Tipos: {df.dtypes.to_dict()}")
        print(f"   Shape: {df.shape}")
        
        return df

    def _normalize_category(self, data: dict) -> str:
        category = data.get("category")
        if category is None:
            category = data.get("course_type", "starter")

        normalized = str(category).strip().lower()
        alias_map = {
            "first_course": "starter",
            "second_course": "main",
        }
        return alias_map.get(normalized, normalized)

    @staticmethod
    def _as_bool(value: Any, default: bool = False) -> bool:
        if value is None:
            return default
        if isinstance(value, bool):
            return value
        if isinstance(value, (int, float)):
            return bool(value)
        return str(value).strip().lower() in {"1", "true", "yes", "on"}

    @staticmethod
    def _default_value_for_column(column: str) -> Any:
        bool_like = {
            "is_holiday",
            "is_business_day",
            "is_payday_week",
            "is_stadium_event",
            "is_azca_event",
        }
        int_like = {
            "day_of_week",
            "month",
            "restaurant_id",
            "cuisine_type_id",
            "restaurant_segment_id",
            "terrace_setup_type_id",
            "course_type_id",
            "prev_dish_id",
            "dish_id",
        }
        float_like = {
            "max_temp_c",
            "precipitation_mm",
            "menu_price",
        }

        if column in bool_like:
            return False
        if column in int_like:
            return 0
        if column in float_like:
            return 0.0
        return ""

    def _build_menu_feature_row(self, data: dict) -> dict[str, Any]:
        category = self._normalize_category(data)

        day_of_week = int(data.get("day_of_week", 0))
        month = int(data.get("month", 1))
        max_temp_c = float(data.get("max_temp_c", 20.0))
        precipitation_mm = float(data.get("precipitation_mm", 0.0))

        is_holiday = self._as_bool(data.get("is_holiday"), False)
        is_business_day = self._as_bool(data.get("is_business_day"), day_of_week < 5)
        is_payday_week = self._as_bool(data.get("is_payday_week"), False)
        is_stadium_event = self._as_bool(data.get("is_stadium_event"), False)
        is_azca_event = self._as_bool(data.get("is_azca_event"), False)

        restaurant_id = int(data.get("restaurant_id", 1))
        menu_price = float(data.get("menu_price", 15.0))

        cuisine_type = str(data.get("cuisine_type") or "mediterranean").strip().lower()
        restaurant_segment = str(data.get("restaurant_segment") or "traditional").strip().lower()
        terrace_setup_type = str(data.get("terrace_setup_type") or "none").strip().lower()

        course_type = {
            "starter": "first_course",
            "main": "second_course",
            "dessert": "dessert",
        }.get(category, "first_course")

        row = {
            "day_of_week": day_of_week,
            "month": month,
            "max_temp_c": max_temp_c,
            "precipitation_mm": precipitation_mm,
            "is_holiday": is_holiday,
            "is_business_day": is_business_day,
            "is_payday_week": is_payday_week,
            "is_stadium_event": is_stadium_event,
            "is_azca_event": is_azca_event,
            "restaurant_id": restaurant_id,
            "menu_price": menu_price,
            "cuisine_type": cuisine_type,
            "restaurant_segment": restaurant_segment,
            "terrace_setup_type": terrace_setup_type,
            "category": category,
            "course_type": course_type,
            "cuisine_type_id": self.CUISINE_TYPE_ID.get(cuisine_type, 0),
            "restaurant_segment_id": self.RESTAURANT_SEGMENT_ID.get(restaurant_segment, 0),
            "terrace_setup_type_id": self.TERRACE_SETUP_TYPE_ID.get(terrace_setup_type, 0),
            "course_type_id": self.COURSE_TYPE_ID.get(category, 0),
            "prev_dish_id": int(float(data.get("prev_dish_id", 0) or 0)),
            "dish_id": int(float(data.get("dish_id", 0) or 0)),
        }
        return row

    def build_menu_features(self, data: dict, expected_columns: list[str] | None = None) -> pd.DataFrame:
        """
        Build a minimal DataFrame for menu prediction models (starters, mains, desserts).
        
        These models only expect 8 specific features, in this exact order.
        No feature expansion or fixed fields - just pass the 8 features as-is.
        
        Args:
            data: dict with exactly these 9 keys:
                - day_of_week: int (0-6, Monday=0)
                - month: int (1-12)
                - max_temp_c: float
                - is_holiday: bool
                - is_business_day: bool
                - restaurant_id: int
                - cuisine_type: str
                - restaurant_segment: str
                - category: str ('starter', 'main', 'dessert')
        
        Returns:
            pd.DataFrame with 9 columns in the EXACT order expected by menu models
        """
        row = self._build_menu_feature_row(data)

        columns = expected_columns or self.MENU_COLUMNS
        normalized_columns = [str(col) for col in columns]

        for column in normalized_columns:
            if column not in row:
                row[column] = self._default_value_for_column(column)

        df = pd.DataFrame([[row[col] for col in normalized_columns]], columns=normalized_columns)
        
        print("📊 Menu DataFrame construido:")
        print(f"   Columns: {list(df.columns)}")
        print(f"   Tipos: {df.dtypes.to_dict()}")
        print(f"   Shape: {df.shape}")
        
        return df

    def build_unified_menu_features(self, data: dict) -> pd.DataFrame:
        """
        Build feature DataFrame for unified menu prediction model (azca_menu_model.pkl).
        
        This model accepts 15 features that determine the next dish (any course type).
        
        Args:
            data: dict with these 15 keys:
                - day_of_week: int (0-6)
                - month: int (1-12)
                - max_temp_c: float
                - precipitation_mm: float
                - is_holiday: int (0 or 1)
                - is_payday_week: int (0 or 1)
                - is_stadium_event: int (0 or 1)
                - is_azca_event: int (0 or 1)
                - restaurant_id: int
                - cuisine_type: str
                - restaurant_segment: str
                - terrace_setup_type: str
                - menu_price: float
                - course_type: str ('first_course', 'second_course', 'dessert')
                - prev_dish_id: float (ID del plato anterior o 0.0)
        
        Returns:
            pd.DataFrame with 15 columns in exact order for the unified model
        """
        # Expected column order for unified menu model
        UNIFIED_MENU_COLUMNS = [
            "day_of_week",
            "month",
            "max_temp_c",
            "precipitation_mm",
            "is_holiday",
            "is_payday_week",
            "is_stadium_event",
            "is_azca_event",
            "restaurant_id",
            "cuisine_type",
            "restaurant_segment",
            "terrace_setup_type",
            "menu_price",
            "course_type",
            "prev_dish_id",
        ]
        
        # Create row with all 15 features
        print(f"🔍 Input data recibido:\n{data}")
        row = {col: data.get(col) for col in UNIFIED_MENU_COLUMNS}
        
        # Validate all required fields are present
        missing = [col for col in UNIFIED_MENU_COLUMNS if row[col] is None]
        if missing:
            print(f"❌ Missing fields: {missing}")
            raise ValueError(f"Missing required unified menu features: {missing}")
        
        print(f"✅ Todos los campos presentes")
        
        # Ensure correct types
        row["day_of_week"] = int(row["day_of_week"])
        row["month"] = int(row["month"])
        row["max_temp_c"] = float(row["max_temp_c"])
        row["precipitation_mm"] = float(row["precipitation_mm"])
        row["is_holiday"] = int(row["is_holiday"])
        row["is_payday_week"] = int(row["is_payday_week"])
        row["is_stadium_event"] = int(row["is_stadium_event"])
        row["is_azca_event"] = int(row["is_azca_event"])
        row["restaurant_id"] = int(row["restaurant_id"])
        row["menu_price"] = float(row["menu_price"])
        row["prev_dish_id"] = float(row["prev_dish_id"])
        # cuisine_type, restaurant_segment, terrace_setup_type, course_type are already strings
        
        print(f"✅ Tipos convertidos correctamente")
        
        # Create DataFrame with all 15 columns in EXACT order
        df = pd.DataFrame([row])
        df = df[UNIFIED_MENU_COLUMNS]
        
        print(f"📊 Unified Menu DataFrame construido:")
        print(f"   Columns: {list(df.columns)}")
        print(f"   Tipos: {df.dtypes.to_dict()}")
        print(f"   Shape: {df.shape}")
        
        return df
