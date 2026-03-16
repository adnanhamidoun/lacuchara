# ============================================================================
# STAGE 1: Frontend Builder (Node.js)
# ============================================================================
FROM node:20-alpine AS frontend-builder

WORKDIR /build/frontend

# Copiar archivos de configuración frontend
COPY frontend/package*.json ./
COPY frontend/vite.config.js ./
COPY frontend/tailwind.config.js ./
COPY frontend/postcss.config.js ./
COPY frontend/eslint.config.js ./
COPY frontend/index.html ./

# Copiar código fuente
COPY frontend/src ./src
COPY frontend/public ./public

# Instalar dependencias y hacer build
RUN npm ci && npm run build

# ============================================================================
# STAGE 2: Python Backend + Frontend Assets (Final Image)
# ============================================================================
FROM python:3.10.11-slim

# Metadatos
LABEL maintainer="AZCA Team <dev@azca.com>"
LABEL description="AZCA Prediction API - Menu & Service Demand Forecasting"

# Variables de entorno
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PYTHONPATH=/app \
    APP_ENV=production

# Instalar dependencias del sistema (para SQL Server ODBC)
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    libffi-dev \
    libssl-dev \
    unixodbc \
    unixodbc-dev \
    apt-transport-https \
    gnupg2 \
    && curl -s https://packages.microsoft.com/keys/microsoft.asc | apt-key add - \
    && curl -s https://packages.microsoft.com/config/debian/11/prod.list > /etc/apt/sources.list.d/mssql-release.list \
    && apt-get update \
    && ACCEPT_EULA=Y apt-get install -y --no-install-recommends msodbcsql17 \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Crear usuario no-root para seguridad
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Establecer directorio de trabajo
WORKDIR /app

# ============================================================================
# Copiar código backend y dependencias (optimizado para Docker)
# ============================================================================
COPY backend/ ./backend/
COPY requirements-docker.txt ./requirements.txt

# ============================================================================
# Copiar assets frontend compilados a backend/api/static
# ============================================================================
COPY --from=frontend-builder /build/frontend/dist ./backend/api/static

# ============================================================================
# Instalar dependencias Python (optimizadas)
# ============================================================================
RUN pip install --no-cache-dir --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -r requirements.txt

# ============================================================================
# Cambiar permisos a usuario no-root
# ============================================================================
RUN chown -R appuser:appuser /app

USER appuser

# ============================================================================
# Health Check
# ============================================================================
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# ============================================================================
# Exposición de puertos
# ============================================================================
EXPOSE 8000

# ============================================================================
# Comando de inicio
# ============================================================================
CMD ["uvicorn", "backend.api.main:app", \
     "--host", "0.0.0.0", \
     "--port", "8000", \
     "--workers", "4"]
