# Deployment Guide

## Environments

- Development: local backend + local frontend
- Production: backend service + built frontend artifacts + Azure SQL

## Backend Deployment Options

- Azure App Service
- Containerized deployment (Docker)
- VM-based deployment with process manager

## Frontend Deployment

Build static assets from `frontend/` and deploy to static hosting.

```powershell
cd frontend
npm run build
```

## Configuration Checklist

- Set required `.env` variables in target environment.
- Use ODBC Driver 17/18 for SQL Server.
- Configure CORS allowed origins for frontend domain.
- Enable HTTPS and secure secret storage.

## Monitoring

- Collect backend logs and API error rates.
- Monitor DB connectivity and latency.
- Track model/prediction endpoint health via `/health` and synthetic checks.

## Security

- Never commit secrets.
- Rotate credentials periodically.
- Restrict DB network access with firewall rules.
