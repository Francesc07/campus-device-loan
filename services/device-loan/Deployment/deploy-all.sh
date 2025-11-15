#!/bin/bash

# Deploy all environments for Campus Device Loan Service
# Resource Groups: deviceloan-dev-Ab07-rg, deviceloan-test-Ab07-rg, deviceloan-prod-Ab07-rg
# Location: UK South
# Environments: dev, test, prod

set -e

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

# Variables
BASE_NAME="Ab07"
LOCATION="uksouth"
SUBSCRIPTION_ID=""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    print_error "Azure CLI is not installed. Please install it first."
    exit 1
fi

# Check if logged in to Azure
if ! az account show &> /dev/null; then
    print_error "Not logged in to Azure. Please run 'az login' first."
    exit 1
fi

# Get current subscription
CURRENT_SUB=$(az account show --query id -o tsv)
print_info "Current subscription: $CURRENT_SUB"

# Allow user to specify a different subscription
if [ -n "$SUBSCRIPTION_ID" ]; then
    print_info "Setting subscription to: $SUBSCRIPTION_ID"
    az account set --subscription "$SUBSCRIPTION_ID"
fi

# Deploy each environment
ENVIRONMENTS=("dev" "test" "prod")

for ENV in "${ENVIRONMENTS[@]}"; do
    RESOURCE_GROUP="deviceloan-${ENV}-${BASE_NAME}-rg"
    
    print_info "========================================="
    print_info "Deploying $ENV environment"
    print_info "Resource Group: $RESOURCE_GROUP"
    print_info "========================================="
    
    # Create resource group if it doesn't exist
    print_info "Checking resource group: $RESOURCE_GROUP"
    if ! az group show --name "$RESOURCE_GROUP" &> /dev/null; then
        print_info "Creating resource group: $RESOURCE_GROUP in $LOCATION"
        az group create --name "$RESOURCE_GROUP" --location "$LOCATION"
    else
        print_info "Resource group already exists: $RESOURCE_GROUP"
    fi
    
    DEPLOYMENT_NAME="campus-device-loan-${ENV}-$(date +%Y%m%d-%H%M%S)"
    PARAMETERS_FILE="Deployment/${ENV}.parameters.json"
    
    if [ ! -f "$PARAMETERS_FILE" ]; then
        print_error "Parameters file not found: $PARAMETERS_FILE"
        continue
    fi
    
    print_info "Deployment name: $DEPLOYMENT_NAME"
    print_info "Parameters file: $PARAMETERS_FILE"
    
    # Validate deployment
    print_info "Validating deployment..."
    if az deployment group validate \
        --resource-group "$RESOURCE_GROUP" \
        --template-file Deployment/main.bicep \
        --parameters "@${PARAMETERS_FILE}" \
        --output none; then
        print_info "Validation successful"
    else
        print_error "Validation failed for $ENV environment"
        continue
    fi
    
    # Deploy
    print_info "Starting deployment..."
    if az deployment group create \
        --resource-group "$RESOURCE_GROUP" \
        --name "$DEPLOYMENT_NAME" \
        --template-file Deployment/main.bicep \
        --parameters "@${PARAMETERS_FILE}" \
        --output json > "deployment-${ENV}-output.json"; then
        
        print_info "✓ Deployment successful for $ENV environment"
        
        # Extract outputs
        FUNCTION_APP_NAME=$(jq -r '.properties.outputs.functionAppName.value' "deployment-${ENV}-output.json")
        FUNCTION_APP_URL=$(jq -r '.properties.outputs.functionAppUrl.value' "deployment-${ENV}-output.json")
        COSMOS_ENDPOINT=$(jq -r '.properties.outputs.cosmosEndpoint.value' "deployment-${ENV}-output.json")
        
        print_info "Function App: $FUNCTION_APP_NAME"
        print_info "Function URL: $FUNCTION_APP_URL"
        print_info "Cosmos Endpoint: $COSMOS_ENDPOINT"
    else
        print_error "Deployment failed for $ENV environment"
    fi
    
    echo ""
done

print_info "========================================="
print_info "All deployments completed!"
print_info "========================================="
print_info "Location: $LOCATION"
print_info ""
print_info "Resource Groups Created:"
print_info "  - deviceloan-dev-${BASE_NAME}-rg"
print_info "  - deviceloan-test-${BASE_NAME}-rg"
print_info "  - deviceloan-prod-${BASE_NAME}-rg"
print_info ""
print_info "Resources created:"
print_info "  DEV:"
print_info "    - func-deviceloan-dev-${BASE_NAME} (Function App)"
print_info "    - cosmos-deviceloan-dev-${BASE_NAME} (Cosmos DB)"
print_info "  TEST:"
print_info "    - func-deviceloan-test-${BASE_NAME} (Function App)"
print_info "    - cosmos-deviceloan-test-${BASE_NAME} (Cosmos DB)"
print_info "  PROD:"
print_info "    - func-deviceloan-prod-${BASE_NAME} (Function App)"
print_info "    - cosmos-deviceloan-prod-${BASE_NAME} (Cosmos DB)"
