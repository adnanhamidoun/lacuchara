# Setup Guide

## Prerequisites

- Python 3.10+
- Node.js 18+
- SQL Server ODBC Driver 17 or 18
- Access to Azure SQL (or local fallback config for development)

## Backend

```powershell
# from repository root
.\venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt
uvicorn backend.api.main:app --reload
```

Backend URL: `http://127.0.0.1:8000`

## Frontend

```powershell
cd frontend
npm install
npm run dev
```

Frontend URL: `http://localhost:5173`

## Environment

Create `.env` in the repository root using `.env.example` as reference.

Required DB variables:

- `DB_SERVER`
- `DB_NAME`
- `DB_USER`
- `DB_PASS`

## Quick Health Check

```powershell
curl http://127.0.0.1:8000/health
```

Expected response includes `status: healthy`.
