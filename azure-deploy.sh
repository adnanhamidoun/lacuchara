#!/bin/bash

# ============================================================================
# AZCA Prediction API - Azure Deployment Script
# Uso: ./azure-deploy.sh [acr-name] [image-name] [tag]
# Ejemplo: ./azure-deploy.sh azcaregistry azcaapi latest
# ============================================================================

set -e  # EXIT on any error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables
ACR_NAME="${1:-azcaregistry}"
IMAGE_NAME="${2:-azcaapi}"
IMAGE_TAG="${3:-latest}"
ACR_DOMAIN="${ACR_NAME}.azurecr.io"
IMAGE_FULL="${ACR_DOMAIN}/${IMAGE_NAME}:${IMAGE_TAG}"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        AZCA Prediction API - Docker Build & Deploy         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"

echo -e "${YELLOW}📋 Configuration:${NC}"
echo "   ACR Name: $ACR_NAME"
echo "   Image: $IMAGE_NAME:$IMAGE_TAG"
echo "   Full: $IMAGE_FULL"
echo ""

# ============================================================================
# Step 1: Validar Docker instalado
# ============================================================================
echo -e "${YELLOW}🔍 Step 1: Validar Docker...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker no está instalado${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker encontrado: $(docker --version)${NC}"
echo ""

# ============================================================================
# Step 2: Validar Azure CLI instalado
# ============================================================================
echo -e "${YELLOW}🔍 Step 2: Validar Azure CLI...${NC}"
if ! command -v az &> /dev/null; then
    echo -e "${RED}❌ Azure CLI no está instalado${NC}"
    echo -e "${YELLOW}   Instala desde: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Azure CLI encontrado: $(az --version | head -1)${NC}"
echo ""

# ============================================================================
# Step 3: Validar login en Azure
# ============================================================================
echo -e "${YELLOW}🔍 Step 3: Validar login en Azure...${NC}"
if ! az account show &> /dev/null; then
    echo -e "${YELLOW}⏳ Iniciando login en Azure...${NC}"
    az login
fi
ACCOUNT_NAME=$(az account show --query "user.name" -o tsv)
SUBSCRIPTION=$(az account show --query "name" -o tsv)
echo -e "${GREEN}✅ Conectado como: $ACCOUNT_NAME${NC}"
echo "   Suscripción: $SUBSCRIPTION"
echo ""

# ============================================================================
# Step 4: Validar ACR existe
# ============================================================================
echo -e "${YELLOW}🔍 Step 4: Validar Azure Container Registry...${NC}"
if ! az acr show -n "$ACR_NAME" &> /dev/null; then
    echo -e "${YELLOW}⚠️  ACR '$ACR_NAME' no existe. ¿Quieres crearlo?${NC}"
    echo "   Ejecuta: az acr create --resource-group [rg] --name $ACR_NAME --sku Basic"
    exit 1
fi
echo -e "${GREEN}✅ ACR encontrado: $ACR_NAME${NC}"
echo ""

# ============================================================================
# Step 5: Login en ACR
# ============================================================================
echo -e "${YELLOW}🔍 Step 5: Autenticarse en ACR...${NC}"
az acr login -n "$ACR_NAME"
echo -e "${GREEN}✅ Login en ACR exitoso${NC}"
echo ""

# ============================================================================
# Step 6: Build imagen Docker
# ============================================================================
echo -e "${YELLOW}🏗️  Step 6: Construyendo imagen Docker...${NC}"
echo "   Comando: docker build -t $IMAGE_FULL ."
docker build \
    --tag "$IMAGE_FULL" \
    --tag "${ACR_DOMAIN}/${IMAGE_NAME}:latest" \
    --build-arg BUILD_DATE="$(date -u +'%Y-%m-%dT%H:%M:%SZ')" \
    --build-arg VCS_REF="$(git rev-parse --short HEAD)" \
    .

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build completado${NC}"
    docker images | grep "$IMAGE_NAME" | head -2
else
    echo -e "${RED}❌ Error durante el build${NC}"
    exit 1
fi
echo ""

# ============================================================================
# Step 7: Push a ACR
# ============================================================================
echo -e "${YELLOW}📤 Step 7: Subiendo imagen a ACR...${NC}"
echo "   Comando: docker push $IMAGE_FULL"
docker push "$IMAGE_FULL"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Push completado${NC}"
else
    echo -e "${RED}❌ Error durante el push${NC}"
    exit 1
fi
echo ""

# ============================================================================
# Step 8: Verificar imagen en ACR
# ============================================================================
echo -e "${YELLOW}✨ Step 8: Verificando imagen en ACR...${NC}"
az acr repository show \
    --name "$ACR_NAME" \
    --image "${IMAGE_NAME}:${IMAGE_TAG}" \
    --output table

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     ✅ Build y Push completados exitosamente              ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"

echo ""
echo -e "${BLUE}📝 Próximos pasos:${NC}"
echo ""
echo "1️⃣  Deploy a Azure App Service:"
echo "   az webapp create --resource-group [rg] --plan [plan] --name [app-name] --deployment-container-image-name $IMAGE_FULL"
echo ""
echo "2️⃣  O actualizar una App Service existente:"
echo "   az webapp config container set --name [app-name] --resource-group [rg] --docker-custom-image-name $IMAGE_FULL --docker-registry-server-url https://${ACR_DOMAIN} --docker-registry-server-user [username] --docker-registry-server-password [password]"
echo ""
echo "3️⃣  Ver logs:"
echo "   az webapp log tail --name [app-name] --resource-group [rg]"
echo ""

# ============================================================================
# Step 9 (Opcional): Deploy automático
# ============================================================================
read -p "¿Quieres desplegar a una App Service? (s/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    read -p "Nombre del App Service: " APP_NAME
    read -p "Nombre del Resource Group: " RG_NAME
    
    echo -e "${YELLOW}⏳ Desplegando a $APP_NAME...${NC}"
    
    # Obtener credenciales ACR
    REGISTRY_USER=$(az acr credential show --name "$ACR_NAME" --query "username" -o tsv)
    REGISTRY_PASS=$(az acr credential show --name "$ACR_NAME" --query "passwords[0].value" -o tsv)
    
    az webapp config container set \
        --name "$APP_NAME" \
        --resource-group "$RG_NAME" \
        --docker-custom-image-name "$IMAGE_FULL" \
        --docker-registry-server-url "https://${ACR_DOMAIN}" \
        --docker-registry-server-user "$REGISTRY_USER" \
        --docker-registry-server-password "$REGISTRY_PASS"
    
    echo -e "${GREEN}✅ Despliegue completado${NC}"
fi
