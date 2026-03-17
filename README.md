# AZCA — AI Restaurant Demand Forecasting

**Predict daily service volume with minimal input.** Automatically enriches data from Azure SQL, weather APIs, and historical trends to forecast restaurant demand using XGBoost models.

## 📖 Documentation

| Guide | Description |
|-------|-------------|
| **[docs/SETUP.md](docs/SETUP.md)** | Installation & local setup |
| **[docs/API.md](docs/API.md)** | REST API endpoints |
| **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** | System design & components |
| **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** | Production deployment |
| **[docs/PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md)** | Project directory layout |

---

## 🚀 Quick Start (5 minutes)

### Backend Setup

```powershell
# 1. Activate virtual environment
.\venv\Scripts\Activate.ps1

# 2. Install dependencies
pip install -r backend/requirements.txt

# 3. Create .env file (copy from template)
# DB_SERVER=azcaserver.database.windows.net
# DB_NAME=azcadb
# DB_USER=azca
# DB_PASS=your_password

# 4. Run server
cd backend
uvicorn api.main:app --reload
```

**Backend ready:** http://127.0.0.1:8000

### Frontend Setup

```powershell
# 1. Install dependencies
cd frontend
npm install

# 2. Run development server
npm run dev
```

**Frontend ready:** http://localhost:5173

### Verify Everything Works

```powershell
# Health check
curl http://127.0.0.1:8000/health

# Should return:
# {"status":"healthy","environment":"development"}
```

---

## ✨ Key Features

✅ **Minimal User Input** — Only 2-3 visible form fields (restaurant, date, events)

✅ **Automatic Data Enrichment** — Fetches from 4 sources:
- Restaurant details (Azure SQL)
- Real-time weather (Open-Meteo API, free)
- Calendar features (Spanish holidays, payroll weeks)
- Historical services (Azure SQL with intelligent fallback)

✅ **XGBoost Predictions** — Forecasts daily service volume (30+ features)

✅ **Mobile-Responsive UI** — Tailwind CSS, works on all devices

✅ **Production-Ready** — Logging, error handling, audit trail, deployment docs

✅ **Azure Native** — Built for Azure SQL, App Service, Static Web Apps

---

## 🏗️ Architecture

```
┌─────────────────────────────┐
│  Frontend (React + Vite)     │
│  - Restaurant dropdown       │
│  - Date picker               │
│  - Event toggles             │
└──────────────┬──────────────┘
               │ HTTP
┌──────────────▼──────────────┐
│  Backend (FastAPI)           │
│  ├─ API Layer (endpoints)    │
│  ├─ Orchestration:           │
│  │  ├─ Azure SQL (restaurant)│
│  │  ├─ Open-Meteo (weather)  │
│  │  ├─ Calendar calc         │
│  │  └─ Historical DB         │
│  ├─ Prediction (XGBoost)     │
│  └─ Audit logging            │
└──────────────┬──────────────┘
               │
       ┌───────┴───────┬──────────────┐
       ▼               ▼              ▼
   Azure SQL      Open-Meteo      server.log
```

---

## 📊 Data Flow

1. **User inputs:** Select restaurant → Pick date → Toggle events (optional)
2. **Frontend calls:** `GET /restaurants/{id}` → Auto-populate form fields
3. **User submits:** Click "Predecir" → `POST /predict`
4. **Backend orchestrates:**
   - Fetches restaurant details from Azure SQL
   - Gets weather from Open-Meteo API
   - Calculates calendar features (holidays, business days)
   - Queries historical services data
   - Combines all 30+ features
5. **Prediction:** XGBoost model returns forecast
6. **Audit:** Logs full input/output to database
7. **Response:** Prediction + execution timestamp sent to UI

---

## 🛠️ Tech Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| **Frontend** | React + Vite + Tailwind | 18.3 + 5.6 + 3.4 |
| **Backend** | FastAPI + Pydantic | 0.135 + 2.12 |
| **ORM** | SQLAlchemy | 2.0.48 |
| **Database** | Azure SQL + pyodbc | SQL Server 2019+ |
| **ML Model** | XGBoost | 1.5.2 |
| **Weather API** | Open-Meteo (free) | — |
| **Calendar** | holidays (Spain) | 0.92 |
| **Server** | Uvicorn | 0.41 |
| **Python** | CPython | 3.10.11 |

---

## 📁 Project Structure

```
lacuchara/
├── backend/
│   ├── api/
│   │   └── main.py           # FastAPI app, endpoints, orchestration
│   ├── db/
│   │   ├── database.py       # Connection & session factory
│   │   └── models.py         # SQLAlchemy ORM models
│   ├── core/
│   │   ├── engine.py         # XGBoost prediction engine
│   │   ├── pipeline.py       # Feature engineering
│   │   └── manager.py        # Model management
│   ├── azca/artifacts/
│   │   └── MLmodel/          # XGBoost artifacts
│   ├── requirements.txt      # Python dependencies (pinned versions)
│   └── tests/
│       ├── test_core.py
│       ├── test_integration.py
│       └── manual_test.py
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx           # Main React component
│   │   ├── main.jsx          # Entry point
│   │   └── assets/           # Static files
│   ├── package.json          # Node dependencies
│   ├── vite.config.js        # Vite proxy configuration
│   └── tailwind.config.js    # Tailwind CSS config
│
├── docs/                     # Documentation
│   ├── SETUP.md              # Installation guide
│   ├── API.md                # REST endpoints
│   ├── ARCHITECTURE.md       # System design
│   ├── DEPLOYMENT.md         # Production deployment
│   ├── guides/               # Operational notes and walkthroughs
│   └── docker/               # Docker and deployment guides
│
├── scripts/
│   ├── db/                   # DB setup and migration helpers
│   ├── run/                  # Local server startup helpers
│   ├── deploy/               # Deployment automation scripts
│   └── utils/                # Utility scripts
│
├── tests/
│   ├── scripts/              # Manual/integration scripts
│   └── assets/               # Test assets (images, fixtures)
│
├── .env                      # Environment variables (DO NOT commit)
├── .gitignore                # Git ignore rules
└── README.md                 # This file
```

---

## 🔌 API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/health` | Liveness check |
| GET | `/restaurants` | List all restaurants (dropdown data) |
| GET | `/restaurants/{id}` | Get restaurant details (form auto-fill) |
| POST | `/predict` | Create prediction request |

**Full documentation:** See [docs/API.md](docs/API.md)

---

## 📝 Example Usage

### Get Restaurant List
```bash
curl http://127.0.0.1:8000/restaurants
```

### Get Restaurant Details
```bash
curl http://127.0.0.1:8000/restaurants/1
```

### Make Prediction
```bash
curl -X POST http://127.0.0.1:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "service_date": "2026-03-15",
    "restaurant_id": 1,
    "capacity_limit": 150,
    "table_count": 12,
    "min_service_duration": 45,
    "terrace_setup_type": "outdoor",
    "opens_weekends": true,
    "has_wifi": true,
    "restaurant_segment": "fine_dining",
    "menu_price": 42.50,
    "dist_office_towers": 250,
    "google_rating": 4.8,
    "cuisine_type": "spanish",
    "is_stadium_event": false,
    "is_azca_event": false
  }'
```

---

## 🚀 Deployment

### Development
```powershell
# Terminal 1: Backend
cd backend
uvicorn api.main:app --reload

# Terminal 2: Frontend
cd frontend
npm run dev
```

### Production
See **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** for:
- Azure App Service deployment
- Docker containerization
- VM setup with systemd
- Security hardening
- Monitoring & scaling

Quick deploy to Azure:
```bash
cd backend
az webapp up --name azca-api --resource-group azca-rg
```

---

## 🧪 Testing

### Run Tests
```powershell
# Install dev dependencies
pip install -r backend/requirements.txt
pip install pytest pytest-cov

# Run all tests
pytest backend/tests/ -v

# Run specific test
pytest backend/tests/test_core.py::test_prediction -v

# With coverage
pytest backend/tests/ --cov=backend --cov-report=html
```

---

## 🔐 Security

### Before Committing
- ✅ Never commit `.env` (add to `.gitignore`)
- ✅ Use Azure Key Vault for secrets
- ✅ Enable SQL Server firewall rules
- ✅ Use HTTPS in production

### Authentication
Currently **no authentication** (development). For production, add:
- Azure AD integration
- API key management
- Rate limiting

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md#security-best-practices)

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| **ModuleNotFoundError: pyodbc** | `pip install pyodbc` |
| **Port 8000 in use** | Kill process: `netstat -ano \| findstr :8000` |
| **Azure SQL connection fails** | Check `.env` credentials and firewall rules |
| **Frontend can't reach backend** | Ensure Vite proxy in `vite.config.js` points to `http://127.0.0.1:8000` |
| **XGBoost model not found** | Check `backend/azca/artifacts/MLmodel` exists |
| **Weather API returns 400** | Check coordinates and Open-Meteo API availability |

---

## 📚 Documentation

| Document | Contents |
|----------|----------|
| [docs/SETUP.md](docs/SETUP.md) | Prerequisites, installation, verification, troubleshooting |
| [docs/API.md](docs/API.md) | Endpoint specs, request/response examples, error codes |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design, data flow, components, tech stack |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Prod deployment options, scaling, monitoring, security |

---

## 📊 Performance

| Metric | Value |
|--------|-------|
| **Open-Meteo API latency** | 200-500ms |
| **Azure SQL queries** | 100-200ms |
| **XGBoost prediction** | 10-50ms |
| **Frontend to API round trip** | ~400-800ms total |

### Optimization Tips
- Cache weather data (expires daily)
- Pre-load restaurant list on app startup
- Use connection pooling for SQL (20 connections default)
- Quantize XGBoost model for 2-3x speedup if needed

---

## � IA Responsable (Responsible AI)

AZCA implements **3 pillars of responsible AI** to ensure transparent, safe, and user-controlled predictions:

### 1️⃣ **Transparencia y Explicabilidad** (Transparency)
- **Model Cards** explaining data sources, limitations, and performance
- **Data provenance** documented (Azure SQL, weather APIs, historical trends)
- **AI disclaimers** warning users about potential "alucinaciones" (hallucinations)
- **Confidence breakdowns** showing which factors influenced each prediction

### 2️⃣ **Privacidad y Seguridad** (Privacy & Security)
- **No personal data** — only aggregated, anonymous restaurant statistics
- **GDPR compliant** — data retention policies, user privacy controls
- **EU AI Act ready** — documentation for regulatory requirements
- **Encrypted data** in transit (HTTPS) and at rest (Azure SQL encryption)

### 3️⃣ **Control Humano** (Human Control)
- **User feedback mechanism** — Users can rate predictions (👍 Good / 👌 Regular / 👎 Bad)
- **Prediction rejection** — Users can ignore AI suggestions and use their expertise
- **Supervision controls** — "You always have control" messaging
- **Non-automated decisions** — Humans make final decisions, AI suggests

### Components
11 React components in `frontend/src/components/ai/`:
- `AITransparencyCard` — Model Card template
- `AIDisclaimer` — Alert system for warnings
- `ServicePredictionTransparency` — Breaks down service predictions
- `MenuPredictionTransparency` — Breaks down menu predictions  
- `AIFailureWarning` — Documents failure scenarios
- `PredictionConfidenceBreakdown` — Visual factor breakdown
- `AIResponsibleHealthCheck` — System health dashboard
- `AIResponsibleBadge` — Responsibility indicators
- `AIFeedbackButton` — User feedback UI (👍👌👎)
- `AISupervisionSection` — Control principles explanation
- `PredictionWithDisclaimer` — Wrapper component

### Quick Start
See **[docs/guides/IA_RESPONSABLE_QUICKSTART.md](docs/guides/IA_RESPONSABLE_QUICKSTART.md)** for:
- Component usage examples
- Integration instructions
- Dark mode configuration
- Customization options

**Full documentation:** [docs/guides/](docs/guides/) contains 10+ comprehensive guides

---

## �🤝 Contributing

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make changes and test: `pytest backend/tests/`
3. Commit: `git commit -m "Add feature: my-feature"`
4. Push: `git push origin feature/my-feature`
5. Open a pull request

---

## 📞 Support

- **Issues:** Open GitHub issues for bugs/features
- **Discussions:** Use GitHub discussions for questions
- **Emergency:** Contact data science team

---

## 📄 License

Proprietary — AZCA Restaurants. All rights reserved.

---

## 🎯 Roadmap

- [ ] User authentication (Azure AD)
- [ ] Advanced analytics dashboard
- [ ] Batch predictions
- [ ] Model versioning & A/B testing
- [ ] Mobile app (React Native)
- [ ] Real-time demand monitoring
- [ ] Integration with POS systems

---

**Last Updated:** March 13, 2026  
**Status:** ✅ Production Ready  
**Contributors:** Data Science Team

---

## ✅ Testing

**12 tests** verify:
- Model load & caching
- Feature transformation (shape, columns, logic)
- Complete prediction pipeline
- Multiple scenarios (golden day, rain, winter, holiday)

**All passing** ✓

---

## 📦 Dependencies

**Production:**
- `numpy`, `pandas`, `scikit-learn`, `scipy`
- `azureml-*` (AutoML models)
- `fastapi`, `uvicorn`, `pydantic`

**Development:**
- `pytest` (testing)
- `jupyter` (notebooks)
- `black`, `flake8`, `mypy` (optional code quality)

Pinned versions in `requirements.txt` ensure reproducibility.

---

## 🚧 Next Steps

1. **API** (`azca/api/app.py`): FastAPI endpoints
2. **UI** (`azca/ui/`): Dashboard for predictions
3. **Logging**: Debug trails for model loads & predictions
4. **Error handling**: Input validation & custom exceptions

---

## 🔗 Links

- Model: `azca/artifacts/azca_demand_v1.pkl`
- Tests: `azca/tests/`

