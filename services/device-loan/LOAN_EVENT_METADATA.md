# Loan Service Event Metadata

## Overview

All loan events published to Event Grid now include complete metadata so the **Confirmation Service** (and other subscribers) can display rich information without additional API calls.

## Event Metadata Structure

All loan events include the full `LoanRecord` object with these fields:

### Core Fields
- `id` - Loan UUID
- `userId` - User/Student ID
- `deviceId` - Device UUID
- `reservationId` - Optional reservation reference
- `status` - Current loan status (Pending, Active, Cancelled, Waitlisted, etc.)
- `startDate` - Loan start timestamp (ISO 8601)
- `dueDate` - Loan due date timestamp (ISO 8601)
- `createdAt` - Record creation timestamp
- `updatedAt` - Last update timestamp

### 🎯 Display Metadata (For Confirmation Service)
- **`deviceBrand`** - Device brand name (e.g., "Apple", "Dell", "HP")
- **`deviceModel`** - Device model name (e.g., "MacBook Pro 16", "Latitude 5420")
- **`userEmail`** - User's email address (fetched from Auth0)

### Optional Fields
- `cancelledAt` - Cancellation timestamp (if cancelled)
- `returnedAt` - Return timestamp (if returned)
- `notes` - Additional notes

## Events Published

### 1. Loan.Created
**When**: Student creates a loan request for an available device  
**Status**: `Pending`  
**Payload**: Complete `LoanRecord` with all metadata

```json
{
  "eventType": "Loan.Created",
  "data": {
    "id": "loan-uuid",
    "userId": "auth0|123456",
    "deviceId": "device-uuid",
    "reservationId": "reservation-uuid",
    "deviceBrand": "Apple",
    "deviceModel": "MacBook Pro 16",
    "userEmail": "student@university.edu",
    "status": "Pending",
    "startDate": "2025-12-13T10:00:00Z",
    "dueDate": "2025-12-15T10:00:00Z",
    "createdAt": "2025-12-13T10:00:00Z",
    "updatedAt": "2025-12-13T10:00:00Z"
  }
}
```

### 2. Loan.Activated
**When**: Reservation is confirmed and loan becomes active  
**Status**: `Active`  
**Payload**: Complete `LoanRecord` with all metadata

```json
{
  "eventType": "Loan.Activated",
  "data": {
    "id": "loan-uuid",
    "userId": "auth0|123456",
    "deviceId": "device-uuid",
    "deviceBrand": "Apple",
    "deviceModel": "MacBook Pro 16",
    "userEmail": "student@university.edu",
    "status": "Active",
    "startDate": "2025-12-13T10:00:00Z",
    "dueDate": "2025-12-15T10:00:00Z",
    "createdAt": "2025-12-13T10:00:00Z",
    "updatedAt": "2025-12-13T10:15:00Z"
  }
}
```

### 3. Loan.Cancelled
**When**: Student cancels their loan before pickup  
**Status**: `Cancelled`  
**Payload**: Complete `LoanRecord` with `cancelledAt` timestamp

```json
{
  "eventType": "Loan.Cancelled",
  "data": {
    "id": "loan-uuid",
    "userId": "auth0|123456",
    "deviceId": "device-uuid",
    "deviceBrand": "Dell",
    "deviceModel": "Latitude 5420",
    "userEmail": "student@university.edu",
    "status": "Cancelled",
    "cancelledAt": "2025-12-13T11:00:00Z",
    "createdAt": "2025-12-13T10:00:00Z",
    "updatedAt": "2025-12-13T11:00:00Z"
  }
}
```

### 4. Loan.Waitlisted
**When**: Student requests a device that's currently unavailable  
**Status**: `Waitlisted`  
**Payload**: Complete `LoanRecord` + `message` field

```json
{
  "eventType": "Loan.Waitlisted",
  "data": {
    "id": "loan-uuid",
    "userId": "auth0|123456",
    "deviceId": "device-uuid",
    "deviceBrand": "Apple",
    "deviceModel": "iPad Pro 12.9",
    "userEmail": "student@university.edu",
    "status": "Waitlisted",
    "message": "Device Apple iPad Pro 12.9 is currently unavailable. Request added to waitlist.",
    "createdAt": "2025-12-13T10:00:00Z",
    "updatedAt": "2025-12-13T10:00:00Z"
  }
}
```

### 5. Loan.WaitlistProcessed
**When**: Device becomes available and waitlisted request is promoted  
**Status**: Changes from `Waitlisted` → `Pending`  
**Payload**: Complete `LoanRecord` + status change info

```json
{
  "eventType": "Loan.WaitlistProcessed",
  "data": {
    "id": "loan-uuid",
    "userId": "auth0|123456",
    "deviceId": "device-uuid",
    "deviceBrand": "Apple",
    "deviceModel": "iPad Pro 12.9",
    "userEmail": "student@university.edu",
    "status": "Pending",
    "previousStatus": "Waitlisted",
    "newStatus": "Pending",
    "message": "Device Apple iPad Pro 12.9 is now available for your loan request",
    "createdAt": "2025-12-13T10:00:00Z",
    "updatedAt": "2025-12-13T12:00:00Z"
  }
}
```

## Confirmation Service Integration

The Confirmation Service can now display rich information:

### Email Templates
```
Hi {userEmail},

Your loan request for {deviceBrand} {deviceModel} has been {status}.

Loan Details:
- Device: {deviceBrand} {deviceModel}
- Loan ID: {id}
- Due Date: {dueDate}

Thank you!
```

### Display Cards
```
┌─────────────────────────────────────┐
│  Apple MacBook Pro 16               │
│  student@university.edu             │
│  Status: Active                     │
│  Due: Dec 15, 2025                  │
└─────────────────────────────────────┘
```

## Benefits

✅ **No Additional API Calls** - All display data in one event  
✅ **Consistent Data** - Same structure across all events  
✅ **Rich User Experience** - Show brand names and emails directly  
✅ **Reduced Latency** - No need to query Auth0 or Catalog Service  
✅ **Better Notifications** - Personalized emails with complete context

## Data Flow

```
Loan Service                Event Grid              Confirmation Service
    │                           │                           │
    ├─ Create Loan              │                           │
    │  - Fetch device brand     │                           │
    │  - Fetch user email       │                           │
    ├─ Build LoanRecord         │                           │
    │  with metadata            │                           │
    │                           │                           │
    ├─ Publish Loan.Created ────┤                           │
    │  (full metadata)          │                           │
    │                           ├─ Route Event ─────────────┤
    │                           │                           │
    │                           │                    ✅ Display:
    │                           │                     - Device: Apple MacBook Pro 16
    │                           │                     - User: student@university.edu
    │                           │                     - Send email notification
```

## Implementation Details

### Source Files
- **LoanRecord Entity**: `/src/Domain/Entities/LoanRecord.ts` - Includes `deviceBrand`, `deviceModel`, `userEmail`
- **CreateLoanUseCase**: `/src/Application/UseCases/CreateLoanUseCase.ts` - Fetches and populates metadata
- **Event Publisher**: `/src/Infrastructure/EventGrid/LoanEventPublisher.ts` - Publishes complete loan records
- **All Use Cases**: Ensure metadata is included in every event

### Metadata Population
1. **Device Metadata**: Retrieved from `DeviceSnapshotRepository.getSnapshot(deviceId)`
2. **User Email**: Fetched from Auth0 via `Auth0UserService.getUserEmail(userId, accessToken)`
3. **Stored in LoanRecord**: Denormalized for fast access and event publishing
4. **Updated on Waitlist Processing**: Ensures old records get metadata backfilled

## Testing

### Verify Event Metadata
```bash
# Create a loan and check the published event
curl -X POST https://deviceloan-dev-ab07-func.azurewebsites.net/api/loans \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "userId": "auth0|123",
    "deviceId": "device-uuid"
  }'

# Check Event Grid metrics to verify event was published
az monitor metrics list \
  --resource /subscriptions/.../deviceloan-dev-ab07-topic \
  --metric-names PublishSuccessCount

# Check Confirmation Service logs for received metadata
az functionapp logs tail -n deviceconfirmation-dev-ab07-func
```

## Related Documentation
- [Event Grid Setup](EVENT_GRID_SETUP.md)
- [Loan Service README](README.md)
