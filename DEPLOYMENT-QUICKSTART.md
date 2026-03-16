# 🎯 AZCA Deployment - Quick Start (5 minutos)

## 📋 Archivos Creados

| Archivo | Propósito |
|---------|-----------|
| **Dockerfile** | Imagen Docker multistage (frontend + backend) |
| **.dockerignore** | Excluir archivos innecesarios (~3GB menos) |
| **docker-compose.yml** | Test local antes de desplegar |
| **azure-deploy.sh** | Script automático: build → push → deploy |
| **nginx.conf** | Reverse proxy (opcional para producción) |
| **.github/workflows/deploy.yml** | CI/CD automático con GitHub Actions |
| **DOCKER-DEPLOY.md** | Guía completa de despliegue |

---

## 🚀 Opción 1: Despliegue Manual (5 minutos)

### Paso 1: Prerequisitos
```bash
# Instalar herramientas
# - Docker Desktop: https://www.docker.com/products/docker-desktop
# - Azure CLI: https://docs.microsoft.com/cli/azure/install-azure-cli

# Verificar
docker --version
az --version
```

### Paso 2: Crear recursos Azure (una sola vez)
```bash
# Login
az login

# Crear ACR (si no existe)
az acr create --resource-group azca-rg --name azcaregistry --sku Basic

# Crear App Service (si no existe)
az webapp create --resource-group azca-rg --plan azca-plan --name azca-api-app

echo "✅ Recursos creados"
```

### Paso 3: Build & Deploy (script automático ✅)
```bash
# Hacer el archivo ejecutable (solo una vez en Linux/Mac)
chmod +x azure-deploy.sh

# Ejecutar
./azure-deploy.sh azcaregistry azcaapi latest

# El script hace TODO:
# ✅ Valida Docker & Azure CLI
# ✅ Login en Azure ACR
# ✅ Build imagen
# ✅ Push a ACR
# ✅ Propone deploy a App Service
```

### Paso 4: Verificar despliegue
```bash
# Obtener URL
URL=$(az webapp show --name azca-api-app --resource-group azca-rg --query "defaultHostName" -o tsv)
echo "URL: https://$URL"

# Test
curl "https://$URL/health"
curl "https://$URL/restaurants"
```

---

## 🔄 Opción 2: CI/CD Automático con GitHub Actions (Recomendado ✅)

### Paso 1: Configurar secretos GitHub
```bash
# Ir a Settings → Secrets and variables → Actions

# Crear secretos necesarios:
# 1. AZURE_CREDENTIALS:
az ad sp create-for-rbac --role contributor --name azca-github --scopes /subscriptions/[SUB_ID]/resourceGroups/azca-rg

# 2. REGISTRY_USERNAME y REGISTRY_PASSWORD:
az acr credential show --name azcaregistry

# 3. DB_SERVER, DB_NAME, DB_USER, DB_PASS
#    (Usar valores de tu BD Azure SQL)
```

### Paso 2: Push a main
```bash
git add Dockerfile .dockerignore azure-deploy.sh DOCKER-DEPLOY.md
git commit -m "feat: add Docker deployment configuration"
git push origin main
```

### Paso 3: Workflow automático 🎉
```
GitHub Actions ejecutará automáticamente:
✅ Build imagen Docker
✅ Push a Azure Container Registry
✅ Deploy a Azure App Service
✅ Smoke tests
✅ Notificaciones Slack (opcional)
```

Ver progreso en: **Actions** tab en GitHub

---

## 🧪 Test Local (sin Azure)

```bash
# Preparar archivo .env local
cat > .env.docker << EOF
DB_SERVER=azcasqlserver.database.windows.net
DB_NAME=azca_db
DB_USER=azca
DB_PASS=your_password
EOF

# Build y ejecutar lokally
docker-compose up --build

# Test
curl http://localhost:8000/health
curl http://localhost:8000/restaurants

# Logs
docker-compose logs -f azca-api

# Detener
docker-compose down
```

---

## 📊 Monitoreo Post-Despliegue

```bash
# Ver logs en tiempo real
az webapp log tail --name azca-api-app --resource-group azca-rg

# Ver métricas
az monitor metrics list --resource-group azca-rg \
  --resource azca-api-app \
  --resource-type "Microsoft.Web/sites" \
  --metric "CpuPercentage" --interval PT1M

# Reiniciar si hay problemas
az webapp restart --name azca-api-app --resource-group azca-rg
```

---

## ⚠️ Checklist Pre-Despliegue

- [ ] `.env` **NO está en git** (.gitignore lo excluye)
- [ ] Credenciales BD en variables de entorno (no hardcoded)
- [ ] Imagen Docker construye sin errores
- [ ] Test local funciona (`docker-compose up`)
- [ ] ACR existe y puedo hacer login
- [ ] App Service existe en Azure
- [ ] Firewall BD permite trafico desde Azure

---

## 🆘 Troubleshooting Rápido

| Problema | Solución |
|----------|----------|
| `docker: command not found` | Instalar Docker Desktop |
| `az: command not found` | Instalar Azure CLI |
| `ImagePullError` | `az acr login -n azcaregistry` |
| `Connection timeout BD` | Verificar firewall IP |
| `502 Bad Gateway` | Ver logs: `az webapp log tail` |
| `Out of memory` | Aumentar App Service Plan |

---

## 📚 Documentación Completa

Para detalles exhaustivos, ver: **[DOCKER-DEPLOY.md](DOCKER-DEPLOY.md)**

---

## 🎬 Próximas Mejoras (Opcional)

- ✅ Autoscaling automático (Azure)
- ✅ CDN para assets frontend (Azure Front Door)
- ✅ Monitoreo con Application Insights
- ✅ A/B testing con Traffic Manager
- ✅ Backup automático de BD

---

**¡Listo para desplegar!** 🚀 Ejecuta `./azure-deploy.sh` para empezar.
