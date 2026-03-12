# Setup & Installation Guide

## Prerequisites

- **Python 3.10+** (tested on 3.10.11)
- **Node.js 18+** (for frontend)
- **Git**
- **Azure SQL Database** credentials (for production)
- **pip** (Python package manager)

## Environment Setup

### 1. Clone & Navigate

```powershell
git clone <repo-url>
cd Azca
```

### 2. Backend Setup

#### Create Virtual Environment

```powershell
# Create venv
python -m venv venv

# Activate
.\venv\Scripts\Activate.ps1
```

#### Install Python Dependencies

```powershell
# Install from requirements.txt
pip install -r backend/requirements.txt
```

#### Configure Environment Variables

Create `.env` in the root:

```env
# Azure SQL Configuration
DB_SERVER=azcaserver.database.windows.net
DB_NAME=azcadb
DB_USER=azca
DB_PASS=YourPassword

# Environment
ENVIRONMENT=development
DEBUG=False
```

#### Run Backend Server

```powershell
cd backend
uvicorn api.main:app --reload
```

Server runs at: `http://127.0.0.1:8000`

### 3. Frontend Setup

#### Install Dependencies

```powershell
cd frontend
npm install
```

#### Run Development Server

```powershell
npm run dev
```

Frontend runs at: `http://localhost:5173`

## Verification

### Backend Health Check

```powershell
curl http://127.0.0.1:8000/health
```

Expected response:

```json
{
  "status": "healthy",
  "environment": "development"
}
```

### Frontend Load

Navigate to `http://localhost:5173` - should see restaurant selector dropdown.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| **Port 8000 already in use** | `lsof -i :8000` then kill process or use `--port 8001` |
| **ModuleNotFoundError: pyodbc** | `pip install pyodbc` |
| **Azure SQL connection fails** | Check credentials in `.env` and network access |
| **Node modules conflict** | `rm -r node_modules package-lock.json && npm install` |
| **Vite proxy not working** | Ensure backend is running on 127.0.0.1:8000 |

## Database Schema

The system expects these Azure SQL tables:

- **dim_restaurants**: Restaurant master data (20 records)
- **fact_services**: Historical services data with date_id, lag_7, avg_4_weeks
- **PredictionLogs**: Audit table for all predictions

Contact DevOps for schema initialization if needed.

## File Structure

```
Azca/
├── backend/
│   ├── api/main.py           # FastAPI server (endpoints, orchestration)
│   ├── db/models.py          # SQLAlchemy ORM models
│   ├── db/database.py        # DB connection & session factory
│   ├── core/engine.py        # XGBoost prediction engine
│   └── requirements.txt       # Python dependencies
├── frontend/
│   ├── src/App.jsx           # Main React component
│   ├── index.html            # HTML entry point
│   ├── package.json          # Node dependencies
│   └── vite.config.js        # Vite proxy config
├── docs/
│   ├── SETUP.md              # This file
│   ├── API.md                # Endpoint documentation
│   ├── ARCHITECTURE.md       # System design
│   └── DEPLOYMENT.md         # Production deployment
├── .env                      # Environment variables (NEVER commit)
└── README.md                 # Project overview
```
