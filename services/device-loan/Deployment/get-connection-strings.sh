#!/bin/bash

# Get connection strings and keys for a specific environment
# Usage: ./get-connection-strings.sh <environment>
# Example: ./get-connection-strings.sh dev

set -e

ENVIRONMENT=$1
RESOURCE_GROUP="rg-loan-device-Ab07"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

if [ -z "$ENVIRONMENT" ]; then
    echo "Usage: $0 <environment>"
    echo "Example: $0 dev"
    echo "Valid environments: dev, test, prod"
    exit 1
fi

if [[ ! "$ENVIRONMENT" =~ ^(dev|test|prod)$ ]]; then
    echo "Invalid environment: $ENVIRONMENT"
    exit 1
fi

# Resource names
COSMOS_ACCOUNT="cosmos-loan-device-ab07-${ENVIRONMENT}"
STORAGE_ACCOUNT="stloandeviceab07${ENVIRONMENT}"
FUNCTION_APP="func-loan-device-Ab07-${ENVIRONMENT}"
APP_INSIGHTS="appi-loan-device-Ab07-${ENVIRONMENT}"

echo -e "${GREEN}Retrieving connection strings for ${ENVIRONMENT} environment...${NC}"
echo ""

# Check if logged in
if ! az account show &> /dev/null; then
    echo "Error: Not logged in to Azure. Please run 'az login' first."
    exit 1
fi

# Get Cosmos DB details
echo -e "${YELLOW}Cosmos DB:${NC}"
COSMOS_ENDPOINT=$(az cosmosdb show \
    --name "$COSMOS_ACCOUNT" \
    --resource-group "$RESOURCE_GROUP" \
    --query documentEndpoint -o tsv 2>/dev/null || echo "Not found")

COSMOS_KEY=$(az cosmosdb keys list \
    --name "$COSMOS_ACCOUNT" \
    --resource-group "$RESOURCE_GROUP" \
    --query primaryMasterKey -o tsv 2>/dev/null || echo "Not found")

echo "  Endpoint: $COSMOS_ENDPOINT"
echo "  Key: $COSMOS_KEY"
echo ""

# Get Storage Account connection string
echo -e "${YELLOW}Storage Account:${NC}"
STORAGE_CONNECTION=$(az storage account show-connection-string \
    --name "$STORAGE_ACCOUNT" \
    --resource-group "$RESOURCE_GROUP" \
    --query connectionString -o tsv 2>/dev/null || echo "Not found")

echo "  Connection String: $STORAGE_CONNECTION"
echo ""

# Get Application Insights
echo -e "${YELLOW}Application Insights:${NC}"
APP_INSIGHTS_KEY=$(az monitor app-insights component show \
    --app "$APP_INSIGHTS" \
    --resource-group "$RESOURCE_GROUP" \
    --query instrumentationKey -o tsv 2>/dev/null || echo "Not found")

APP_INSIGHTS_CONNECTION=$(az monitor app-insights component show \
    --app "$APP_INSIGHTS" \
    --resource-group "$RESOURCE_GROUP" \
    --query connectionString -o tsv 2>/dev/null || echo "Not found")

echo "  Instrumentation Key: $APP_INSIGHTS_KEY"
echo "  Connection String: $APP_INSIGHTS_CONNECTION"
echo ""

# Generate .env file content
echo -e "${GREEN}Creating .env.${ENVIRONMENT}.local file with actual values...${NC}"

cat > "../.env.${ENVIRONMENT}.local" << EOF
# ${ENVIRONMENT^^} Environment Variables - ACTUAL VALUES
# Generated on $(date)
ENVIRONMENT=${ENVIRONMENT}

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

# Generate local.settings file
cat > "../local.settings.${ENVIRONMENT}.local.json" << EOF
{
  "IsEncrypted": false,
  "Values": {
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "AzureWebJobsStorage": "${STORAGE_CONNECTION}",
    "COSMOS_DB_ENDPOINT": "${COSMOS_ENDPOINT}",
    "COSMOS_DB_KEY": "${COSMOS_KEY}",
    "COSMOS_DB_DATABASE": "DeviceLoanDB",
    "COSMOS_DB_CONTAINER": "Loans",
    "ENVIRONMENT": "${ENVIRONMENT}",
    "APPINSIGHTS_INSTRUMENTATIONKEY": "${APP_INSIGHTS_KEY}",
    "APPLICATIONINSIGHTS_CONNECTION_STRING": "${APP_INSIGHTS_CONNECTION}"
  },
  "ConnectionStrings": {}
}
EOF

echo ""
echo -e "${GREEN}✓ Files created:${NC}"
echo "  .env.${ENVIRONMENT}.local"
echo "  local.settings.${ENVIRONMENT}.local.json"
echo ""
echo -e "${YELLOW}Note: These files contain actual secrets and should NOT be committed to git${NC}"
