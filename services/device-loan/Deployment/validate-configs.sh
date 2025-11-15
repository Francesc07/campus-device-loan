#!/bin/bash

# Validate all configuration files have required settings
# This ensures consistency across dev, test, and prod environments

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "🔍 Validating configuration files..."
echo ""

# Required settings for local.settings.json files
REQUIRED_LOCAL_SETTINGS=(
  "FUNCTIONS_WORKER_RUNTIME"
  "AzureWebJobsStorage"
  "COSMOS_DB_ENDPOINT"
  "COSMOS_DB_KEY"
  "COSMOS_DB_DATABASE"
  "COSMOS_DB_CONTAINER"
  "COSMOS_DEVICESNAPSHOTS_CONTAINER_ID"
  "EVENTGRID_TOPIC_ENDPOINT"
  "EVENTGRID_TOPIC_KEY"
  "ENVIRONMENT"
)

# Required settings for .env files
REQUIRED_ENV_SETTINGS=(
  "ENVIRONMENT"
  "FUNCTIONS_WORKER_RUNTIME"
  "AZURE_STORAGE_CONNECTION_STRING"
  "COSMOS_DB_ENDPOINT"
  "COSMOS_DB_KEY"
  "COSMOS_DB_DATABASE"
  "COSMOS_DB_CONTAINER"
  "COSMOS_DEVICESNAPSHOTS_CONTAINER_ID"
  "APPLICATIONINSIGHTS_CONNECTION_STRING"
  "FUNCTION_APP_NAME"
  "COSMOS_ACCOUNT_NAME"
  "STORAGE_ACCOUNT_NAME"
  "RESOURCE_GROUP"
  "EVENTGRID_TOPIC_ENDPOINT"
  "EVENTGRID_TOPIC_KEY"
)

ENVIRONMENTS=("dev" "test" "prod")
ALL_VALID=true

# Validate local.settings.*.json files
echo "📋 Checking local.settings.*.json files..."
for env in "${ENVIRONMENTS[@]}"; do
  FILE="$PROJECT_DIR/local.settings.$env.json"
  
  if [ ! -f "$FILE" ]; then
    echo "❌ Missing file: $FILE"
    ALL_VALID=false
    continue
  fi
  
  echo "  Checking $env environment..."
  MISSING_SETTINGS=()
  
  for setting in "${REQUIRED_LOCAL_SETTINGS[@]}"; do
    if ! grep -q "\"$setting\"" "$FILE"; then
      MISSING_SETTINGS+=("$setting")
    fi
  done
  
  if [ ${#MISSING_SETTINGS[@]} -eq 0 ]; then
    echo "  ✅ local.settings.$env.json - All settings present"
  else
    echo "  ❌ local.settings.$env.json - Missing settings:"
    for missing in "${MISSING_SETTINGS[@]}"; do
      echo "      - $missing"
    done
    ALL_VALID=false
  fi
done

echo ""

# Validate .env.* files
echo "📋 Checking .env.* files..."
for env in "${ENVIRONMENTS[@]}"; do
  FILE="$PROJECT_DIR/.env.$env"
  
  if [ ! -f "$FILE" ]; then
    echo "❌ Missing file: $FILE"
    ALL_VALID=false
    continue
  fi
  
  echo "  Checking $env environment..."
  MISSING_SETTINGS=()
  
  for setting in "${REQUIRED_ENV_SETTINGS[@]}"; do
    if ! grep -q "^$setting=" "$FILE"; then
      MISSING_SETTINGS+=("$setting")
    fi
  done
  
  if [ ${#MISSING_SETTINGS[@]} -eq 0 ]; then
    echo "  ✅ .env.$env - All settings present"
  else
    echo "  ❌ .env.$env - Missing settings:"
    for missing in "${MISSING_SETTINGS[@]}"; do
      echo "      - $missing"
    done
    ALL_VALID=false
  fi
done

echo ""

# Summary
if [ "$ALL_VALID" = true ]; then
  echo "✅ All configuration files are valid!"
  echo ""
  echo "📝 Note: Placeholder values will be populated after running:"
  echo "   ./Deployment/deploy-all.sh"
  echo "   ./populate-all-envs.sh"
  exit 0
else
  echo "❌ Some configuration files are missing required settings."
  echo "   Please review the errors above."
  exit 1
fi
