# Device Loan Service

Enterprise-grade campus device loan microservice built with Azure Functions, Cosmos DB, and Event Grid. This service manages the complete lifecycle of device loans for students, from reservation through return.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
- [Event Integration](#event-integration)
- [Authentication & Authorization](#authentication--authorization)
- [Deployment](#deployment)
- [Testing](#testing)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

## Overview

### Features

- ✅ **Device Loan Management**: Create, cancel, and track device loans
- ✅ **Event-Driven Architecture**: Real-time integration with Catalog, Reservation, and Confirmation services
- ✅ **Device Snapshot Sync**: Automatic synchronization of device information from catalog
- ✅ **Loan Status Tracking**: Complete lifecycle management (Pending → Active → Returned/Cancelled)
- ✅ **Overdue Loan Detection**: Automated timer-based overdue loan checks
- ✅ **Waitlist Support**: Automatic waitlist processing when devices become available
- ✅ **Secure Authentication**: Auth0-based JWT token validation
- ✅ **Comprehensive Testing**: Unit, integration, and concurrency tests with >40% coverage

### Tech Stack

- **Runtime**: Azure Functions v4 (Node.js 22.x)
- **Language**: TypeScript 5.x
- **Database**: Azure Cosmos DB (Serverless, NoSQL API)
- **Events**: Azure Event Grid
- **Authentication**: Auth0 (JWT tokens with RS256)
- **Monitoring**: Azure Application Insights
- **CI/CD**: GitHub Actions

## Architecture

### System Design

```
┌─────────────────────────────────────────────────────────────────┐
│                     Device Loan Service                          │
├─────────────────────────────────────────────────────────────────┤
│  HTTP Triggers                                                   │
│  ├─ POST   /api/loan/create         (Create new loan)          │
│  ├─ DELETE /api/loan/cancel         (Cancel loan)              │
│  ├─ GET    /api/loan/list           (List user loans)          │
│  ├─ GET    /api/loan/id/{id}        (Get loan details)         │
│  ├─ GET    /api/devices/list        (List device snapshots)    │
│  ├─ GET    /api/devices/id/{id}     (Get device snapshot)      │
│  ├─ POST   /api/admin/sync-devices  (Manual device sync)       │
│  └─ GET    /api/health              (Health check)             │
│                                                                  │
│  Event Grid Triggers                                             │
│  ├─ device-sync-event-grid          (Device updates)           │
│  ├─ reservation-events-http         (Reservation updates)      │
│  └─ confirmation-events-http        (Confirmation updates)     │
│                                                                  │
│  Timer Triggers                                                  │
│  ├─ sync-devices-timer              (Hourly device sync)       │
│  └─ check-overdue-loans-timer       (Daily overdue check)      │
└─────────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
  ┌─────────────┐   ┌──────────────────┐   ┌─────────────┐
  │  Cosmos DB  │   │   Event Grid     │   │   Auth0     │
  │   (NoSQL)   │   │  (Pub/Sub Bus)   │   │   (JWT)     │
  └─────────────┘   └──────────────────┘   └─────────────┘
```

### Cosmos DB Schema

**Container: Loans** (Partition Key: `/userId`)
```typescript
{
  id: string;              // Loan UUID
  loanId: string;          // Same as id (legacy compatibility)
  userId: string;          // Auth0 user ID (partition key)
  deviceId: string;        // Device UUID
  reservationId?: string;  // Optional reservation reference
  status: LoanStatus;      // Pending | Active | Cancelled | Returned | Waitlisted | Overdue
  deviceBrand: string;     // Device brand (e.g., "Apple", "Dell")
  deviceModel: string;     // Device model (e.g., "MacBook Pro 16")
  userEmail: string;       // User email from Auth0
  startDate: Date;         // Loan start date
  dueDate: Date;           // Loan due date
  createdAt: Date;         // Creation timestamp
  updatedAt: Date;         // Last update timestamp
  cancelledAt?: Date;      // Cancellation timestamp
  returnedAt?: Date;       // Return timestamp
  notes?: string;          // Additional notes
}
```

**Container: device-snapshots** (Partition Key: `/deviceId`)
```typescript
{
  id: string;              // Device UUID
  deviceId: string;        // Same as id (partition key)
  brand: string;           // Device brand
  model: string;           // Device model
  availableCount: number;  // Available devices
  maxDeviceCount: number;  // Total devices
  lastSyncedAt: Date;      // Last sync timestamp
}
```

### Event Flow

**Published Events:**
- `Loan.Created` - New loan request created
- `Loan.Activated` - Loan activated after confirmation
- `Loan.Cancelled` - Loan cancelled by user
- `Loan.Returned` - Loan returned by user
- `Loan.Overdue` - Loan marked as overdue

**Subscribed Events:**
- `Device.Snapshot` - Full device catalog sync from Catalog Service
- `Device.Created` - New device added to catalog
- `Device.Updated` - Device availability changed
- `Device.Deleted` - Device removed from catalog
- `Reservation.Confirmed` - Reservation confirmed by Reservation Service
- `CONFIRMATION_COLLECTED` - Device collected (from Confirmation Service)

## Prerequisites

### Development Tools
- **Node.js** 22.x or later
- **npm** 10.x or later
- **Azure CLI** 2.50.0 or later
- **Azure Functions Core Tools** v4

### Azure Resources
- Azure Subscription
- Resource Group per environment (dev, test, prod)
- Cosmos DB Account (Serverless)
- Event Grid Topic
- Application Insights

### Auth0 Configuration
- Auth0 Tenant
- Auth0 API configured with permissions
- Auth0 Application (SPA) configured

## Quick Start

### Local Development Setup

1. **Clone and navigate to project:**
```bash
cd /workspaces/campus-device-loan/services/device-loan
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure environment:**
```bash
cp local.settings.template.json local.settings.json
```

4. **Update `local.settings.json` with your values:**
```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "COSMOS_ENDPOINT": "https://your-cosmos.documents.azure.com:443/",
    "COSMOS_KEY": "your-cosmos-key",
    "COSMOS_DATABASE_ID": "DeviceLoanDB",
    "COSMOS_LOANS_CONTAINER_ID": "Loans",
    "COSMOS_DEVICESNAPSHOTS_CONTAINER_ID": "device-snapshots",
    "EVENT_GRID_TOPIC_ENDPOINT": "https://your-topic.region.eventgrid.azure.net/api/events",
    "EVENT_GRID_TOPIC_KEY": "your-event-grid-key",
    "AUTH0_DOMAIN": "your-tenant.auth0.com",
    "AUTH0_AUDIENCE": "https://deviceloan.yourcompany.com/api",
    "ENVIRONMENT": "dev"
  }
}
```

5. **Build and run:**
```bash
npm run build
npm start
```

Function App runs on: `http://localhost:7071`

### Deploy to Azure

**Using automated script:**
```bash
./deploy-all.sh
```

**Using GitHub Actions:**
- Push to `develop` branch → Auto-deploy to DEV + TEST
- Push to `main` branch → Auto-deploy to PROD (with approval)

## API Reference

Base URL:
- Local: `http://localhost:7071/api`
- DEV: `https://deviceloan-dev-ab07-func.azurewebsites.net/api`
- TEST: `https://deviceloan-test-ab07-func.azurewebsites.net/api`
- PROD: `https://deviceloan-prod-ab07-func.azurewebsites.net/api`

### Create Loan

Create a new device loan request.

**Endpoint:** `POST /api/loan/create`

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "userId": "auth0|123456789",
  "deviceId": "device-uuid-123",
  "reservationId": "reservation-uuid-456"  // Optional
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "loan-uuid-789",
    "userId": "auth0|123456789",
    "deviceId": "device-uuid-123",
    "reservationId": "reservation-uuid-456",
    "deviceBrand": "Apple",
    "deviceModel": "MacBook Pro 16",
    "userEmail": "student@university.edu",
    "status": "Pending",
    "startDate": "2025-12-23T10:00:00Z",
    "dueDate": "2025-12-25T10:00:00Z",
    "createdAt": "2025-12-23T10:00:00Z",
    "updatedAt": "2025-12-23T10:00:00Z"
  }
}
```

**Events Published:**
- `Loan.Created` - Notifies Reservation and Catalog services

---

### Cancel Loan

Cancel an existing loan (only if status is Pending).

**Endpoint:** `DELETE /api/loan/cancel`

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "loanId": "loan-uuid-789"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Loan cancelled successfully",
  "data": {
    "id": "loan-uuid-789",
    "status": "Cancelled",
    "cancelledAt": "2025-12-23T11:00:00Z"
  }
}
```

**Events Published:**
- `Loan.Cancelled` - Notifies Reservation and Catalog services

---

### List Loans

List all loans for the authenticated user.

**Endpoint:** `GET /api/loan/list?userId={userId}&status={status}&limit={limit}`

**Query Parameters:**
- `userId` (required) - User ID to filter loans
- `status` (optional) - Filter by status (Pending, Active, Cancelled, etc.)
- `limit` (optional) - Maximum number of results (default: 50)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "loan-uuid-789",
      "userId": "auth0|123456789",
      "deviceBrand": "Apple",
      "deviceModel": "MacBook Pro 16",
      "status": "Active",
      "startDate": "2025-12-23T10:00:00Z",
      "dueDate": "2025-12-25T10:00:00Z"
    }
  ],
  "count": 1
}
```

---

### Health Check

Check service health and status.

**Endpoint:** `GET /api/health`

**Response (200 OK):**
```json
{
  "status": "healthy",
  "timestamp": "2025-12-23T12:00:00.000Z",
  "service": "device-loan",
  "version": "1.0.0",
  "environment": "dev",
  "uptime": 3600.5,
  "correlationId": "abc-123-def-456"
}
```

## Event Integration

### Setting Up Event Grid Subscription

The service requires an Event Grid subscription from the Catalog Service to receive device updates.

**Using Azure Portal:**

1. Navigate to Catalog Service's Event Grid Topic
2. Click **+ Event Subscription**
3. Configure:
   - Name: `deviceloan-device-sync`
   - Event Schema: `Event Grid Schema`
   - Filter to Event Types: `Device.Created`, `Device.Updated`, `Device.Deleted`, `Device.Snapshot`
   - Endpoint Type: `Azure Function`
   - Function: `device-sync-event-grid`

**Using provided script:**
```bash
./create-reservation-subscription.sh
```

### Event Metadata

All published events include complete loan metadata:

```json
{
  "eventType": "Loan.Created",
  "subject": "/loans/loan-uuid-789",
  "eventTime": "2025-12-23T10:00:00Z",
  "data": {
    "id": "loan-uuid-789",
    "userId": "auth0|123456789",
    "deviceId": "device-uuid-123",
    "deviceBrand": "Apple",
    "deviceModel": "MacBook Pro 16",
    "userEmail": "student@university.edu",
    "status": "Pending",
    "startDate": "2025-12-23T10:00:00Z",
    "dueDate": "2025-12-25T10:00:00Z"
  }
}
```

This rich metadata allows subscribers (like Confirmation Service) to display information without additional API calls.

## Authentication & Authorization

### Auth0 Configuration

**1. Create Auth0 API:**
- Navigate to Auth0 Dashboard → Applications → APIs
- Create API with identifier: `https://deviceloan.yourcompany.com/api`
- Signing Algorithm: RS256

**2. Define Permissions:**
```
view:my-loans     - View your own loans
create:loan       - Create a new loan
cancel:loan       - Cancel your own loan
read:devices      - View device catalog
```

**3. Configure Environment Variables:**

```bash
# Local Development
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_AUDIENCE=https://deviceloan.yourcompany.com/api

# Azure (using Azure CLI)
az functionapp config appsettings set \
  --name deviceloan-dev-ab07-func \
  --resource-group deviceloan-dev-ab07-rg \
  --settings AUTH0_DOMAIN="your-tenant.auth0.com" \
             AUTH0_AUDIENCE="https://deviceloan.yourcompany.com/api"
```

**4. Frontend Integration:**

Your frontend must request access tokens (not ID tokens) with the correct audience:

```typescript
// React example with @auth0/auth0-react
<Auth0Provider
  domain="your-tenant.auth0.com"
  clientId="YOUR_CLIENT_ID"
  authorizationParams={{
    redirect_uri: window.location.origin,
    audience: "https://deviceloan.yourcompany.com/api",
    scope: "view:my-loans create:loan cancel:loan read:devices"
  }}
>
```

## Deployment

### Environments

| Environment | Branch | Deployment | Approval Required |
|-------------|--------|-----------|-------------------|
| DEV | `develop` | Automatic | No |
| TEST | `develop` | Automatic (after DEV) | No |
| PROD | `main` | Automatic | Yes (Reviewer) |

### CI/CD Pipeline

**GitHub Actions Workflow:**

```yaml
develop branch push:
  → Build & Test
  → Deploy to DEV
  → Deploy to TEST (after DEV succeeds)

main branch push:
  → Build & Test
  → Deploy to PROD (waits for reviewer approval)
```

### Manual Deployment

```bash
# Build
npm run build

# Deploy using Azure Functions Core Tools
func azure functionapp publish deviceloan-dev-ab07-func --typescript
```

### Infrastructure as Code

Infrastructure is defined in `/Deployment/main.bicep`:

```bash
# Deploy infrastructure
az deployment group create \
  --resource-group deviceloan-dev-ab07-rg \
  --template-file Deployment/main.bicep \
  --parameters environment=dev
```

## Testing

### Quick Start

```bash
# All tests
npm test

# With coverage report
npm run test:coverage

# Watch mode (for development)
npm run test:watch

# Specific test suites
npm run test:unit              # Unit tests only
npm run test:integration       # Integration tests only
npm run test:concurrency       # Concurrency tests only
```

### Coverage Thresholds

The project maintains minimum coverage requirements:
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

Current coverage: **44.59%** statement coverage

### Viewing Coverage Reports

After running `npm run test:coverage`, open `./coverage/index.html` in your browser to view the detailed HTML coverage report.

### CI/CD Integration

Tests run automatically on:
- Push to `main`, `develop`, or `Develop` branches
- Pull requests to these branches
- Manual workflow dispatch

Coverage reports are uploaded to Codecov and attached to GitHub Actions artifacts.

### Test Categories

**Unit Tests** (`tests/unit/`):
- Domain entity validation and business rules
- Use case logic with mocked dependencies
- Authorization checks
- Error handling scenarios

**Integration Tests** (`tests/integration/`):
- Complete loan lifecycle workflows (create → activate → return)
- Multi-user scenarios
- Event-driven workflows
- Data consistency verification

**Concurrency Tests** (`tests/concurrency/`):
- Race conditions on shared resources
- Concurrent loan creation
- Idempotency verification
- High-load scenarios

### Mocking Strategy

All tests use in-memory mocks - no external dependencies required:
- `MockLoanRepository` - Simulates Cosmos DB operations
- `MockDeviceSnapshotRepository` - Device catalog simulation
- `MockLoanEventPublisher` - Event Grid simulation
- `MockUserService` - Auth0 user service simulation

### Test Structure

```
tests/
├── unit/                    # Unit tests for individual components
│   ├── domain/             # Domain entity tests
│   ├── repositories/       # Repository tests
│   └── useCases/           # Use case tests
├── integration/            # Integration tests
│   └── LoanWorkflow.integration.test.ts
├── concurrency/            # Concurrency and race condition tests
│   ├── ConcurrentLoanCreation.test.ts
│   ├── DatabaseConcurrency.test.ts
│   └── IdempotencyTests.test.ts
├── mocks/                  # Mock implementations
│   ├── MockDeviceSnapshotRepository.ts
│   ├── MockLoanRepository.ts
│   ├── MockLoanEventPublisher.ts
│   └── MockUserService.ts
└── fixtures/               # Test data fixtures
```

### Example Test

```typescript
describe('CreateLoanUseCase', () => {
  it('should create loan successfully when device is available', async () => {
    const useCase = new CreateLoanUseCase(
      mockLoanRepo,
      mockDeviceRepo,
      mockEventPublisher,
      mockUserService
    );

    const result = await useCase.execute({
      userId: 'user-123',
      deviceId: 'device-456'
    });

    expect(result.success).toBe(true);
    expect(result.data.status).toBe(LoanStatus.Pending);
  });
});
```

## Monitoring

### Application Insights

All functions are instrumented with Application Insights for:
- Request telemetry
- Dependency tracking
- Exception logging
- Custom events

### Key Metrics

- **Loan Creation Rate**: Number of loans created per hour
- **Cancellation Rate**: Percentage of loans cancelled
- **Overdue Loans**: Number of loans past due date
- **Event Processing**: Event Grid trigger success rate
- **API Response Time**: Average response time per endpoint

### Email Notifications

The service sends email notifications via SendGrid for important events:

**Implemented Notifications:**
- ✅ **Waitlist Processed**: Automatic notification when device becomes available and waitlisted user is moved to Pending status

**Configuration:**

Add SendGrid settings to each Azure Function App environment:

```bash
# Using Azure CLI
az functionapp config appsettings set \
  --name deviceloan-{env}-ab07-func \
  --resource-group CampusDeviceLender-{env}-Ab07-rg \
  --settings \
    SENDGRID_API_KEY="your-sendgrid-api-key" \
    SENDGRID_FROM_EMAIL="noreply@campusdeviceloan.com"
```

Or via Azure Portal: Settings → Configuration → New application setting

**Sender Email Verification:**
1. Go to SendGrid Dashboard → Settings → Sender Authentication
2. Verify your sender email (`noreply@campusdeviceloan.com`)
3. Complete domain authentication for production use

### Logs

**View logs locally:**
```bash
func start
```

**View logs in Azure:**
```bash
az monitor app-insights query \
  --app deviceloan-dev-ab07-insights \
  --analytics-query "traces | where timestamp > ago(1h) | project timestamp, message"
```

**Centralized Logging:**

For centralized logging across all services (Catalog, Loan, Confirmation, Reservation), see [CENTRAL-LOGGING.md](../../../CENTRAL-LOGGING.md) at the repository root.

## Troubleshooting

### Common Issues

**1. 401 Unauthorized Errors**

**Symptoms:** API returns 401 even with valid token

**Causes:**
- Missing `AUTH0_DOMAIN` or `AUTH0_AUDIENCE` environment variables
- Frontend requesting ID token instead of access token
- Token missing required scopes

**Solution:**
- Verify environment variables are set
- Ensure frontend requests access token with correct audience
- Check token has required permissions in Auth0 API

---

**2. Device Snapshots Not Syncing**

**Symptoms:** Device data is stale or missing

**Causes:**
- Missing Event Grid subscription
- Event Grid subscription misconfigured
- Catalog Service not publishing events

**Solution:**
```bash
# Check subscription exists
az eventgrid event-subscription list \
  --source-resource-id $(az eventgrid topic show \
    --name evgt-devicecatalog-dev-Ab07 \
    --resource-group devicecatalog-dev-Ab07-rg \
    --query id -o tsv)

# Create subscription if missing
./create-event-grid-subscription.sh
```

---

**3. Loans Not Activating**

**Symptoms:** Loans stuck in "Pending" status after confirmation

**Causes:**
- `CONFIRMATION_COLLECTED` event not received
- Missing `reservationId` in loan record
- Event handler error

**Solution:**
- Verify `reservationId` is set when loan is created
- Check Application Insights for event processing errors
- Ensure `confirmation-events-http` function is deployed

---

**4. Cosmos DB Connection Errors**

**Symptoms:** 500 errors with Cosmos DB connection timeouts

**Causes:**
- Invalid Cosmos DB credentials
- Network/firewall issues
- Resource not found

**Solution:**
```bash
# Test connection
az cosmosdb check-name-exists --name your-cosmos-account

# Regenerate keys if needed
az cosmosdb keys list \
  --name your-cosmos-account \
  --resource-group deviceloan-dev-ab07-rg
```

---

## Project Structure

```
services/device-loan/
├── src/
│   ├── API/
│   │   └── functions/          # Azure Function definitions
│   ├── Application/
│   │   ├── Dtos/              # Data Transfer Objects
│   │   ├── Handlers/          # Request handlers
│   │   ├── Interfaces/        # Service interfaces
│   │   └── UseCases/          # Business logic use cases
│   ├── Domain/
│   │   ├── Entities/          # Domain entities
│   │   └── Enums/             # Domain enums
│   ├── Infrastructure/
│   │   ├── Auth/              # Auth0 integration
│   │   ├── Config/            # Configuration factories
│   │   ├── EventGrid/         # Event Grid publishers/subscribers
│   │   ├── Logging/           # Logging utilities
│   │   ├── Models/            # Data models
│   │   ├── Observability/     # Monitoring
│   │   ├── Persistence/       # Cosmos DB repositories
│   │   └── Users/             # User service
│   ├── appServices.ts         # Dependency injection
│   └── functionApp.ts         # Function app registration
├── tests/                     # Test suites
├── Deployment/
│   └── main.bicep            # Infrastructure as Code
├── .github/
│   └── workflows/
│       └── device-loan.yml   # CI/CD pipeline
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
```

---

## Contributing

### Code Style

- Use TypeScript strict mode
- Follow ESLint configuration
- Add JSDoc comments for public APIs
- Write tests for new features

### Pull Request Process

1. Create feature branch from `develop`
2. Implement changes with tests
3. Ensure all tests pass: `npm test`
4. Create PR to `develop` branch
5. After review and merge, changes auto-deploy to DEV/TEST
6. Create PR from `develop` to `main` for production release

---

## License

Copyright © 2025 Campus Device Loan System
