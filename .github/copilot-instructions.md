# GitHub Copilot Instructions: Campus Device Loan

## Project Overview

This is a **Campus Device Loan System** built with **Azure Functions v4** (Node.js), TypeScript, and **Azure Cosmos DB**. The current service (`device-catalog`) manages device inventory using Clean Architecture patterns.

## Architecture

### Clean Architecture Layers (services/device-catalog/src/)

```
API/functions/          → Azure Functions HTTP endpoints (GetDevices, GetDeviceById)
Application/            → Use case handlers and repository interfaces
  ├── UseCases/         → Business logic handlers (ListDevicesHandler, GetDeviceByIdHandler)
  └── Interfaces/       → Repository contracts (IDeviceRepository)
Domain/                 → Core business entities and enums
  ├── Entities/         → Domain models (Device)
  └── Enums/            → Value objects (DeviceCategory, DeviceBrand)
Infrastructure/         → External integrations
  └── Persistence/      → Data access implementations (CosmosDeviceRepository)
```

**Key Pattern**: Functions instantiate repositories and handlers directly (no DI container). Each handler receives a repository via constructor injection.

### Data Flow

1. **HTTP Request** → Azure Function (`GetDevices`, `GetDeviceById`)
2. **Function** instantiates → `CosmosDeviceRepository` → `UseCaseHandler`
3. **Handler** executes business logic → returns domain `Device[]` or `Device`
4. **Function** wraps result in `HttpResponseInit` with status/jsonBody

## Critical Developer Workflows

### Building & Running

```bash
cd services/device-catalog

# Clean, build, and start (for local Azure Functions runtime)
npm run prestart  # runs: clean → build
npm start         # starts Azure Functions Core Tools

# Watch mode (auto-rebuild on changes)
npm run watch     # tsc -w

# Seed database
npm run seed      # runs tools/seed.ts via ts-node
```

**Important**: `npm run seed` requires Cosmos DB credentials in `local.settings.json` (see below).

### Environment Configuration

File: `services/device-catalog/local.settings.json`

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "COSMOS_ENDPOINT": "https://<your-account>.documents.azure.com:443/",
    "COSMOS_KEY": "<your-primary-key>",
    "COSMOS_DB": "deviceCatalogDb",
    "COSMOS_CONTAINER": "devices"
  }
}
```

- Azure Functions runtime reads this automatically
- `tools/seed.ts` loads it programmatically via `fs.readFileSync` + `process.env`
- **Never commit real keys**; use Azure Key Vault references in production

### Common Issues & Solutions

#### "File '...' is not a module" (TS2306)

**Cause**: TypeScript source files were empty (0 bytes) or lacked exports.  
**Fix**: Ensure all `.ts` files have proper `export` statements:
```typescript
export class Device { ... }
export enum DeviceBrand { ... }
```

#### "Missing Cosmos configuration" when running seed

**Cause**: `local.settings.json` missing or env vars not loaded.  
**Fix**: `tools/seed.ts` now loads `local.settings.json` automatically; verify file exists and has `COSMOS_*` keys.

#### Authentication token errors

**Cause**: Cosmos DB key expired or invalid.  
**Fix**: Regenerate primary key in Azure Portal → Cosmos DB account → Keys.

## Project-Specific Conventions

### TypeScript Configuration

- **Module System**: CommonJS (`"module": "commonjs"`)
- **Target**: ES6
- **Strict Mode**: Disabled (`"strict": false`)
- **Root Dir**: `.` (includes both `src/` and `tools/`)

### Naming Conventions

- **Entities**: PascalCase classes (`Device`)
- **Enums**: PascalCase with string values (`DeviceCategory.Laptop = "Laptop"`)
- **Handlers**: `<Action>Handler` suffix (`ListDevicesHandler`)
- **Repositories**: `<Technology><Entity>Repository` (`CosmosDeviceRepository`)
- **Functions**: PascalCase matching use case (`GetDevices`, `GetDeviceById`)

### Domain Model

**Device Entity**:
```typescript
{
  id: string;           // Partition key in Cosmos DB
  brand: DeviceBrand;   // Enum: Dell, HP, Apple, Canon, Logitech, Sony, Other
  model: string;
  category: DeviceCategory; // Enum: Laptop, Tablet, Camera, Microphone, Accessory, Other
  description: string;
  availableCount: number;
}
```

**Cosmos DB Container**:
- Partition key: `/id`
- Item ID = partition key (point reads)

### Repository Pattern

All repositories implement `IDeviceRepository`:
```typescript
listAll(): Promise<Device[]>;
getById(id: string): Promise<Device | null>;
```

Implementations:
- Map raw Cosmos items → `Device` instances
- Handle null/undefined with defaults (`DeviceBrand.Other`, `description || "No description"`)
- Use try-catch for `getById` to return `null` on errors

## Integration Points

### Azure Functions v4 (Programming Model v4)

- **Registration**: `app.http("FunctionName", { ... })` in each function file
- **Handler Signature**: `(req: HttpRequest, ctx: InvocationContext) => Promise<HttpResponseInit>`
- **Route Parameters**: Access via `req.params["paramName"]`
- **Logging**: Use `ctx.log()`, `ctx.error()` for Application Insights integration

### Azure Cosmos DB SDK (@azure/cosmos v4.6)

- **Client Initialization**: `new CosmosClient({ endpoint, key })`
- **Database/Container Access**: `client.database(dbName).container(containerName)`
- **CRUD Operations**:
  - Read all: `container.items.query("SELECT * FROM c").fetchAll()`
  - Read by ID: `container.item(id, partitionKey).read()`
  - Upsert: `container.items.upsert(item)`

## Tasks & Build System

VS Code tasks (`.vscode/tasks.json`):

- `npm watch (functions)` → Default build task (background)
- `func: host start` → Starts Azure Functions runtime (depends on watch)
- `npm build (functions)` → One-time TypeScript compilation

Use **Tasks: Run Task** or **Tasks: Run Build Task** from Command Palette.

## Testing & Debugging

- **No unit tests currently** (placeholder: `npm test`)
- **Local Testing**: Use `npm start` + tools like Postman/curl
  - GET `http://localhost:7071/api/GetDevices`
  - GET `http://localhost:7071/api/GetDeviceById/{id}`

## Future Extensibility

To add new device operations:

1. **Domain**: Add method to `IDeviceRepository` interface
2. **Infrastructure**: Implement in `CosmosDeviceRepository`
3. **Application**: Create new handler in `UseCases/`
4. **API**: Add Azure Function in `functions/` that wires up handler

**Example**: Adding `UpdateDevice`:
```typescript
// 1. IDeviceRepository
update(device: Device): Promise<void>;

// 2. CosmosDeviceRepository
async update(device: Device) { 
  await this.container.item(device.id, device.id).replace(device); 
}

// 3. Application/UseCases/UpdateDeviceHandler.ts
export class UpdateDeviceHandler { ... }

// 4. API/functions/UpdateDevice.ts
app.http("UpdateDevice", { methods: ["PUT"], ... });
```

---

**Last Updated**: 2025-10-21  
**Key Files to Reference**:
- Architecture: `src/Application/Interfaces/IDeviceRepository.ts`
- Entities: `src/Domain/Entities/Device.ts`
- Example Function: `src/API/functions/GetDevices.ts`
- Seed Script: `tools/seed.ts`
