#!/bin/bash

# Switch between different environment configurations
# Usage: ./switch-env.sh <environment>
# Example: ./switch-env.sh dev

ENVIRONMENT=$1

if [ -z "$ENVIRONMENT" ]; then
    echo "Usage: $0 <environment>"
    echo "Example: $0 dev"
    echo "Valid environments: dev, test, prod"
    exit 1
fi

if [[ ! "$ENVIRONMENT" =~ ^(dev|test|prod)$ ]]; then
    echo "Invalid environment: $ENVIRONMENT"
    echo "Valid environments: dev, test, prod"
    exit 1
fi

SOURCE_FILE="local.settings.${ENVIRONMENT}.json"
TARGET_FILE="local.settings.json"

if [ ! -f "$SOURCE_FILE" ]; then
    echo "Error: $SOURCE_FILE not found"
    exit 1
fi

echo "Switching to $ENVIRONMENT environment..."
cp "$SOURCE_FILE" "$TARGET_FILE"
echo "✓ Switched to $ENVIRONMENT environment"
echo "  local.settings.json now uses $ENVIRONMENT configuration"

# Also update .env file if it exists
if [ -f ".env.${ENVIRONMENT}" ]; then
    cp ".env.${ENVIRONMENT}" ".env"
    echo "  .env now uses $ENVIRONMENT configuration"
fi
