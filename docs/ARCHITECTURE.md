# System Architecture

## Overview

AZCA is a **Model-as-a-Service (MaaS)** prediction engine for restaurant demand forecasting. Users provide minimal input (restaurant + date + optional events), and the system automatically enriches data from multiple sources before predicting service demand.

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────────┐
│ FRONTEND (React + Vite)                                         │
│ - Restaurant dropdown selector                                  │
│ - Date picker                                                   │
│ - Event toggles (Stadium, AZCA)                                │
│ - Results display (prediction + metadata)                      │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP (Vite proxy)
         ┌───────────────┴──────────────┐
         ↓ GET /restaurants             ↓ POST /predict
┌─────────────────────────────────────────────────────────────────┐
│ BACKEND (FastAPI)                                               │
├─────────────────────────────────────────────────────────────────┤
│ 1. API LAYER (endpoints)                                        │
│    - /health: liveness check                                   │
│    - /restaurants: list dropdown                               │
│    - /restaurants/{id}: auto-populate form                     │
│    - /predict: main prediction endpoint                        │
│                                                                 │
│ 2. ORCHESTRATION LAYER (automatic data gathering)              │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ When POST /predict is called:                             │   │
│ ├──────────────────────────────────────────────────────────┤   │
│ │ a) Fetch restaurant details from Azure SQL               │   │
│ │    └─ 13 fields: capacity, tables, cuisine, rating, etc. │   │
│ │                                                            │   │
│ │ b) Get weather data from Open-Meteo API                  │   │
│ │    └─ max_temp_c, precipitation_mm, rain_peak_hours      │   │
│ │                                                            │   │
│ │ c) Calculate calendar features                            │   │
│ │    └─ is_business_day, is_holiday, is_bridge_day, etc.   │   │
│ │                                                            │   │
│ │ d) Query historical services data                         │   │
│ │    └─ services_lag_7, avg_4_weeks with fallback logic    │   │
│ └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│ 3. PREDICTION LAYER (XGBoost model)                            │
│    - Receives 30+ features from orchestration                 │
│    - Returns demand forecast (integer)                        │
│    - Logs prediction to audit table                          │
│                                                                 │
│ 4. DATA LAYER (SQLAlchemy ORM)                                │
│    - Restaurant model (dim_restaurants table)                │
│    - FactServices model (historical data)                    │
│    - PredictionLog model (audit trail)                      │
└──────────────────────┬──────────────────────────────┬──────────┘
                       │                              │
        ┌──────────────┴─────────┐                    │
        ↓ Azure SQL              ↓ Open-Meteo         │
    ┌─────────────┐      ┌──────────────┐            │
    │ Restaurant  │      │ Weather Data │            │
    │ Historical  │      │ - Temp       │            │
    │ Audit       │      │ - Precip     │            │
    │ Tables      │      │ - Hourly     │            │
    └─────────────┘      └──────────────┘            │
                                              ┌──────┴────────┐
                                              ↓ Logs file     │
                                            server.log        │
```

## Component Details

### 1. Frontend (React + Tailwind CSS)

**File:** `frontend/src/App.jsx`

**Features:**
- Responsive mobile-first UI with Tailwind CSS
- Restaurant dropdown (loads from `GET /restaurants`)
- Date picker (defaults to today)
- Event toggles: Stadium ⚽ and AZCA 🏢 events
- Results panel showing prediction + metadata

**State Management:**
```javascript
restaurantId        // User selected
serviceDate         // User selected
isStadiumEvent      // User selected
isAzcaEvent         // User selected
capacityLimit       // Auto-filled from /restaurants/{id}
tableCount          // Auto-filled from /restaurants/{id}
... (other fields)  // Auto-filled from /restaurants/{id}
```

**Data Flow:**
1. Load page → `fetchRestaurants()` → populate dropdown
2. User selects restaurant → `handleRestaurantChange()` → `fetchRestaurantDetail(id)` → populate form
3. User selects date & events → `handleSubmit()` → `POST /predict` → display result

### 2. Backend - API Layer

**File:** `backend/api/main.py`

**Endpoints:**

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | Liveness check |
| GET | `/restaurants` | List restaurants for dropdown |
| GET | `/restaurants/{id}` | Get restaurant details (form population) |
| POST | `/predict` | Main prediction request |

### 3. Backend - Orchestration Layer

**Functions:**

#### `get_weather_data(service_date: date) → dict`
- Calls Open-Meteo API (free, no auth)
- Returns: max_temp_c, precipitation_mm, is_rain_service_peak
- **Fallback:** 20°C, 0mm, no rain if API fails
- **Coordinates:** Azca Madrid (40.4519°N, -3.6884°W)

#### `get_services_data(db, restaurant_id, service_date, capacity_limit) → dict`
- Queries `fact_services` table
- **Strategy:**
  1. Try exact date match
  2. If not found → fetch most recent record
  3. If no records → use 70% of capacity as fallback
- Returns: services_lag_7, avg_4_weeks

#### `calculate_calendar_features(service_date: date) → dict`
- Uses `holidays` library (Spanish calendar, Madrid)
- Calculates: is_business_day, is_holiday, is_bridge_day, is_payday_week
- No external API calls (pure Python)

### 4. Backend - Prediction Layer

**File:** `backend/core/engine.py` (PredictionEngine class)

**Process:**
1. **Input Assembly:** Receives 30+ features from orchestration
2. **Model Loading:** XGBoost model from `backend/azca/artifacts/`
3. **Prediction:** Returns integer (forecasted service count)
4. **Fallback:** If model unavailable, returns mock value (150)

### 5. Backend - Data Layer

**File:** `backend/db/models.py`

**Models:**

#### Restaurant (ORM)
Maps `dim_restaurants` table:
```python
restaurant_id       # PK
name
capacity_limit
table_count
min_service_duration
terrace_setup_type
opens_weekends
has_wifi
restaurant_segment
menu_price
dist_office_towers
google_rating
cuisine_type
```

#### FactServices (ORM)
Maps `fact_services` table:
```python
date_id             # PK (YYYYMMDD format)
restaurant_id       # PK (composite with date_id)
services_lag_7      # Average services last 7 days
avg_4_weeks         # Average services last 4 weeks
```

#### PredictionLog (ORM)
Maps `PredictionLogs` table (audit):
```python
id
service_date
prediction_result
model_version
full_input_json     # Complete input snapshot
execution_timestamp
```

## Data Flow Example

**User Action:** Select Restaurant #1, Date 2026-03-15, No Events

**Backend Processing:**

```
POST /predict
├─ Restaurant details (Azure SQL)
│  └─ capacity_limit=150, cuisine_type="spanish", rating=4.8, ...
├─ Weather (Open-Meteo API)
│  └─ 15°C, 2.5mm precip, no peak rain
├─ Calendar calculation
│  └─ business_day=True, holiday=False, payday=False, ...
├─ Historical services (Azure SQL)
│  └─ lag_7=68, avg_4w=72
├─ Prediction (XGBoost)
│  └─ Forecast: 87 services expected
└─ Audit log (Azure SQL)
   └─ Saved full input snapshot for traceability
```

**Response:** 87 expected services

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18, Vite, Tailwind CSS | UI/UX |
| **Backend** | FastAPI, Pydantic | REST API, validation |
| **ORM** | SQLAlchemy 2.0 | Database abstraction |
| **DB Driver** | pyodbc | SQL Server connection |
| **ML Model** | XGBoost 1.5.2 | Demand prediction |
| **Weather API** | Open-Meteo (free) | Real-time weather data |
| **Calendar** | holidays 0.92 | Spanish holiday detection |
| **Server** | Uvicorn | ASGI application server |

## Design Principles

### 1. **User Simplicity**
- Users only provide 2-3 visible inputs
- Everything else calculated/fetched automatically
- Minimal cognitive load

### 2. **Data Richness**
- Automatic enrichment from 4 sources:
  - Restaurant database (13 fields)
  - External API (weather)
  - Calculations (calendar)
  - Historical database (services)
- 30+ features for model

### 3. **Fallback Resilience**
- Each data source has fallback strategy
- System continues if external API fails
- Historical data uses most recent record if exact date unavailable

### 4. **Auditability**
- All predictions logged with full input snapshot
- Model version tracked
- Execution timestamp recorded
- Enables retraining and debugging

### 5. **Clean Logging**
- Only meaningful logs (no debug verbosity)
- Input snapshot on each prediction for debugging
- Errors logged with context

## Deployment Considerations

See [DEPLOYMENT.md](./DEPLOYMENT.md) for:
- Security (authentication, API keys)
- Scaling (load balancing, caching)
- Monitoring (error tracking, metrics)
- CI/CD pipeline setup

## Performance Notes

**Typical End-to-End Latency:**
- Frontend render: ~50ms
- Open-Meteo API call: 200-500ms
- Azure SQL queries: 100-200ms (cached)
- Calendar calculation: <1ms
- XGBoost prediction: 10-50ms
- **Total:** ~400-800ms (mostly API I/O)

**Optimization Opportunities:**
- Cache weather data (expires daily)
- Pre-load restaurant details on app startup
- Connection pooling for SQL
- Model quantization (lighter XGBoost)
