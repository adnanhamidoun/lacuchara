#!/bin/bash

# ============================================================================
# AZCA Prediction API - Azure Deployment Script
# Usage: ./scripts/deploy/azure-deploy.sh [acr-name] [image-name] [tag]
# Example: ./scripts/deploy/azure-deploy.sh azcaregistry azcaapi latest
# ============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
cd "$PROJECT_ROOT"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ACR_NAME="${1:-azcaregistry}"
IMAGE_NAME="${2:-azcaapi}"
IMAGE_TAG="${3:-latest}"
ACR_DOMAIN="${ACR_NAME}.azurecr.io"
IMAGE_FULL="${ACR_DOMAIN}/${IMAGE_NAME}:${IMAGE_TAG}"

echo -e "${BLUE}============================================================${NC}"
echo -e "${BLUE}      AZCA Prediction API - Docker Build and Deploy         ${NC}"
echo -e "${BLUE}============================================================${NC}"

echo -e "${YELLOW}Configuration:${NC}"
echo "  ACR Name: $ACR_NAME"
echo "  Image: $IMAGE_NAME:$IMAGE_TAG"
echo "  Full: $IMAGE_FULL"
echo

echo -e "${YELLOW}Step 1: Validate Docker...${NC}"
if ! command -v docker &> /dev/null; then
  echo -e "${RED}Docker is not installed${NC}"
  exit 1
fi
echo -e "${GREEN}Docker found: $(docker --version)${NC}"
echo

echo -e "${YELLOW}Step 2: Validate Azure CLI...${NC}"
if ! command -v az &> /dev/null; then
  echo -e "${RED}Azure CLI is not installed${NC}"
  echo -e "${YELLOW}Install from: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli${NC}"
  exit 1
fi
echo -e "${GREEN}Azure CLI found: $(az --version | head -1)${NC}"
echo

echo -e "${YELLOW}Step 3: Validate Azure login...${NC}"
if ! az account show &> /dev/null; then
  echo -e "${YELLOW}Starting Azure login...${NC}"
  az login
fi
ACCOUNT_NAME=$(az account show --query "user.name" -o tsv)
SUBSCRIPTION=$(az account show --query "name" -o tsv)
echo -e "${GREEN}Connected as: $ACCOUNT_NAME${NC}"
echo "  Subscription: $SUBSCRIPTION"
echo

echo -e "${YELLOW}Step 4: Validate Azure Container Registry...${NC}"
if ! az acr show -n "$ACR_NAME" &> /dev/null; then
  echo -e "${YELLOW}ACR '$ACR_NAME' does not exist.${NC}"
  echo "  Run: az acr create --resource-group [rg] --name $ACR_NAME --sku Basic"
  exit 1
fi
echo -e "${GREEN}ACR found: $ACR_NAME${NC}"
echo

echo -e "${YELLOW}Step 5: Authenticate to ACR...${NC}"
az acr login -n "$ACR_NAME"
echo -e "${GREEN}ACR login completed${NC}"
echo

echo -e "${YELLOW}Step 6: Build Docker image...${NC}"
echo "  Command: docker build -t $IMAGE_FULL ."
docker build \
  --tag "$IMAGE_FULL" \
  --tag "${ACR_DOMAIN}/${IMAGE_NAME}:latest" \
  --build-arg BUILD_DATE="$(date -u +'%Y-%m-%dT%H:%M:%SZ')" \
  --build-arg VCS_REF="$(git rev-parse --short HEAD)" \
  .

echo -e "${GREEN}Build completed${NC}"
docker images | grep "$IMAGE_NAME" | head -2
echo

echo -e "${YELLOW}Step 7: Push image to ACR...${NC}"
echo "  Command: docker push $IMAGE_FULL"
docker push "$IMAGE_FULL"
echo -e "${GREEN}Push completed${NC}"
echo

echo -e "${YELLOW}Step 8: Verify image in ACR...${NC}"
az acr repository show \
  --name "$ACR_NAME" \
  --image "${IMAGE_NAME}:${IMAGE_TAG}" \
  --output table

echo
echo -e "${GREEN}============================================================${NC}"
echo -e "${GREEN}      Build and push completed successfully                 ${NC}"
echo -e "${GREEN}============================================================${NC}"

echo
echo -e "${BLUE}Next steps:${NC}"
echo
echo "1) Deploy to Azure App Service:"
echo "   az webapp create --resource-group [rg] --plan [plan] --name [app-name] --deployment-container-image-name $IMAGE_FULL"
echo
echo "2) Update an existing App Service:"
echo "   az webapp config container set --name [app-name] --resource-group [rg] --docker-custom-image-name $IMAGE_FULL --docker-registry-server-url https://${ACR_DOMAIN} --docker-registry-server-user [username] --docker-registry-server-password [password]"
echo
echo "3) Tail logs:"
echo "   az webapp log tail --name [app-name] --resource-group [rg]"
echo

read -p "Do you want to deploy to an App Service now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  read -p "App Service name: " APP_NAME
  read -p "Resource Group name: " RG_NAME

  echo -e "${YELLOW}Deploying to $APP_NAME...${NC}"

  REGISTRY_USER=$(az acr credential show --name "$ACR_NAME" --query "username" -o tsv)
  REGISTRY_PASS=$(az acr credential show --name "$ACR_NAME" --query "passwords[0].value" -o tsv)

  az webapp config container set \
    --name "$APP_NAME" \
    --resource-group "$RG_NAME" \
    --docker-custom-image-name "$IMAGE_FULL" \
    --docker-registry-server-url "https://${ACR_DOMAIN}" \
    --docker-registry-server-user "$REGISTRY_USER" \
    --docker-registry-server-password "$REGISTRY_PASS"

  echo -e "${GREEN}Deployment completed${NC}"
fi
