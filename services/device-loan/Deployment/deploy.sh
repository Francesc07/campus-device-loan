#!/bin/bash

# Deploy a single environment for Campus Device Loan Service
# Usage: ./deploy.sh <environment>
# Example: ./deploy.sh dev

set -e

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

# Variables
BASE_NAME="Ab07"
LOCATION="uksouth"
ENVIRONMENT=$1

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

# Check if environment parameter is provided
if [ -z "$ENVIRONMENT" ]; then
    print_error "Environment parameter is required"
    echo "Usage: $0 <environment>"
    echo "Example: $0 dev"
    echo "Valid environments: dev, test, prod"
    exit 1
fi

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(dev|test|prod)$ ]]; then
    print_error "Invalid environment: $ENVIRONMENT"
    echo "Valid environments: dev, test, prod"
    exit 1
fi

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

RESOURCE_GROUP="deviceloan-${ENVIRONMENT}-${BASE_NAME}-rg"

print_info "Deploying $ENVIRONMENT environment"
print_info "Resource Group: $RESOURCE_GROUP"
print_info "Location: $LOCATION"

# Create resource group if it doesn't exist
if ! az group show --name "$RESOURCE_GROUP" &> /dev/null; then
    print_info "Creating resource group: $RESOURCE_GROUP"
    az group create --name "$RESOURCE_GROUP" --location "$LOCATION"
else
    print_info "Resource group already exists: $RESOURCE_GROUP"
fi

# Deployment variables
DEPLOYMENT_NAME="campus-device-loan-${ENVIRONMENT}-$(date +%Y%m%d-%H%M%S)"
PARAMETERS_FILE="Deployment/${ENVIRONMENT}.parameters.json"

if [ ! -f "$PARAMETERS_FILE" ]; then
    print_error "Parameters file not found: $PARAMETERS_FILE"
    exit 1
fi

print_info "Deployment name: $DEPLOYMENT_NAME"
print_info "Parameters file: $PARAMETERS_FILE"

# Validate deployment
print_info "Validating deployment..."
az deployment group validate \
    --resource-group "$RESOURCE_GROUP" \
    --template-file Deployment/main.bicep \
    --parameters "@${PARAMETERS_FILE}"

# Deploy
print_info "Starting deployment..."
az deployment group create \
    --resource-group "$RESOURCE_GROUP" \
    --name "$DEPLOYMENT_NAME" \
    --template-file Deployment/main.bicep \
    --parameters "@${PARAMETERS_FILE}" \
    --output table

print_info "✓ Deployment successful for $ENVIRONMENT environment"

# Get deployment outputs
print_info "Retrieving deployment outputs..."
OUTPUTS=$(az deployment group show \
    --resource-group "$RESOURCE_GROUP" \
    --name "$DEPLOYMENT_NAME" \
    --query properties.outputs)

echo ""
print_info "========================================="
print_info "Deployment Outputs"
print_info "========================================="
echo "$OUTPUTS" | jq -r 'to_entries[] | "\(.key): \(.value.value)"'
