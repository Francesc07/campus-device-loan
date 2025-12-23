# Device Loan Service

Campus device loan microservice built with Azure Functions, Cosmos DB, and Event Grid.

## Overview

This service manages device loans for students, allowing them to:
- Create loan reservations (2-day period)
- Cancel loans before pickup
- View loan history

## Architecture

**Tech Stack:**
- Azure Functions v4 (Node.js 18, TypeScript)
- Cosmos DB Serverless (2 containers: Loans, DeviceSnapshots)
- Event Grid (event-driven communication)
- Application Insights (monitoring)

**Event-Driven Design:**
- **Publishes**: `Loan.Created`, `Loan.Cancelled`
- **Subscribes**: `Device.Snapshot`, `Device.Deleted` (from Catalog Service)
- **Subscribers**: Reservation Service, Catalog Service

## Environments

| Environment | Function App | Purpose |
|-------------|--------------|---------|
| **DEV** | `http://localhost:7071` | Local development with Azure DEV resources |
| **TEST** | `https://func-deviceloan-test-ab07.azurewebsites.net` | Integration testing |
| **PROD** | `https://func-deviceloan-prod-ab07.azurewebsites.net` | Production |

## Quick Start

### Prerequisites
- Node.js 18+
- Azure CLI
- Azure Functions Core Tools v4

### Local Development (DEV)

```bash
# 1. Switch to DEV environment
./Deployment/switch-env.sh dev

# 2. Install dependencies
npm install

# 3. Build TypeScript
npm run build

# 4. Start locally
npm start
```

Function App runs on: `http://localhost:7071`

## API Reference

Base path: `http://localhost:7071/api` for local development or `https://<function-app-name>.azurewebsites.net/api` in Azure.

### POST /loans

Borrow or reserve a device for a student and start the two-day pickup timer.

**Request**

```json
{
  "userId": "student123",
  "modelId": "laptop-model-456"
}
```

**Sample response**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "loanId": "uuid",
    "userId": "student123",
    "modelId": "laptop-model-456",
    "status": "pending",
    "createdAt": "2025-11-12T10:00:00Z",
    "dueAt": "2025-11-14T10:00:00Z"
  }
}
```

**Emits** `Loan.Created`
- Reservation Service: reserves the device.
- Catalog Service: adjusts availability.

### DELETE /loans/{loanId}

Cancel a reservation before pickup.

**Sample response**

```json
{
  "success": true,
  "message": "Loan cancelled successfully",
  "data": {
    "id": "uuid",
    "loanId": "uuid",
    "userId": "student123",
    "modelId": "laptop-model-456",
    "status": "cancelled",
    "createdAt": "2025-11-12T10:00:00Z",
    "cancelledAt": "2025-11-12T11:00:00Z",
    "dueAt": "2025-11-14T10:00:00Z"
  }
}
```

**Emits** `Loan.Cancelled`
- Reservation Service: releases the reservation.
- Catalog Service: restores availability.

### GET /loans?userId={userId}

Return the current and past loans for a user. Supports filtering by `userId`.

**Sample response**

```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": "uuid",
      "loanId": "uuid",
      "userId": "student123",
      "modelId": "laptop-model-456",
      "status": "active",
      "createdAt": "2025-11-10T10:00:00Z",
      "dueAt": "2025-11-12T10:00:00Z"
    },
    {
      "id": "uuid-2",
      "loanId": "uuid-2",
      "userId": "student123",
      "modelId": "device-789",
      "status": "cancelled",
      "createdAt": "2025-11-08T10:00:00Z",
      "cancelledAt": "2025-11-08T11:00:00Z",
      "dueAt": "2025-11-10T10:00:00Z"
    }
  ]
}
```

## Event Grid Integration

### Device Catalog Sync (Event Grid Trigger)

**Function**: `deviceSyncEventGrid`  
**Trigger Type**: Event Grid  
**Subscribes To**: Catalog Service Event Grid Topic

This function maintains a local snapshot of the device catalog for resilience. When the Catalog Service is unavailable, loans can still validate device availability from local snapshots.

**Subscribed Events**:
- `Device.Created` - Adds new device to local snapshot
- `Device.Updated` - Updates device availability/details
- `Device.Deleted` - Removes device from snapshot

**Event Schema**:
```json
{
  "id": "event-uuid",
  "eventType": "Device.Updated",
  "subject": "devices/device-123",
  "eventTime": "2025-11-15T10:30:00Z",
  "data": {
    "id": "device-123",
    "brand": "Dell",
    "model": "Latitude 5420",
    "category": "Laptop",
    "description": "14-inch business laptop",
    "availableCount": 8,
    "maxDeviceCount": 15,
    "imageUrl": "https://...",
    "fileUrl": "https://..."
  }
}
```

**Configuration Required**:  
Create an Event Grid subscription in Azure Portal pointing the Catalog Service topic to this function's Event Grid trigger endpoint.

### Error responses

- 400 – invalid payload (for example, missing `userId` or `modelId`).
- 404 – loan not found for the supplied identifier.
- 500 – unexpected server error.

### Loan statuses

| Status    | Description                            |
|-----------|----------------------------------------|
| pending   | Loan created and waiting for pickup.    |
| active    | Device collected by the student.       |
| cancelled | Reservation cancelled before pickup.   |
| returned  | Device returned.                       |
| overdue   | Pickup window expired without return.  |

## Deployment

### Naming & Resources

- Resource group: `rg-loan-device-Ab07`
- Region: `uksouth`

| Resource | Dev | Test | Prod |
|----------|-----|------|------|
| Function App | func-loan-device-Ab07-dev | func-loan-device-Ab07-test | func-loan-device-Ab07-prod |
| Cosmos DB | cosmos-loan-device-ab07-dev | cosmos-loan-device-ab07-test | cosmos-loan-device-ab07-prod |
| Storage | stloandeviceab07dev | stloandeviceab07test | stloandeviceab07prod |
| App Insights | appi-loan-device-Ab07-dev | appi-loan-device-Ab07-test | appi-loan-device-Ab07-prod |

### Azure resources by environment

#### Development (dev)

```
Resource Group: deviceloan-dev-Ab07-rg
├── Function App: func-deviceloan-dev-Ab07
├── Cosmos DB: cosmos-deviceloan-dev-Ab07
│   ├── Database: DeviceLoanDB
│   ├── Container: Loans
│   └── Container: DeviceSnapshots
├── Storage: stdevloandevAb07
├── Event Grid Topic: evgt-deviceloan-dev-Ab07
├── App Insights: appi-deviceloan-dev-Ab07
└── Log Analytics: log-deviceloan-dev-Ab07
```

#### Test (test)

```
Resource Group: deviceloan-test-Ab07-rg
├── Function App: func-deviceloan-test-Ab07
├── Cosmos DB: cosmos-deviceloan-test-Ab07
│   ├── Database: DeviceLoanDB
│   ├── Container: Loans
│   └── Container: DeviceSnapshots
├── Storage: stdevloantestAb07
├── Event Grid Topic: evgt-deviceloan-test-Ab07
├── App Insights: appi-deviceloan-test-Ab07
└── Log Analytics: log-deviceloan-test-Ab07
```

#### Production (prod)

```
Resource Group: deviceloan-prod-Ab07-rg
├── Function App: func-deviceloan-prod-Ab07
├── Cosmos DB: cosmos-deviceloan-prod-Ab07
│   ├── Database: DeviceLoanDB
│   ├── Container: Loans
│   └── Container: DeviceSnapshots
├── Storage: stdevloanprodAb07
├── Event Grid Topic: evgt-deviceloan-prod-Ab07
├── App Insights: appi-deviceloan-prod-Ab07
└── Log Analytics: log-deviceloan-prod-Ab07
```

### Deploy Infrastructure

```bash
# Deploy all 3 environments (dev, test, prod)
./Deployment/deploy-all.sh

# Deploy single environment
./Deployment/deploy.sh dev
```

### Populate Credentials

```bash
# Populate all environment credentials
./Deployment/populate-all-envs.sh
```

### Validate Configuration

```bash
# Check all config files are valid
./Deployment/validate-configs.sh
```

### Deploy Function Code

```bash
# Switch to target environment
./Deployment/switch-env.sh test

# Deploy to Azure
func azure functionapp publish func-deviceloan-test-Ab07
```

## Project Structure

```
services/device-loan/
├── src/
│   ├── API/
│   │   └── functions/          # HTTP endpoints & Event Grid triggers
│   │       ├── create-loan-http.ts
│   │       ├── cancel-loan-http.ts
│   │       ├── list-loans-http.ts
│   │       └── device-sync-event-grid.ts
│   ├── Application/
│   │   └── useCases/           # Business logic
│   │       ├── CreateLoanHandler.ts
│   │       └── CancelLoanHandler.ts
│   ├── Domain/
│   │   └── Entities/           # Domain models
│   │       ├── Loan.ts
│   │       └── DeviceSnapshot.ts
│   └── Infrastructure/
│       ├── CosmosLoanRepository.ts
│       ├── DeviceSnapshotRepository.ts
│       └── EventGrid/
│           └── LoanEventPublisher.ts
├── Deployment/                 # Infrastructure & scripts
│   ├── main.bicep             # Infrastructure template
│   ├── deploy-all.sh          # Deploy all environments
│   ├── deploy.sh              # Deploy single environment
│   ├── populate-all-envs.sh   # Fetch credentials
│   ├── switch-env.sh          # Switch environments
│   └── validate-configs.sh    # Validate config files
├── functionApp.ts             # Function registration
├── host.json                  # Function host config
├── package.json               # Dependencies
└── tsconfig.json              # TypeScript config
```

## Database Schema

### Loans Container
```typescript
{
  id: string;              // Partition key: /id
  loanId: string;
  userId: string;
  modelId: string;
  createdAt: string;       // ISO timestamp
  dueAt: string;           // 2 days from creation
  status: "pending" | "active" | "cancelled" | "returned" | "overdue";
  cancelledAt?: string;
  returnedAt?: string;
  notes?: string;
}
```

### DeviceSnapshots Container
```typescript
{
  id: string;              // Partition key: /id
  brand: string;
  model: string;
  category: string;
  description?: string;
  availableCount: number;
  maxDeviceCount: number;
  imageUrl?: string;
  fileUrl?: string;
  lastUpdated: string;     // ISO timestamp
}
```

## Event Schemas

### Loan.Created
```json
{
  "eventType": "Loan.Created",
  "subject": "LoanService/loans/{loanId}",
  "data": {
    "loanId": "uuid",
    "userId": "student123",
    "modelId": "laptop-id",
    "status": "pending",
    "createdAt": "2025-11-13T07:00:00Z",
    "dueAt": "2025-11-15T07:00:00Z"
  }
}
```

### Loan.Cancelled
```json
{
  "eventType": "Loan.Cancelled",
  "subject": "LoanService/loans/{loanId}",
  "data": {
    "loanId": "uuid",
    "userId": "student123",
    "modelId": "laptop-id",
    "status": "cancelled",
    "cancelledAt": "2025-11-13T08:00:00Z"
  }
}
```

## Configuration Files

- **local.settings.dev.json** - DEV (local) configuration
- **local.settings.test.json** - TEST environment configuration
- **local.settings.prod.json** - PROD environment configuration
- **.env.dev** - DEV environment variables
- **.env.test** - TEST environment variables
- **.env.prod** - PROD environment variables
- **AUTH0_SETUP.md** - Complete Auth0 configuration guide

> ⚠️ **Important**: Auth0 authentication requires `AUTH0_DOMAIN` and `AUTH0_AUDIENCE` to be configured. See [AUTH0_SETUP.md](./AUTH0_SETUP.md) for detailed setup instructions.

### local.settings.*.json at a glance

| Setting                           | Dev                     | Test                    | Prod                    | Notes                              |
|-----------------------------------|-------------------------|-------------------------|-------------------------|------------------------------------|
| FUNCTIONS_WORKER_RUNTIME          | Configured              | Configured              | Configured              | Always `node`.
| AzureWebJobsStorage               | Populate after deployment | Populate after deployment | Populate after deployment | Storage connection string.
| COSMOS_DB_ENDPOINT                | Populate after deployment | Populate after deployment | Populate after deployment | Cosmos DB endpoint URL.
| COSMOS_DB_KEY                     | Populate after deployment | Populate after deployment | Populate after deployment | Cosmos DB access key.
| COSMOS_DB_DATABASE                | DeviceLoanDB            | DeviceLoanDB            | DeviceLoanDB            | Shared database name.
| COSMOS_DB_CONTAINER               | Loans                   | Loans                   | Loans                   | Loans container.
| COSMOS_DEVICESNAPSHOTS_CONTAINER_ID | DeviceSnapshots         | DeviceSnapshots         | DeviceSnapshots         | Device snapshots container.
| EVENTGRID_TOPIC_ENDPOINT          | Populate after deployment | Populate after deployment | Populate after deployment | Event Grid topic endpoint.
| EVENTGRID_TOPIC_KEY               | Populate after deployment | Populate after deployment | Populate after deployment | Event Grid access key.
| ENVIRONMENT                       | dev                     | test                    | prod                    | Environment identifier.

### .env.* templates at a glance

| Setting                           | Dev value                       | Test value                      | Prod value                      | Notes                                   |
|-----------------------------------|---------------------------------|---------------------------------|---------------------------------|-----------------------------------------|
| ENVIRONMENT                       | dev                             | test                            | prod                            | Environment name.
| FUNCTIONS_WORKER_RUNTIME          | Configured                      | Configured                      | Configured                      | Always `node`.
| AZURE_STORAGE_CONNECTION_STRING   | Populate after deployment       | Populate after deployment       | Populate after deployment       | Storage account connection string.
| COSMOS_DB_ENDPOINT                | Populate after deployment       | Populate after deployment       | Populate after deployment       | Cosmos DB endpoint URL.
| COSMOS_DB_KEY                     | Populate after deployment       | Populate after deployment       | Populate after deployment       | Cosmos DB key.
| COSMOS_DB_DATABASE                | DeviceLoanDB                    | DeviceLoanDB                    | DeviceLoanDB                    | Shared database name.
| COSMOS_DB_CONTAINER               | Loans                           | Loans                           | Loans                           | Loans container.
| COSMOS_DEVICESNAPSHOTS_CONTAINER_ID | DeviceSnapshots                 | DeviceSnapshots                 | DeviceSnapshots                 | Device snapshots container.
| APPLICATIONINSIGHTS_CONNECTION_STRING | Populate after deployment    | Populate after deployment       | Populate after deployment       | App Insights connection string.
| EVENTGRID_TOPIC_ENDPOINT          | Populate after deployment       | Populate after deployment       | Populate after deployment       | Event Grid topic endpoint.
| EVENTGRID_TOPIC_KEY               | Populate after deployment       | Populate after deployment       | Populate after deployment       | Event Grid key.
| FUNCTION_APP_NAME                 | func-deviceloan-dev-Ab07        | func-deviceloan-test-Ab07       | func-deviceloan-prod-Ab07       | Azure Function App name.
| COSMOS_ACCOUNT_NAME               | cosmos-deviceloan-dev-Ab07      | cosmos-deviceloan-test-Ab07     | cosmos-deviceloan-prod-Ab07     | Cosmos DB account name.
| STORAGE_ACCOUNT_NAME              | stdevloandevAb07                | stdevloantestAb07               | stdevloanprodAb07               | Storage account name.
| RESOURCE_GROUP                    | deviceloan-dev-Ab07-rg          | deviceloan-test-Ab07-rg         | deviceloan-prod-Ab07-rg         | Resource group name.

Configured = value stored in the repository.

Populate after deployment = value injected by `./Deployment/populate-all-envs.sh` once Azure resources are provisioned.

Run `./Deployment/switch-env.sh <env>` to copy the chosen environment into `.env` and `local.settings.json`.

## Scripts

All deployment and environment management scripts are in the `Deployment/` folder:

| Script | Purpose |
|--------|---------|
| `deploy-all.sh` | Deploy infrastructure to all 3 environments |
| `deploy.sh <env>` | Deploy infrastructure to specific environment |
| `populate-all-envs.sh` | Fetch and populate credentials from Azure |
| `switch-env.sh <env>` | Switch between dev/test/prod environments |
| `validate-configs.sh` | Validate all configuration files |
| `get-connection-strings.sh` | Get connection strings for an environment |

## Azure Resources

### DEV Environment
- Resource Group: `deviceloan-dev-Ab07-rg`
- Cosmos DB: `cosmos-deviceloan-dev-ab07`
- Event Grid Topic: `evgt-deviceloan-dev-Ab07`
- Storage: `stdevloandevab07`
- App Insights: `appi-deviceloan-dev-Ab07`

### TEST Environment
- Resource Group: `deviceloan-test-Ab07-rg`
- Function App: `func-deviceloan-test-Ab07`
- Cosmos DB: `cosmos-deviceloan-test-ab07`
- Event Grid Topic: `evgt-deviceloan-test-Ab07`
- Storage: `stdevloantestab07`
- App Insights: `appi-deviceloan-test-Ab07`

### PROD Environment
- Resource Group: `deviceloan-prod-Ab07-rg`
- Function App: `func-deviceloan-prod-Ab07`
- Cosmos DB: `cosmos-deviceloan-prod-ab07`
- Event Grid Topic: `evgt-deviceloan-prod-Ab07`
- Storage: `stdevloanprodab07`
- App Insights: `appi-deviceloan-prod-Ab07`

## Development Workflow

1. **Local Development** - Run on localhost with DEV Azure resources
2. **Deploy to TEST** - Test integration in TEST environment
3. **Deploy to PROD** - Production deployment after testing

## Documentation

- **API-DOCS.md** - Complete API endpoint documentation
- **CONFIG-SUMMARY.md** - Configuration summary for all environments
- **Deployment/README.md** - Infrastructure deployment guide

## License

Internal campus project - All rights reserved
