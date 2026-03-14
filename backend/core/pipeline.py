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

    def build_features(self, data: dict) -> pd.DataFrame:
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

        # Build the feature row
        row = {
            "service_date": service_date,  # Keep as datetime/Timestamp
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

        # Merge with fixed fields (can be overridden per restaurant)
        row.update(self.fixed_fields)
        
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

        # Create DataFrame and select columns in model order
        df = pd.DataFrame([row])
        df = df[self.MODEL_COLUMNS]
        
        print(f"📊 DataFrame construido:")
        print(f"   Tipos: {df.dtypes.to_dict()}")
        print(f"   Shape: {df.shape}")
        
        return df

    def build_menu_features(self, data: dict) -> pd.DataFrame:
        """
        Build a minimal DataFrame for menu prediction models (starters, mains, desserts).
        
        These models only expect 8 specific features, in this exact order.
        No feature expansion or fixed fields - just pass the 8 features as-is.
        
        Args:
            data: dict with exactly these 8 keys:
                - day_of_week: int (0-6, Monday=0)
                - month: int (1-12)
                - max_temp_c: float
                - is_holiday: bool
                - is_business_day: bool
                - restaurant_id: int
                - cuisine_type: str
                - restaurant_segment: str
        
        Returns:
            pd.DataFrame with 8 columns in the EXACT order expected by menu models
        """
        # Expected column order for menu models (from signature)
        MENU_COLUMNS = [
            "day_of_week",
            "month",
            "max_temp_c",
            "is_holiday",
            "is_business_day",
            "restaurant_id",
            "cuisine_type",
            "restaurant_segment",
        ]
        
        # Create minimal row with only these 8 features
        row = {col: data.get(col) for col in MENU_COLUMNS}
        
        # Validate all required fields are present
        missing = [col for col in MENU_COLUMNS if row[col] is None]
        if missing:
            raise ValueError(f"Missing required menu features: {missing}")
        
        # Ensure correct types
        row["day_of_week"] = int(row["day_of_week"])
        row["month"] = int(row["month"])
        row["max_temp_c"] = float(row["max_temp_c"])
        row["is_holiday"] = bool(row["is_holiday"])
        row["is_business_day"] = bool(row["is_business_day"])
        row["restaurant_id"] = int(row["restaurant_id"])
        # cuisine_type and restaurant_segment are already strings
        
        # Create DataFrame with only these 8 columns in EXACT order
        df = pd.DataFrame([row])
        df = df[MENU_COLUMNS]
        
        print(f"📊 Menu DataFrame construido:")
        print(f"   Columns: {list(df.columns)}")
        print(f"   Tipos: {df.dtypes.to_dict()}")
        print(f"   Shape: {df.shape}")
        
        return df
