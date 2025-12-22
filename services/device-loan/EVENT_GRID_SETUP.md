# Device Sync Event Grid - Setup & Troubleshooting

## Problem Identified

The **Loan Service is not receiving device updates from the Catalog Service** because:

1. ❌ **Missing Event Grid Subscription**: No subscription exists from Catalog Service's Event Grid topic to Loan Service's `device-sync-event-grid` function
2. ⚠️ **Duplicate Functions**: Had two similar functions (`device-sync-http.ts` and `device-sync-event-grid.ts`) causing confusion

## Fixes Applied

### 1. Removed Duplicate Function
- ✅ Removed `device-sync-http.ts` from registration (backed up as `.backup`)
- ✅ Using only `device-sync-event-grid.ts` as the proper Event Grid trigger

### 2. Function Configuration
The function is properly configured to handle these events:
- `Device.Created` - New device added to catalog
- `Device.Updated` - Device availability or details changed
- `Device.Deleted` - Device removed from catalog
- `Device.Snapshot` - Full device snapshot sync

## Required Setup: Create Event Grid Subscription

### Option 1: Using Azure Portal

1. Navigate to **Catalog Service's Event Grid Topic**:
   - Resource Group: `devicecatalog-{env}-Ab07-rg`
   - Topic Name: `evgt-devicecatalog-{env}-Ab07`

2. Click **+ Event Subscription**

3. Configure subscription:
   ```
   Name: deviceloan-device-sync
   Event Schema: Event Grid Schema
   Filter to Event Types: 
     - Device.Created
     - Device.Updated  
     - Device.Deleted
     - Device.Snapshot
   
   Endpoint Type: Azure Function
   Endpoint: 
     - Subscription: <your-subscription>
     - Resource Group: deviceloan-{env}-Ab07-rg
     - Function App: func-deviceloan-{env}-Ab07
     - Function: device-sync-event-grid
   ```

4. Click **Create**

### Option 2: Using Azure CLI

```bash
#!/bin/bash
# Set environment (dev-cloud, test-cloud, or prod-cloud)
ENV="dev-cloud"

# Get resource IDs
CATALOG_TOPIC_ID=$(az eventgrid topic show \
  --name "evgt-devicecatalog-${ENV}-Ab07" \
  --resource-group "devicecatalog-${ENV}-Ab07-rg" \
  --query id -o tsv)

LOAN_FUNCTION_ID=$(az functionapp show \
  --name "func-deviceloan-${ENV}-Ab07" \
  --resource-group "deviceloan-${ENV}-Ab07-rg" \
  --query id -o tsv)

# Create subscription
az eventgrid event-subscription create \
  --name "deviceloan-device-sync" \
  --source-resource-id "$CATALOG_TOPIC_ID" \
  --endpoint-type azurefunction \
  --endpoint "${LOAN_FUNCTION_ID}/functions/device-sync-event-grid" \
  --included-event-types Device.Created Device.Updated Device.Deleted Device.Snapshot \
  --event-delivery-schema eventgridschema
```

## Verification

### 1. Check Subscription Exists
```bash
./check-event-grid-subscription.sh
```

### 2. Test Event Flow
From Catalog Service, update a device:
```bash
curl -X PUT https://func-devicecatalog-{env}-Ab07.azurewebsites.net/api/devices/{deviceId} \
  -H "Content-Type: application/json" \
  -d '{
    "availableCount": 5,
    "maxDeviceCount": 10
  }'
```

### 3. Check Loan Service Logs
```bash
# Azure CLI
az functionapp logs tail \
  --name func-deviceloan-{env}-Ab07 \
  --resource-group deviceloan-{env}-Ab07-rg

# Look for:
# "📥 LoanService received catalog event: Device.Updated"
# "✅ Sync applied for device: {model}"
```

### 4. Verify Device Snapshot in Loan Service
```bash
curl https://func-deviceloan-{env}-Ab07.azurewebsites.net/api/devices/{deviceId}
```

The device data should match the catalog service.

## Event Schema

Events published by Catalog Service:

```json
{
  "id": "unique-event-id",
  "eventType": "Device.Updated",
  "subject": "devices/device-123",
  "eventTime": "2025-12-13T10:30:00Z",
  "dataVersion": "1.0",
  "data": {
    "id": "device-123",
    "brand": "Apple",
    "model": "MacBook Pro 16",
    "category": "Laptop",
    "description": "M2 Pro, 16GB RAM",
    "availableCount": 8,
    "maxDeviceCount": 15,
    "imageUrl": "https://...",
    "fileUrl": "https://..."
  }
}
```

## Troubleshooting

### Events Not Arriving

1. **Check Catalog Service is Publishing Events**
   ```bash
   az monitor activity-log list \
     --resource-group devicecatalog-{env}-Ab07-rg \
     --offset 1h
   ```

2. **Check Event Grid Delivery Metrics**
   - Azure Portal → Event Grid Topic → Metrics
   - Look for "Delivery Failed Events" or "Dead Lettered Events"

3. **Check Function App Logs**
   ```bash
   az functionapp logs tail -n func-deviceloan-{env}-Ab07 -g deviceloan-{env}-Ab07-rg
   ```

4. **Verify Function is Deployed**
   ```bash
   az functionapp function show \
     --name func-deviceloan-{env}-Ab07 \
     --resource-group deviceloan-{env}-Ab07-rg \
     --function-name device-sync-event-grid
   ```

### Subscription Exists But Events Not Processing

1. **Check function logs for errors**
2. **Verify event schema matches** (Event Grid Schema vs CloudEvents)
3. **Check if function is disabled**
4. **Verify Cosmos DB connectivity** in function app settings

## Testing Locally

For local development, Event Grid subscriptions don't work. Instead:

1. Use the Azure Storage Queue trigger alternative (if implemented)
2. Manually call the device sync endpoint
3. Use ngrok to expose local function to Event Grid (advanced)

## Related Files

- Function: `src/API/functions/device-sync-event-grid.ts`
- Repository: `src/Infrastructure/Persistence/DeviceSnapshotRepository.ts`
- Model: `src/Infrastructure/Models/DeviceSnapshot.ts`
- Configuration: `src/functionApp.ts`
