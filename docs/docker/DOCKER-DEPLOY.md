# 🚀 AZCA Prediction API - Guía de Despliegue a Azure

## Índice
1. [Requisitos Previos](#requisitos-previos)
2. [Build Local con Docker](#build-local-con-docker)
3. [Despliegue a Azure Container Registry](#despliegue-a-azure-container-registry)
4. [Despliegue a Azure App Service](#despliegue-a-azure-app-service)
5. [Configuración de Variables de Entorno](#configuración-de-variables-de-entorno)
6. [Monitoreo y Troubleshooting](#monitoreo-y-troubleshooting)

---

## Requisitos Previos

### Software Necesario
```bash
# Docker
docker --version  # v20.10+

# Azure CLI
az --version     # v2.45+

# Git (ya tienes)
git --version
```

### Credenciales Azure
- ✅ Acceso a suscripción Azure
- ✅ Resource Group creado (ej: `azca-rg`)
- ✅ Azure Container Registry (ACR) creado (ej: `azcaregistry`)
- ✅ Azure App Service Plan (ej: `azca-plan`)

### Crear Recursos Azure (si no existen)
```bash
# Login
az login

# Crear Resource Group
az group create --name azca-rg --location eastus

# Crear Container Registry
az acr create --resource-group azca-rg --name azcaregistry --sku Basic

# Crear App Service Plan
az appservice plan create --name azca-plan --resource-group azca-rg --sku B2 --is-linux

# Crear App Service
az webapp create --resource-group azca-rg --plan azca-plan --name azca-api-app --deployment-container-image-name azcaregistry.azurecr.io/azcaapi:latest
```

---

## Build Local con Docker

### 1. Build de la Imagen
```bash
cd /path/to/Azca

# Build imagen
docker build -t azcaapi:latest .

# O con docker-compose
docker-compose build

# Verificar imagen creada
docker images | grep azcaapi
```

### 2. Test Local con Docker-Compose
```bash
# Crear archivo .env.local con credenciales BD
cat > .env.docker << EOF
DB_SERVER=azcasqlserver.database.windows.net
DB_NAME=azca_db
DB_USER=azca
DB_PASS=your_password_here
EOF

# Ejecutar stack
docker-compose up -d

# Ver logs
docker-compose logs -f azca-api

# Test endpoint
curl http://localhost:8000/health
curl http://localhost:8000/restaurants

# Detener
docker-compose down
```

### 3. Verificar Logs Locales
```bash
# Logs en tiempo real
docker logs -f $(docker ps -q -f "ancestor=azcaapi:latest")

# Entrar en el contenedor (debugging)
docker exec -it $(docker ps -q -f "ancestor=azcaapi:latest") /bin/bash
```

---

## Despliegue a Azure Container Registry

### Opción A: Script Automático (Recomendado ✅)
```bash
# Asegurar que el script es ejecutable
chmod +x scripts/deploy/azure-deploy.sh

# Ejecutar (con valores por defecto)
./scripts/deploy/azure-deploy.sh

# O con parámetros custom
./scripts/deploy/azure-deploy.sh azcaregistry azcaapi v1.0.0

# El script:
# 1. ✅ Valida Docker
# 2. ✅ Valida Azure CLI
# 3. ✅ Autentica en Azure
# 4. ✅ Valida ACR existe
# 5. ✅ Build imagen
# 6. ✅ Push a ACR
# 7. ✅ Muestra instrucciones deploy
```

### Opción B: Manual Paso a Paso
```bash
# 1. Login en Azure
az login

# 2. Login en ACR
az acr login --name azcaregistry

# 3. Build con tag ACR
docker build -t azcaregistry.azurecr.io/azcaapi:v1.0.0 .

# 4. Push a ACR
docker push azcaregistry.azurecr.io/azcaapi:v1.0.0

# 5. Verificar imagen en ACR
az acr repository list --name azcaregistry
az acr repository show --name azcaregistry --image azcaapi:v1.0.0
```

---

## Despliegue a Azure App Service

### Opción A: Desde Script scripts/deploy/azure-deploy.sh
El script automáticamente propone el deploy. Responde `s` cuando pregunte.

### Opción B: Manual
```bash
# 1. Obtener credenciales ACR
ACR_NAME="azcaregistry"
REGISTRY_USER=$(az acr credential show --name $ACR_NAME --query "username" -o tsv)
REGISTRY_PASS=$(az acr credential show --name $ACR_NAME --query "passwords[0].value" -o tsv)

# 2. Configurar container en App Service
az webapp config container set \
  --name azca-api-app \
  --resource-group azca-rg \
  --docker-custom-image-name azcaregistry.azurecr.io/azcaapi:v1.0.0 \
  --docker-registry-server-url https://azcaregistry.azurecr.io \
  --docker-registry-server-user $REGISTRY_USER \
  --docker-registry-server-password $REGISTRY_PASS

# 3. Reiniciar App Service
az webapp restart --name azca-api-app --resource-group azca-rg

# 4. Obtener URL
az webapp show --name azca-api-app --resource-group azca-rg --query "defaultHostName" -o tsv
```

### Verificar Despliegue
```bash
# Obtener URL de la aplicación
az webapp show --name azca-api-app --resource-group azca-rg --query "defaultHostName" -o tsv
# Resultado: azca-api-app.azurewebsites.net

# Test endpoint
curl https://azca-api-app.azurewebsites.net/health
curl https://azca-api-app.azurewebsites.net/restaurants
```

---

## Configuración de Variables de Entorno

### En Azure App Service
Las variables de entorno se configuran en **Application Settings**:

```bash
# Opción 1: Via portal Azure
# Settings → Configuration → Application settings

# Opción 2: Via Azure CLI
az webapp config appsettings set \
  --name azca-api-app \
  --resource-group azca-rg \
  --settings \
    DB_SERVER=azcasqlserver.database.windows.net \
    DB_NAME=azca_db \
    DB_USER=azca \
    DB_PASS="your_secure_password" \
    ENVIRONMENT=production \
    LOG_LEVEL=INFO

# Verificar
az webapp config appsettings list --name azca-api-app --resource-group azca-rg
```

### Usar Azure Key Vault (Recomendado para Secretos ✅)
```bash
# 1. Crear Key Vault
az keyvault create --name azca-kv --resource-group azca-rg

# 2. Guardar secretos
az keyvault secret set --vault-name azca-kv --name DB-PASS --value "secure_password"
az keyvault secret set --vault-name azca-kv --name DB-USER --value "azca"

# 3. Dar permisos a App Service
APP_ID=$(az webapp identity assign --name azca-api-app --resource-group azca-rg --query principalId -o tsv)
az keyvault set-policy --name azca-kv --object-id $APP_ID --secret-permissions get

# 4. Usar en Application Settings
# Formato: @Microsoft.KeyVault(SecretUri=https://azca-kv.vault.azure.net/secrets/SECRET_NAME/version)
az webapp config appsettings set \
  --name azca-api-app \
  --resource-group azca-rg \
  --settings DB_PASS="@Microsoft.KeyVault(SecretUri=https://azca-kv.vault.azure.net/secrets/DB-PASS/)"
```

---

## Monitoreo y Troubleshooting

### Ver Logs en Tiempo Real
```bash
# Logs en streaming
az webapp log tail --name azca-api-app --resource-group azca-rg

# Logs históricos
az webapp log download --name azca-api-app --resource-group azca-rg -d ./logs
```

### Health Check
```bash
# La imagen Docker incluye health check automático
# Verificar estado
az webapp show --name azca-api-app --resource-group azca-rg --query "state" -o tsv

# Si hay problemas, reiniciar
az webapp restart --name azca-api-app --resource-group azca-rg
```

### Debugging Remoto
```bash
# Acceder a SSH en el contenedor (si está disponible)
az webapp create-remote-connection --name azca-api-app --resource-group azca-rg

# O exec en contenedor
docker exec -it [container_id] /bin/bash
```

### Problemas Comunes

| Problema | Solución |
|----------|----------|
| `ImagePullError` | Verificar credenciales ACR con `az acr login` |
| `Connection timeout` | Verificar firewall BD permite trafico desde Azure IP |
| `OutOfMemory` | Aumentar App Service Plan (ej: B2 → B3) |
| `High latency` | Verificar región App Service = región BD |
| `Module not found` | Verificar requirements.txt está actualizado |

---

## Escala y Performance

### Escalado Automático
```bash
# Crear regla autoscale
az monitor autoscale create \
  --resource-group azca-rg \
  --resource azca-api-app \
  --resource-type "Microsoft.Web/sites" \
  --name azca-autoscale \
  --min-count 2 \
  --max-count 5 \
  --count 2

# Agregar regla (scale out si CPU > 70%)
az monitor autoscale rule create \
  --resource-group azca-rg \
  --autoscale-name azca-autoscale \
  --condition "Percentage CPU > 70 avg 5m" \
  --scale out 1
```

### Monitoreo de Métricas
```bash
# Ver métrica de CPU
az monitor metrics list-definitions \
  --resource-group azca-rg \
  --resource-id /subscriptions/xxx/resourceGroups/azca-rg/providers/Microsoft.Web/sites/azca-api-app

# Ver metrica actual
az monitor metrics list \
  --resource-group azca-rg \
  --resource azca-api-app \
  --resource-type "Microsoft.Web/sites" \
  --metric "CpuPercentage"
```

---

## Resumen de Comandos Útiles

```bash
# Build & Deploy (TODO)
./scripts/deploy/azure-deploy.sh azcaregistry azcaapi v1.0.0

# Ver estado
az webapp show --name azca-api-app --resource-group azca-rg

# Ver logs
az webapp log tail --name azca-api-app --resource-group azca-rg

# Reiniciar
az webapp restart --name azca-api-app --resource-group azca-rg

# Actualizar settings
az webapp config appsettings set --name azca-api-app --resource-group azca-rg --settings KEY=VALUE

# Eliminar recurso (si es necesario)
az webapp delete --name azca-api-app --resource-group azca-rg
```

---

## Notas Importantes

⚠️ **Seguridad:**
- ✅ Nunca commitear `.env` files
- ✅ Usar Azure Key Vault para secretos
- ✅ Imagen Docker corre como usuario no-root
- ✅ Configurar Network Security Groups

📊 **Performance:**
- ✅ Imagen ~4GB (AzureML + XGBoost son pesados)
- ✅ Cold start: ~40-60s (primera vez)
- ✅ Warm requests: <500ms (después cachés)
- ✅ Considerar scaling automático

🔄 **CI/CD (GitHub Actions recomendado):**
Crea `.github/workflows/deploy.yml` para automatizar build→push→deploy en cada push a main.

---

## Soporte

Para problemas:
1. Revisar logs con `az webapp log tail`
2. Verificar credenciales BD
3. Check firewall rules en BD
4. Verificar imagen existe en ACR




