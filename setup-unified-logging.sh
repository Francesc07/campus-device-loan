#!/bin/bash

# Setup Unified Application Insights Logging
# This script creates shared Log Analytics workspaces and migrates all Application Insights to use them

set -e

ENVIRONMENTS=("dev" "test" "prod")
BASE_NAME="ab07"
LOCATION="uksouth"

echo "🔍 Setting up unified logging for Campus Device Lender services..."
echo ""

for ENV in "${ENVIRONMENTS[@]}"; do
  RG_NAME="CampusDeviceLender-${ENV}-Ab07-rg"
  LOG_WORKSPACE_NAME="log-campusdevicelender-${ENV}-${BASE_NAME}"
  
  echo "📊 Environment: ${ENV}"
  echo "   Resource Group: ${RG_NAME}"
  
  # Check if resource group exists
  if ! az group show --name "${RG_NAME}" &>/dev/null; then
    echo "   ⚠️  Resource group ${RG_NAME} does not exist. Skipping..."
    continue
  fi
  
  # Create Log Analytics Workspace (if it doesn't exist)
  echo "   🔨 Creating/Verifying Log Analytics Workspace: ${LOG_WORKSPACE_NAME}"
  az monitor log-analytics workspace create \
    --resource-group "${RG_NAME}" \
    --workspace-name "${LOG_WORKSPACE_NAME}" \
    --location "${LOCATION}" \
    --retention-time 30 \
    --sku PerGB2018 \
    --query "{Name:name, ResourceId:id}" \
    -o table
  
  # Get the workspace resource ID
  WORKSPACE_ID=$(az monitor log-analytics workspace show \
    --resource-group "${RG_NAME}" \
    --workspace-name "${LOG_WORKSPACE_NAME}" \
    --query id -o tsv)
  
  echo "   ✅ Workspace Resource ID: ${WORKSPACE_ID}"
  echo ""
  
  # Get all Application Insights in this environment
  APP_INSIGHTS=$(az resource list \
    --resource-group "${RG_NAME}" \
    --resource-type "Microsoft.Insights/components" \
    --query "[].name" -o tsv)
  
  if [ -z "$APP_INSIGHTS" ]; then
    echo "   ⚠️  No Application Insights found in ${RG_NAME}"
    continue
  fi
  
  echo "   🔗 Connecting Application Insights to shared workspace:"
  while IFS= read -r APP_NAME; do
    echo "      - ${APP_NAME}"
    
    # Update Application Insights to use the shared workspace
    az resource update \
      --resource-group "${RG_NAME}" \
      --name "${APP_NAME}" \
      --resource-type "Microsoft.Insights/components" \
      --set properties.WorkspaceResourceId="${WORKSPACE_ID}" \
      --output none
    
    echo "        ✅ Connected to ${LOG_WORKSPACE_NAME}"
  done <<< "$APP_INSIGHTS"
  
  echo ""
  echo "   🎉 ${ENV} environment configured successfully!"
  echo "   📍 Workspace Portal: https://portal.azure.com/#@bd73de33-fceb-4a60-9f54-f988e69aa524/resource${WORKSPACE_ID}"
  echo ""
  echo "   📝 Query Example (run in Log Analytics):"
  echo "   ------------------------------------------------------------"
  echo "   // View all traces across all services"
  echo "   traces"
  echo "   | where timestamp > ago(1h)"
  echo "   | project timestamp, message, severityLevel, appName"
  echo "   | order by timestamp desc"
  echo ""
  echo "   // View requests across all services"
  echo "   requests"
  echo "   | where timestamp > ago(1h)"
  echo "   | summarize count() by appName, name, resultCode"
  echo "   | order by count_ desc"
  echo "   ------------------------------------------------------------"
  echo ""
done

echo "✅ All environments configured!"
echo ""
echo "🚀 Next Steps:"
echo "   1. Go to Azure Portal > Log Analytics Workspaces"
echo "   2. Select: log-campusdevicelender-dev-${BASE_NAME}"
echo "   3. Click 'Logs' to run cross-service queries"
echo "   4. Create dashboards and alerts as needed"
echo ""
echo "💡 Useful Queries:"
echo "   - All logs: union traces, requests, exceptions, dependencies"
echo "   - By service: traces | where appName contains 'deviceloan'"
echo "   - Errors only: traces | where severityLevel >= 3"
