#!/bin/bash

# Populate all environment configuration files with actual Azure credentials
# This script retrieves credentials for dev, test, and prod environments
# Run this after: az login

set -e

BASE_NAME="Ab07"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}=== Populating Environment Configurations ===${NC}"
echo ""

# Check if logged in
if ! az account show &> /dev/null; then
    echo -e "${RED}Error: Not logged in to Azure.${NC}"
    echo "Please run: az login"
    exit 1
fi

# Function to get credentials for an environment
get_env_credentials() {
    local ENV=$1
    local RESOURCE_GROUP="deviceloan-${ENV}-${BASE_NAME}-rg"
    
    echo -e "${YELLOW}Retrieving credentials for ${ENV} environment...${NC}"
    echo -e "${YELLOW}Resource Group: ${RESOURCE_GROUP}${NC}"
    
    # Check if resource group exists
    if ! az group show --name "$RESOURCE_GROUP" &> /dev/null; then
        echo -e "${RED}  ✗ Resource group not found: ${RESOURCE_GROUP}${NC}"
        echo -e "${RED}    Please deploy first: ./Deployment/deploy.sh ${ENV}${NC}"
        return 1
    fi
    
    # Resource names
    local COSMOS_ACCOUNT="cosmos-deviceloan-${ENV}-${BASE_NAME}"
    local STORAGE_ACCOUNT="stdevloan${ENV}${BASE_NAME}"
    local FUNCTION_APP="func-deviceloan-${ENV}-${BASE_NAME}"
    local APP_INSIGHTS="appi-deviceloan-${ENV}-${BASE_NAME}"
    
    # Get Cosmos DB details
    local COSMOS_ENDPOINT=$(az cosmosdb show \
        --name "$COSMOS_ACCOUNT" \
        --resource-group "$RESOURCE_GROUP" \
        --query documentEndpoint -o tsv 2>/dev/null || echo "")
    
    local COSMOS_KEY=$(az cosmosdb keys list \
        --name "$COSMOS_ACCOUNT" \
        --resource-group "$RESOURCE_GROUP" \
        --query primaryMasterKey -o tsv 2>/dev/null || echo "")
    
    # Get Storage Account connection string
    local STORAGE_CONNECTION=$(az storage account show-connection-string \
        --name "$STORAGE_ACCOUNT" \
        --resource-group "$RESOURCE_GROUP" \
        --query connectionString -o tsv 2>/dev/null || echo "")
    
    # Get Application Insights
    local APP_INSIGHTS_KEY=$(az monitor app-insights component show \
        --app "$APP_INSIGHTS" \
        --resource-group "$RESOURCE_GROUP" \
        --query instrumentationKey -o tsv 2>/dev/null || echo "")
    
    local APP_INSIGHTS_CONNECTION=$(az monitor app-insights component show \
        --app "$APP_INSIGHTS" \
        --resource-group "$RESOURCE_GROUP" \
        --query connectionString -o tsv 2>/dev/null || echo "")
    
    if [ -z "$COSMOS_ENDPOINT" ] || [ -z "$COSMOS_KEY" ]; then
        echo -e "${RED}  ✗ Failed to retrieve credentials for ${ENV}${NC}"
        return 1
    fi
    
    echo -e "${GREEN}  ✓ Retrieved credentials for ${ENV}${NC}"
    
    # Update .env file
    cat > ".env.${ENV}.local" << EOF
# ${ENV^^} Environment Variables - ACTUAL VALUES
# Auto-generated on $(date)
# DO NOT COMMIT THIS FILE

ENVIRONMENT=${ENV}

# Azure Function Settings
FUNCTIONS_WORKER_RUNTIME=node

# Storage Account
AZURE_STORAGE_CONNECTION_STRING=${STORAGE_CONNECTION}
AzureWebJobsStorage=${STORAGE_CONNECTION}

# Cosmos DB Settings
COSMOS_DB_ENDPOINT=${COSMOS_ENDPOINT}
COSMOS_DB_KEY=${COSMOS_KEY}
COSMOS_DB_DATABASE=DeviceLoanDB
COSMOS_DB_CONTAINER=Loans

# Application Insights
APPINSIGHTS_INSTRUMENTATIONKEY=${APP_INSIGHTS_KEY}
APPLICATIONINSIGHTS_CONNECTION_STRING=${APP_INSIGHTS_CONNECTION}

# Resource Names
FUNCTION_APP_NAME=${FUNCTION_APP}
COSMOS_ACCOUNT_NAME=${COSMOS_ACCOUNT}
STORAGE_ACCOUNT_NAME=${STORAGE_ACCOUNT}
RESOURCE_GROUP=${RESOURCE_GROUP}
EOF
    
    # Update local.settings file
    cat > "local.settings.${ENV}.local.json" << EOF
{
  "IsEncrypted": false,
  "Values": {
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "AzureWebJobsStorage": "${STORAGE_CONNECTION}",
    "COSMOS_DB_ENDPOINT": "${COSMOS_ENDPOINT}",
    "COSMOS_DB_KEY": "${COSMOS_KEY}",
    "COSMOS_DB_DATABASE": "DeviceLoanDB",
    "COSMOS_DB_CONTAINER": "Loans",
    "ENVIRONMENT": "${ENV}",
    "APPINSIGHTS_INSTRUMENTATIONKEY": "${APP_INSIGHTS_KEY}",
    "APPLICATIONINSIGHTS_CONNECTION_STRING": "${APP_INSIGHTS_CONNECTION}"
  },
  "ConnectionStrings": {}
}
EOF
    
    echo -e "${GREEN}  ✓ Created .env.${ENV}.local${NC}"
    echo -e "${GREEN}  ✓ Created local.settings.${ENV}.local.json${NC}"
    echo ""
}

# Process all environments
for ENV in dev test prod; do
    get_env_credentials "$ENV"
done

echo -e "${GREEN}=== Summary ===${NC}"
echo ""
echo "Created configuration files with actual credentials:"
echo "  📄 .env.dev.local"
echo "  📄 .env.test.local"
echo "  📄 .env.prod.local"
echo "  📄 local.settings.dev.local.json"
echo "  📄 local.settings.test.local.json"
echo "  📄 local.settings.prod.local.json"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: These files contain REAL SECRETS${NC}"
echo -e "${YELLOW}   They are automatically added to .gitignore${NC}"
echo ""
echo "To use an environment locally, run:"
echo "  ./switch-env.sh dev   # Switch to dev"
echo "  ./switch-env.sh test  # Switch to test"
echo "  ./switch-env.sh prod  # Switch to prod"
echo ""
echo -e "${GREEN}✓ All environment configurations populated successfully!${NC}"
