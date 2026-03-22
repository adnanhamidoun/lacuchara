# AZCA - AI Restaurant Demand Forecasting Platform

Predict daily service volume and optimize restaurant operations with AI-powered demand forecasting.

AZCA is an intelligent platform that forecasts restaurant demand by analyzing historical data, weather, calendar events, and restaurant characteristics. Built with FastAPI, React, and Azure ML, it provides predictive insights with human-supervised feedback loops.

## Documentation

| Guide | Description |
| --- | --- |
| [docs/SETUP.md](docs/SETUP.md) | Installation and local setup |
| [docs/API.md](docs/API.md) | REST API endpoints |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design and components |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Production deployment |
| [docs/PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md) | Project directory layout |
| [docs/AI_RESPONSIBLE_STANDARD.md](docs/AI_RESPONSIBLE_STANDARD.md) | Responsible AI baseline standard |

---

## Quick Start (5 minutes)

### Backend setup

```powershell
.\venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt
cd backend
uvicorn api.main:app --reload
```

Backend URL: http://127.0.0.1:8000

### Frontend setup

```powershell
cd frontend
npm install
npm run dev
```

Frontend URL: http://localhost:5173

### Health check

```powershell
curl http://127.0.0.1:8000/health
```

Expected response:

```json
{"status":"healthy","environment":"development"}
```

---

## Key Features

- Minimal user input: 2 to 3 visible fields (restaurant, date, events)
- Automatic data enrichment from 4 sources:
  - Restaurant details (Azure SQL)
  - Real-time weather (Open-Meteo API)
  - Calendar features (holidays and payroll periods)
  - Historical services with fallback logic
- XGBoost predictions using 30+ engineered features
- Mobile-responsive UI with Tailwind CSS
- Production-ready logging, error handling, and audit trail
- Azure-native deployment path

---

## Architecture

```text
Frontend (React + Vite)
  -> Restaurant selector
  -> Date picker
  -> Event toggles
  -> Calls backend API

Backend (FastAPI)
  -> API layer
  -> Orchestration layer
  -> Data sources:
     - Azure SQL
     - Open-Meteo
     - Calendar features
     - Historical services
  -> Prediction engine (XGBoost)
  -> Audit logging
```

---

## Data Flow

1. User selects restaurant, date, and optional events.
2. Frontend calls GET /restaurants/{id} to prefill fields.
3. User submits prediction request to POST /predict.
4. Backend enriches request with restaurant, weather, calendar, and historical features.
5. Model returns predicted service volume.
6. Request and response are stored for audit.
7. Frontend receives prediction and timestamp.

---

## Tech Stack

| Component | Technology | Version |
| --- | --- | --- |
| Frontend | React + Vite + Tailwind | 18.3 + 5.6 + 3.4 |
| Backend | FastAPI + Pydantic | 0.135 + 2.12 |
| ORM | SQLAlchemy | 2.0.48 |
| Database | Azure SQL + pyodbc | SQL Server 2019+ |
| ML Model | XGBoost | 1.5.2 |
| Weather API | Open-Meteo | Public API |
| Calendar | holidays (Spain) | 0.92 |
| Server | Uvicorn | 0.41 |
| Python | CPython | 3.10.11 |

---

## API Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | /health | Liveness check |
| GET | /restaurants | List restaurants |
| GET | /restaurants/{id} | Get restaurant details |
| POST | /predict | Create prediction |

Full reference: [docs/API.md](docs/API.md)

---

## Deployment

### Development

```powershell
cd backend
uvicorn api.main:app --reload
```

```powershell
cd frontend
npm run dev
```

### Production

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for App Service, Docker, VM, security, and monitoring guidance.

---

## Testing

```powershell
pip install -r backend/requirements.txt
pip install pytest pytest-cov
pytest backend/tests/ -v
pytest backend/tests/ --cov=backend --cov-report=html
```

---

## Security

Before committing:

- Never commit .env
- Store secrets in Azure Key Vault
- Restrict SQL firewall access
- Enforce HTTPS in production

Authentication is currently disabled for local development. Production recommendations:

- Azure AD integration
- API key management
- Rate limiting

---

## Responsible AI

AZCA follows 3 pillars of responsible AI:

1. Transparency and explainability:
   - Model cards and explicit limitations
   - Data provenance documentation
   - Confidence breakdowns
2. Privacy and security:
   - No personal data
   - GDPR-aligned data handling
   - Encrypted data in transit and at rest
3. Human control:
   - User feedback options
   - AI suggestions can be rejected
   - Human decisions remain final

See [docs/guides/IA_RESPONSABLE_QUICKSTART.md](docs/guides/IA_RESPONSABLE_QUICKSTART.md) for implementation details.

---

## Troubleshooting

| Issue | Solution |
| --- | --- |
| ModuleNotFoundError: pyodbc | Run pip install pyodbc |
| Port 8000 in use | Run netstat -ano | findstr :8000 |
| SQL connection fails | Verify .env values and firewall rules |
| Frontend cannot reach backend | Check Vite proxy in frontend/vite.config.js |
| Model file not found | Verify backend/azca/artifacts/MLmodel exists |

---

## Roadmap

- User authentication (Azure AD)
- Advanced analytics dashboard
- Batch prediction workflows
- Model versioning and A/B testing
- Mobile app support
- Real-time demand monitoring
- POS integrations

---

## Contributing

1. Create branch: git checkout -b feature/my-feature
2. Add changes and run tests
3. Commit with clear message
4. Push branch
5. Open pull request

---

Status: Production ready
Last updated: March 23, 2026
