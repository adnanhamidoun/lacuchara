# AZCA Architecture & System Design

## System Overview

AZCA is built as a three-tier web application with ML inference at the backend:

```
┌──────────────────────────────────┐
│   Frontend Layer (React + Vite)  │
│   - Restaurant selector          │
│   - Date picker                  │
│   - Prediction display           │
│   - AI feedback UI               │
└────────────────┬─────────────────┘
                 │ REST API over HTTP/HTTPS
╔════════════════╧═════════════════╗
║ Backend Layer (FastAPI + Python)  ║
║                                    ║
║  ┌──────────────────────────────┐  ║
║  │ API Router (/predict, etc.)  │  ║
║  └──────────────┬───────────────┘  ║
║                 │                   ║
║  ┌──────────────▼───────────────┐  ║
║  │ Prediction Engine            │  ║
║  │ - Feature Engineering        │  ║
║  │ - XGBoost Inference          │  ║
║  │ - Result Formatting          │  ║
║  └──────────────┬───────────────┘  ║
║                 │                   ║
║  ┌──────────────▼───────────────┐  ║
║  │ Orchestration Layer          │  ║
║  │ - Cache manager              │  ║
║  │ - Data fetchers              │  ║
║  │ - Error handling             │  ║
║  └──────────────┬───────────────┘  ║
╚═════════════════╤════════════════════╝
                  │
        ┌─────────┼─────────┬─────────────┐
        │         │         │             │
   ┌────▼──┐ ┌───▼────┐ ┌──▼────┐  ┌────▼───┐
   │Azure  │ │Weather │ │Model  │  │ Logs & │
   │ SQL   │ │ API    │ │Cache  │  │ Audit  │
   │ DB    │ │ (Free) │ │(.pkl) │  │Database│
   └───────┘ └────────┘ └───────┘  └────────┘
```

## Component Architecture

### Frontend Layer

- **Technology:** React 18, Vite 5, Tailwind CSS
- **Responsibilities:**
  - Restaurant & date selection UI
  - Prediction result display
  - User feedback collection (AI supervision)
  - Responsive mobile design
- **Modules:**
  - `pages/` - Full-page views
  - `components/` - Reusable UI components
  - `services/` - API client logic
  - `hooks/` - Custom React hooks
  - `context/` - Global state management

### Backend API Layer

- **Technology:** FastAPI, Python 3.10+, Uvicorn
- **Responsibilities:**
  - HTTP endpoint definitions
  - Request validation (Pydantic)
  - Response formatting
  - Error handling & logging
- **Key Files:**
  - `backend/api/main.py` - FastAPI app & routes

### Prediction Engine

- **Technology:** XGBoost, pandas, scikit-learn
- **Responsibilities:**
  - Feature vector construction
  - ML model inference
  - Confidence score calculation
  - Fallback logic
- **Key Files:**
  - `backend/core/engine.py` - Prediction logic
  - `backend/core/pipeline.py` - Feature engineering

### Model Management

- **Technology:** Azure ML, joblib
- **Responsibilities:**
  - Model download & caching
  - Version management
  - Automatic retraining
- **Key Files:**
  - `backend/core/manager.py` - Model lifecycle
  - `backend/core/scheduler.py` - Monthly refresh job

### Data Layer

- **Technology:** SQLAlchemy ORM, Azure SQL, pyodbc
- **Responsibilities:**
  - Restaurant data persistence
  - Historical service tracking
  - Prediction audit logging
  - User feedback storage
- **Key Files:**
  - `backend/db/database.py` - ORM setup
  - `backend/db/models.py` - Data models
  - `backend/db/schema.sql` - Database schema

## Data Flow (Request → Response)

```
1. USER INPUT (Frontend)
   │
   ├─ Click "Predecir"
   ├─ Build request: {restaurant_id, date}
   └─ POST /predict/service

2. API VALIDATION (Backend)
   │
   ├─ Check restaurant exists
   ├─ Validate date format
   ├─ Check authorization (future)
   └─ Pass to engine

3. FEATURE ENGINEERING (Pipeline)
   │
   ├─ Restaurant attributes (from DB cache)
   ├─ Weather data (from Open-Meteo API)
   ├─ Calendar features (computed)
   ├─ Historical patterns (from DB)
   └─ Build feature vector: [30+ features]

4. MODEL INFERENCE (Engine)
   │
   ├─ Load XGBoost model (cached in memory)
   ├─ Execute: model.predict(features)
   ├─ Get prediction: ~82 services
   ├─ Calculate confidence: 0.87
   └─ Breakdown by factor

5. AUDIT LOGGING (DB)
   │
   ├─ Store prediction in database
   ├─ Log inputs & outputs
   ├─ Timestamp & model version
   └─ Track for feedback later

6. RESPONSE FORMATTING
   │
   ├─ Build JSON response
   ├─ Include confidence & factors
   ├─ Format for frontend display
   └─ HTTP 200 OK

7. FRONTEND DISPLAY
   │
   ├─ Receive prediction
   ├─ Render large number (82)
   ├─ Show confidence indicator
   ├─ Display factor breakdown
   └─ Enable feedback buttons ("Good/Neutral/Bad")

8. USER FEEDBACK (Optional)
   │
   ├─ User rates prediction
   ├─ POST /feedback/{prediction_id}
   ├─ Store in prediction_feedback table
   └─ Used for future model improvement
```

## Architectural Decisions

### Design Patterns

1. **Separation of Concerns**
   - API layer → only HTTP concerns
   - Core layer → business logic (feature engineering, ML)
   - DB layer → data access only

2. **Caching Strategy**
   - Restaurant data: 24h TTL
   - Weather data: 12h TTL (already cached by API)
   - ML model: Restart only
   - Historical data: 6h TTL

3. **Error Handling**
   - Graceful fallback (use cached weather if API fails)
   - Meaningful error messages
   - Detailed logging for debugging
   - User-friendly errors in response

4. **Async/Await**
   - All I/O operations non-blocking
   - Enables 100+ concurrent users
   - FastAPI's built-in async support

### Technology Choices

| Choice         | Why                                      | Alternative                       |
| -------------- | ---------------------------------------- | --------------------------------- |
| **FastAPI**    | Modern, fast, async-first                | Django REST (heavier)             |
| **XGBoost**    | SOTA for tabular data, fast inference    | Linear regression (less accurate) |
| **React**      | Large ecosystem, component reusability   | Vue, Svelte (less mature)         |
| **Vite**       | Lightning-fast builds (<1s reload)       | Webpack (slower)                  |
| **Azure**      | Enterprise compliance, EU data residency | AWS, GCP                          |
| **SQLAlchemy** | Database-agnostic ORM                    | Raw SQL (less maintainable)       |

## Performance Characteristics

### Response Time Breakdown

| Component           | Time          | Cache Impact |
| ------------------- | ------------- | ------------ |
| API validation      | 1ms           | N/A          |
| Feature cache hit   | 10ms          | -200ms       |
| Weather API call    | 200-500ms     | Depends      |
| DB query            | 50-100ms      | Cached?      |
| XGBoost inference   | 15-30ms       | N/A          |
| Response formatting | 2ms           | N/A          |
| **Total (best)**    | **278-343ms** | All cached   |
| **Total (worst)**   | **578-643ms** | Fresh data   |

### Throughput

- Single prediction: 2-3/second (sequential)
- Concurrent predictions: 50-100 simultaneous
- Batch predictions: 1000 predictions/minute

### Storage

- XGBoost model: ~50 MB
- 1 year data (20 restaurants): ~500 MB
- Prediction logs: ~1 GB/million predictions
- Total deployment: 2-5 GB

## Scalability

### Vertical Scaling

- More CPU → faster inference & DB queries
- More RAM → larger model cache & connection pool
- SSD storage → faster DB operations

### Horizontal Scaling

- Multiple backend instances behind load balancer
- Shared database (Azure SQL)
- Shared model cache (Azure ML registry)
- No session affinity needed

### Deployment Options

- **Single server:** All-in-one (dev/small production)
- **Multi-tier:** Backend & frontend separated
- **Containerized:** Docker + Kubernetes (enterprise)

## Security Architecture

### Data Protection

- **Encryption in transit:** HTTPS/TLS 1.2+
- **Encryption at rest:** Azure SQL encryption
- **No PII:** Only aggregated restaurant data
- **Retention:** 12-month rolling window

### Access Control (Future)

- Azure AD authentication
- Role-based authorization (admin/user/viewer)
- API rate limiting
- Audit trail for compliance

## Monitoring & Observability

### Metrics Tracked

- Prediction confidence (distribution)
- Response time (P50, P95, P99)
- Error rate (5xx, 4xx per endpoint)
- Model performance (MAE vs. actuals)
- User feedback distribution
- Database connection pool utilization

### Alerts

- High error rate (>5%)
- Latency degradation (>1s)
- Model performance drop (MAE increase)
- DB connection failures
- Low prediction confidence

## Deployment Environments

### Development

```
Frontend: npm run dev (hot reload)
Backend: uvicorn api.main:app --reload (hot reload)
Database: Local/cloud with .env
```

### Production

```
Frontend: dist/ (static files → CDN)
Backend: Gunicorn/Nginx (or Azure App Service)
Database: Azure SQL (with backups)
Models: Azure ML registry (versioned)
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed setup.

## Operational Notes

- **ODBC Driver:** Use version 17/18 for SQL Server
- **Environment Variables:** Never commit `.env`
- **Model Updates:** Manual trigger or scheduled job
- **Database Backups:** Daily via Azure SQL
- **Logs:** Centralized in application startup logs

---

**See also:** [FEATURES.md](FEATURES.md), [API_REFERENCE.md](API_REFERENCE.md), [DEPLOYMENT.md](DEPLOYMENT.md)
