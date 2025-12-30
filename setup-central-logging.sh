#!/bin/bash

# Setup Central Log Analytics Workspace for Campus Device Loan System
# This script creates one Log Analytics workspace per environment and links all Application Insights

set -e

LOCATION="uksouth"
BASE_NAME="Ab07"
ENVIRONMENTS=("dev" "test" "prod")

echo "🚀 Setting up centralized logging for Campus Device Loan System"
echo "=================================================="

for ENV in "${ENVIRONMENTS[@]}"; do
  echo ""
  echo "📊 Processing Environment: $ENV"
  echo "-----------------------------------"
  
  # Define resource names
  RG_NAME="CampusDeviceLender-${ENV}-${BASE_NAME}-rg"
  WORKSPACE_NAME="log-campusdevice-${ENV}-${BASE_NAME}-central"
  
  # Check if resource group exists
  if ! az group show --name "$RG_NAME" &>/dev/null; then
    echo "⚠️  Resource group $RG_NAME not found, skipping..."
    continue
  fi
  
  echo "✅ Resource group: $RG_NAME"
  
  # Create or get Log Analytics Workspace
  echo "🔍 Checking for existing Log Analytics workspace..."
  if az monitor log-analytics workspace show --resource-group "$RG_NAME" --workspace-name "$WORKSPACE_NAME" &>/dev/null; then
    echo "✅ Log Analytics workspace already exists: $WORKSPACE_NAME"
  else
    echo "📝 Creating Log Analytics workspace: $WORKSPACE_NAME"
    az monitor log-analytics workspace create \
      --resource-group "$RG_NAME" \
      --workspace-name "$WORKSPACE_NAME" \
      --location "$LOCATION" \
      --retention-time 30 \
      --sku PerGB2018
    echo "✅ Created Log Analytics workspace: $WORKSPACE_NAME"
  fi
  
  # Get workspace resource ID
  WORKSPACE_ID=$(az monitor log-analytics workspace show \
    --resource-group "$RG_NAME" \
    --workspace-name "$WORKSPACE_NAME" \
    --query id -o tsv)
  
  echo "📋 Workspace ID: $WORKSPACE_ID"
  
  # Link all Application Insights instances to the workspace
  echo ""
  echo "🔗 Linking Application Insights instances to workspace..."
  
  SERVICES=("devicecatalog" "deviceloan" "deviceconfirmation" "devicereservation")
  
  for SERVICE in "${SERVICES[@]}"; do
    APP_INSIGHTS_NAME="${SERVICE}-${ENV}-ab07-func"
    
    # Check if App Insights exists
    if az monitor app-insights component show \
      --resource-group "$RG_NAME" \
      --app "$APP_INSIGHTS_NAME" &>/dev/null; then
      
      echo "  🔗 Linking $APP_INSIGHTS_NAME to workspace..."
      
      az monitor app-insights component update \
        --resource-group "$RG_NAME" \
        --app "$APP_INSIGHTS_NAME" \
        --workspace "$WORKSPACE_ID"
      
      echo "  ✅ Linked: $APP_INSIGHTS_NAME"
    else
      echo "  ⚠️  App Insights not found: $APP_INSIGHTS_NAME"
    fi
  done
  
  # Link Function Apps diagnostic settings to workspace
  echo ""
  echo "🔗 Configuring Function Apps diagnostic settings..."
  
  for SERVICE in "${SERVICES[@]}"; do
    FUNCTION_APP_NAME="${SERVICE}-${ENV}-ab07-func"
    
    # Check if Function App exists
    if az functionapp show \
      --resource-group "$RG_NAME" \
      --name "$FUNCTION_APP_NAME" &>/dev/null; then
      
      echo "  📊 Configuring diagnostics for $FUNCTION_APP_NAME..."
      
      # Remove existing diagnostic setting if it exists
      az monitor diagnostic-settings delete \
        --resource "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RG_NAME/providers/Microsoft.Web/sites/$FUNCTION_APP_NAME" \
        --name "DiagnosticsToWorkspace" &>/dev/null || true
      
      # Create diagnostic setting
      az monitor diagnostic-settings create \
        --resource "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RG_NAME/providers/Microsoft.Web/sites/$FUNCTION_APP_NAME" \
        --name "DiagnosticsToWorkspace" \
        --workspace "$WORKSPACE_ID" \
        --logs '[
          {
            "category": "FunctionAppLogs",
            "enabled": true,
            "retentionPolicy": {"enabled": false, "days": 0}
          }
        ]' \
        --metrics '[
          {
            "category": "AllMetrics",
            "enabled": true,
            "retentionPolicy": {"enabled": false, "days": 0}
          }
        ]'
      
      echo "  ✅ Configured: $FUNCTION_APP_NAME"
    else
      echo "  ⚠️  Function App not found: $FUNCTION_APP_NAME"
    fi
  done
  
  echo ""
  echo "✅ Environment $ENV setup complete!"
  echo ""
done

echo ""
echo "🎉 Central logging setup complete!"
echo "=================================================="
echo ""
echo "📊 Next Steps:"
echo "1. Go to Azure Portal → Monitor → Logs"
echo "2. Select scope: Resource Group → CampusDeviceLender-{env}-${BASE_NAME}-rg"
echo "3. Run queries across all services:"
echo ""
echo "Example Queries:"
echo "----------------"
echo ""
echo "# View all logs from all services"
echo "union AppTraces, AppRequests, AppExceptions"
echo "| where TimeGenerated > ago(1h)"
echo "| project TimeGenerated, AppRoleName, Message, OperationName"
echo "| order by TimeGenerated desc"
echo ""
echo "# Trace a request across services"
echo "union AppRequests, AppDependencies"
echo "| where OperationId == 'YOUR_OPERATION_ID'"
echo "| project TimeGenerated, AppRoleName, OperationName, Success, DurationMs"
echo "| order by TimeGenerated asc"
echo ""
echo "# Error rate by service"
echo "AppExceptions"
echo "| summarize ErrorCount = count() by AppRoleName, bin(TimeGenerated, 5m)"
echo "| order by TimeGenerated desc"
echo ""
