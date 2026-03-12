# Deployment & Production Guide

## Pre-Deployment Checklist

- [ ] All unit tests passing
- [ ] Environment variables configured for production
- [ ] `.env` file NOT committed to Git
- [ ] Frontend built with `npm run build`
- [ ] Backend tested with `pytest`
- [ ] Database migrations complete
- [ ] SSL/TLS certificates ready
- [ ] Logging configured for production
- [ ] Error monitoring service set up

## Deployment Options

### Option 1: Azure App Service (Recommended)

#### Backend Deployment

```bash
# 1. Create App Service (if not exists)
az appservice plan create \
  --name azca-plan \
  --resource-group azca-rg \
  --sku B2

az webapp create \
  --resource-group azca-rg \
  --plan azca-plan \
  --name azca-api \
  --runtime "PYTHON|3.10" \
  --runtime-version 3.10

# 2. Deploy code
az webapp up --name azca-api --resource-group azca-rg

# 3. Configure environment variables
az webapp config appsettings set \
  --resource-group azca-rg \
  --name azca-api \
  --settings \
  DB_SERVER="azcaserver.database.windows.net" \
  DB_NAME="azcadb" \
  DB_USER="azca" \
  DB_PASS="<secure_password>" \
  ENVIRONMENT="production" \
  DEBUG="False"

# 4. Verify deployment
curl https://azca-api.azurewebsites.net/health
```

#### Frontend Deployment (Azure Static Web Apps)

```bash
# 1. Build frontend
cd frontend
npm run build

# 2. Deploy to Static Web Apps
az staticwebapp create \
  --name azca-ui \
  --source . \
  --location eastus \
  --branch main \
  --resource-group azca-rg

# 3. Configure API proxy (staticwebapp.config.json)
# See configuration section below

# 4. Verify
curl https://azca-ui.azurestaticapps.net
```

---

### Option 2: Docker Containerization

#### Backend Dockerfile

```dockerfile
FROM python:3.10-slim

WORKDIR /app

# Copy requirements and install
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY backend/ .

# Environment
ENV PYTHONUNBUFFERED=1
ENV ENVIRONMENT=production

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD python -c "import requests; requests.get('http://localhost:8000/health')"

# Run
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### Build & Push to Azure Container Registry

```bash
# 1. Build image
docker build -t azca-backend:latest -f Dockerfile.backend .

# 2. Login to ACR
az acr login --name azcaacr

# 3. Tag for registry
docker tag azca-backend:latest azcaacr.azurecr.io/azca-backend:latest

# 4. Push to ACR
docker push azcaacr.azurecr.io/azca-backend:latest

# 5. Deploy to Container Instances or Kubernetes
az container create \
  --resource-group azca-rg \
  --name azca-backend \
  --image azcaacr.azurecr.io/azca-backend:latest \
  --cpu 2 --memory 4 \
  --port 8000 \
  --environment-variables \
    DB_SERVER="azcaserver.database.windows.net" \
    ENVIRONMENT="production"
```

---

### Option 3: VM Deployment (Manual)

```bash
# 1. SSH into VM
ssh azureuser@<vm-ip>

# 2. Clone repository
git clone <repo-url>
cd azca

# 3. Setup Python environment
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt

# 4. Configure systemd service
sudo nano /etc/systemd/system/azca-backend.service
```

**Service file:**
```ini
[Unit]
Description=AZCA Backend API
After=network.target

[Service]
Type=notify
User=azureuser
WorkingDirectory=/home/azureuser/azca
Environment="PATH=/home/azureuser/azca/venv/bin"
Environment="DB_SERVER=azcaserver.database.windows.net"
ExecStart=/home/azureuser/azca/venv/bin/uvicorn \
  backend.api.main:app --host 0.0.0.0 --port 8000
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# 5. Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable azca-backend
sudo systemctl start azca-backend

# 6. Check status
sudo systemctl status azca-backend
```

---

## Configuration

### Azure Static Web Apps Config

**File:** `frontend/staticwebapp.config.json`

```json
{
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/api/*", "/assets/*"]
  },
  "staticContent": [
    {
      "path": "/assets",
      "headers": {
        "cache-control": "max-age=31536000"
      }
    }
  ],
  "routes": [
    {
      "route": "/api/*",
      "allowedRoles": ["authenticated"],
      "methods": ["GET", "POST", "PUT", "DELETE"]
    },
    {
      "route": "/*",
      "allowedRoles": ["anonymous"]
    }
  ],
  "auth": {
    "identityProviders": {
      "azureActiveDirectory": {
        "clientId": "<app-id>",
        "issuer": "https://login.microsoftonline.com/<tenant-id>/v2.0"
      }
    }
  },
  "apiLocation": "api"
}
```

---

## Security Best Practices

### 1. Secrets Management

**DO NOT** commit `.env` to Git. Use Azure Key Vault:

```bash
# Store secrets
az keyvault secret set \
  --vault-name azca-kv \
  --name DatabasePassword \
  --value "<secure_password>"

# Retrieve in application
from azure.identity import DefaultAzureCredential
from azure.keyvault.secrets import SecretClient

credential = DefaultAzureCredential()
client = SecretClient(vault_url="https://azca-kv.vault.azure.net/", credential=credential)
secret = client.get_secret("DatabasePassword").value
```

### 2. Network Security

- **Enable Just-In-Time (JIT) access** for database
- **Restrict SQL firewall** to App Service IP only
- **Use VPN** for sensitive operations
- **Enable SSL/TLS** for all connections

### 3. API Authentication

Add Azure AD authentication:

```python
from fastapi.security import HTTPBearer, HTTPAuthCredentials

security = HTTPBearer()

@app.post("/predict")
async def create_prediction(
    request: PredictionRequest,
    credentials: HTTPAuthCredentials = Depends(security)
):
    # Verify token
    token = credentials.credentials
    # Validate with Azure AD...
    pass
```

### 4. Rate Limiting

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.post("/predict")
@limiter.limit("100/minute")
async def create_prediction(request: PredictionRequest):
    pass
```

### 5. Input Validation

Pydantic already validates on POST, but add:

```python
from pydantic import BaseModel, Field, validator

class PredictionRequest(BaseModel):
    service_date: date = Field(..., ge=date.today() - timedelta(days=1))
    restaurant_id: int = Field(..., ge=1, le=1000)
    capacity_limit: int = Field(..., ge=10, le=10000)
    
    @validator('service_date')
    def validate_date_range(cls, v):
        if v > date.today() + timedelta(days=365):
            raise ValueError("Cannot predict beyond 1 year")
        return v
```

---

## Monitoring & Logging

### Azure Monitor Integration

```python
import logging
from opencensus.ext.azure.log_exporter import AzureLogHandler

logger = logging.getLogger(__name__)
logger.addHandler(AzureLogHandler(
    connection_string='InstrumentationKey=<your-key>'
))

logger.warning("Prediction failure for restaurant 5", extra={
    "restaurant_id": 5,
    "service_date": "2026-03-15"
})
```

### Key Metrics to Monitor

| Metric | Threshold | Action |
|--------|-----------|--------|
| API latency | >2s | Investigate slow queries/API calls |
| Error rate | >1% | Check logs, restart if needed |
| DB connection pool | >90% | Scale up database |
| Memory usage | >80% | Reduce model size or add cache |
| Model prediction time | >500ms | Quantize/optimize model |

### Log Aggregation

Use **Application Insights**:

```python
# Automatic correlation IDs
from opencensus.trace import config_integration
config_integration.trace_integrations(['logging'])

# Structured logging
logger.info("Prediction successful", extra={
    "prediction_result": 87,
    "execution_time_ms": 450,
    "data_sources_hit": ["sql", "weather_api"]
})
```

---

## Scaling Strategy

### Vertical Scaling (Easier)
- Increase App Service tier (B2 → P1V2)
- More CPU/RAM for single instance

### Horizontal Scaling (Better)
- Multiple App Service instances behind load balancer
- Azure Front Door for global distribution
- Connection pooling for database

```python
# SQLAlchemy connection pool
engine = create_engine(
    connection_string,
    pool_size=20,
    max_overflow=40,
    pool_pre_ping=True
)
```

### Caching Strategy

```python
from redis import Redis
import json

redis_client = Redis(host='azca-redis.redis.cache.windows.net')

@app.get("/restaurants")
async def get_restaurants(db: Session = Depends(get_db)):
    # Check cache first
    cached = redis_client.get("restaurants_list")
    if cached:
        return json.loads(cached)
    
    # Fetch from DB
    restaurants = db.query(Restaurant).all()
    
    # Cache for 24 hours
    redis_client.setex(
        "restaurants_list",
        86400,
        json.dumps([...])
    )
    return restaurants
```

---

## Rollback Strategy

```bash
# If deployment fails, rollback to previous version
az webapp deployment slot swap \
  --resource-group azca-rg \
  --name azca-api \
  --slot staging

# Or manual rollback
git revert <commit-hash>
git push
# Wait for CI/CD to redeploy...
```

---

## Post-Deployment Testing

```bash
# 1. Health check
curl https://azca-api.azurewebsites.net/health

# 2. Restaurant list
curl https://azca-api.azurewebsites.net/restaurants

# 3. Sample prediction
curl -X POST https://azca-api.azurewebsites.net/predict \
  -H "Content-Type: application/json" \
  -d '{
    "service_date": "2026-03-15",
    "restaurant_id": 1,
    ...
  }'

# 4. Load test (optional)
ab -n 1000 -c 10 https://azca-api.azurewebsites.net/health
```

---

## Troubleshooting Production Issues

| Symptom | Cause | Solution |
|---------|-------|----------|
| 502 Bad Gateway | Backend crashed | Check logs, restart container |
| 504 Gateway Timeout | Slow database | Check SQL performance, add index |
| "Motor not initialized" | XGBoost model missing | Verify artifacts uploaded |
| Open-Meteo errors | API rate limit | Cache weather data, retry logic |
| Memory leak | Session not closed | Check DB session cleanup in finally blocks |

---

## Disaster Recovery

### Backup Strategy
```bash
# Daily database backup
az sql db backup \
  --server azcaserver \
  --database azcadb

# Keep 90 days of backups
az sql db backup retention \
  --server azcaserver \
  --database azcadb \
  --retention-days 90
```

### Recovery Procedure
```bash
# Restore from backup if needed
az sql db restore \
  --server azcaserver-recovery \
  --database azcadb-restored \
  --backup-id <backup-id>
```

---

## Cost Optimization

- **Use reserved instances** for predictable workload
- **Auto-scale** based on demand (scale down at night)
- **Spot VMs** for non-critical environments
- **Schedule data cleanup** (old prediction logs after 1 year)

```python
# Archive old logs
db.query(PredictionLog).filter(
    PredictionLog.execution_timestamp < datetime.now() - timedelta(days=365)
).delete()
db.commit()
```

---

## Support & Emergency Contact

- **On-call:** PagerDuty integration
- **Incident channel:** #azca-incidents Slack
- **Escalation:** Data Science team lead
