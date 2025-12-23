# Loan Status Update Flow - Event Integration

## Problem Fixed

The loan service was not updating loan status from **Pending → Active** when devices were collected because:
1. ❌ Loans were created without `reservationId`
2. ❌ `Reservation.Confirmed` events were not properly handled
3. ❌ `CONFIRMATION_COLLECTED` events couldn't find loans by reservationId

## Corrected Event Flow

```
┌─────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│  Loan Service   │         │ Reservation Svc  │         │ Confirmation Svc │
└─────────────────┘         └──────────────────┘         └──────────────────┘
        │                            │                            │
        │ 1. POST /api/loans         │                            │
        ├──────────────────────►     │                            │
        │    (userId, deviceId)      │                            │
        │                            │                            │
        │ 2. Create Loan             │                            │
        │    status: Pending         │                            │
        │    reservationId: null     │                            │
        │                            │                            │
        │ 3. Publish                 │                            │
        │    Loan.Created ───────────┼───────────►                │
        │    (loanId, userId,        │                            │
        │     deviceId)              │                            │
        │                            │                            │
        │                            │ 4. Create Reservation      │
        │                            │    (loanId, deviceId)      │
        │                            │                            │
        │                            │ 5. Publish                 │
        │   ◄────────────────────────┼─── Reservation.Confirmed  │
        │   (reservationId, loanId)  │                            │
        │                            │                            │
        │ 6. Update Loan             │                            │
        │    reservationId: "xxx"    │                            │
        │    status: STILL Pending   │                            │
        │                            │                            │
        │                            │                            │ Staff Action:
        │                            │                            │ Mark as Collected
        │                            │                            │       │
        │   ◄────────────────────────┼────────────────────────────┤       ▼
        │   CONFIRMATION_COLLECTED   │                            │ 7. Publish
        │   (reservationId)          │                            │    Event
        │                            │                            │
        │ 8. Update Loan             │                            │
        │    status: Pending → Active│                            │
        │    ✅ Loan now ACTIVE      │                            │
        │                            │                            │
        │                            │                            │ Staff Action:
        │                            │                            │ Mark as Returned
        │                            │                            │       │
        │   ◄────────────────────────┼────────────────────────────┤       ▼
        │   CONFIRMATION_RETURNED    │                            │ 9. Publish
        │   (reservationId)          │                            │    Event
        │                            │                            │
        │ 10. Update Loan            │                            │
        │     status: Active → Returned                           │
        │     returnedAt: timestamp  │                            │
        │     ✅ Loan COMPLETED      │                            │
        │                            │                            │
```

## Event Subscriptions

### 1. Reservation Events
**Endpoint**: `/api/events/reservations`  
**Purpose**: Link loans with reservations

#### Reservation.Confirmed
- **When**: Reservation service creates a reservation for a loan
- **Action**: Update loan with `reservationId` (status stays Pending)
- **Handler**: `LinkReservationUseCase`

```json
{
  "eventType": "Reservation.Confirmed",
  "data": {
    "reservationId": "reservation-uuid",
    "loanId": "loan-uuid",
    "userId": "auth0|123",
    "deviceId": "device-uuid"
  }
}
```

### 2. Confirmation Events
**Endpoint**: `/api/events/confirmations`  
**Purpose**: Update loan status based on physical device handoff

#### CONFIRMATION_COLLECTED
- **When**: Staff marks device as collected by student
- **Action**: Update loan status from Pending → Active
- **Handler**: `ActivateLoanUseCase`

```json
{
  "actionType": "CONFIRMATION_COLLECTED",
  "reservationId": "reservation-uuid",
  "deviceId": "device-uuid",
  "staffId": "auth0|staff123",
  "timestamp": "2025-12-13T10:00:00Z",
  "notes": "Device collected by student"
}
```

#### CONFIRMATION_RETURNED
- **When**: Staff marks device as returned
- **Action**: Update loan status from Active → Returned
- **Handler**: `confirmation-events-http` (inline)

```json
{
  "actionType": "CONFIRMATION_RETURNED",
  "reservationId": "reservation-uuid",
  "deviceId": "device-uuid",
  "staffId": "auth0|staff123",
  "timestamp": "2025-12-13T12:00:00Z",
  "notes": "Device returned in good condition"
}
```

## Loan Status Lifecycle

```
┌─────────┐   Reservation.Confirmed   ┌─────────┐
│ CREATED │──────────────────────────►│ PENDING │
└─────────┘   (adds reservationId)    └─────────┘
                                            │
                                            │ CONFIRMATION_COLLECTED
                                            ▼
                                       ┌────────┐
                                       │ ACTIVE │
                                       └────────┘
                                            │
                                            │ CONFIRMATION_RETURNED
                                            ▼
                                      ┌──────────┐
                                      │ RETURNED │
                                      └──────────┘
```

## Implementation Details

### New Use Case: LinkReservationUseCase
**File**: `/src/Application/UseCases/LinkReservationUseCase.ts`

```typescript
export class LinkReservationUseCase {
  async execute(evt: ReservationEventDTO) {
    const loan = await this.loanRepo.getById(evt.loanId);
    
    // Add reservationId to link with reservation system
    loan.reservationId = evt.reservationId;
    loan.updatedAt = new Date().toISOString();
    
    await this.loanRepo.update(loan);
    return loan;
  }
}
```

### Updated: ActivateLoanUseCase
**File**: `/src/Application/UseCases/ActivateLoanUseCase.ts`

```typescript
export class ActivateLoanUseCase {
  async execute(evt: ReservationEventDTO) {
    // Find loan by reservationId (must be set from Reservation.Confirmed)
    const loan = await this.loanRepo.getByReservation(evt.reservationId);
    
    // Change status from Pending to Active
    loan.status = LoanStatus.Active;
    loan.updatedAt = new Date().toISOString();
    
    await this.loanRepo.update(loan);
    
    // Publish event for confirmation service
    await this.eventPublisher.publish("Loan.Activated", loan);
    
    return loan;
  }
}
```

### Updated: reservation-events-http
**File**: `/src/API/functions/reservation-events-http.ts`

Now properly handles `Reservation.Confirmed` by calling `LinkReservationUseCase` to update the loan with the reservationId.

### Updated: confirmation-events-http
**File**: `/src/API/functions/confirmation-events-http.ts`

Handles both:
- `CONFIRMATION_COLLECTED` → Calls `ActivateLoanUseCase` to set status to Active
- `CONFIRMATION_RETURNED` → Updates loan status to Returned and processes waitlist

## Event Grid Subscriptions Required

### For Loan Service

1. **Subscribe to Reservation Service Topic**
   ```bash
   Source Topic: devicereservation-{env}-ab07-topic
   Destination: deviceloan-{env}-ab07-func/reservation-events-http
   Event Types: Reservation.Confirmed, Reservation.Cancelled
   ```

2. **Subscribe to Confirmation Service Topic**
   ```bash
   Source Topic: deviceconfirmation-{env}-ab07-topic
   Destination: deviceloan-{env}-ab07-func/confirmation-events-http
   Event Types: CONFIRMATION_COLLECTED, CONFIRMATION_RETURNED
   ```

## Testing the Flow

### 1. Create a Loan
```bash
curl -X POST https://deviceloan-dev-ab07-func.azurewebsites.net/api/loans \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "userId": "auth0|123",
    "deviceId": "device-uuid"
  }'

# Response: Loan created with status=Pending, reservationId=null
```

### 2. Check Loan is Pending
```bash
curl https://deviceloan-dev-ab07-func.azurewebsites.net/api/loan/list?userId=auth0|123

# Should show: status = "Pending", reservationId = null
```

### 3. Wait for Reservation.Confirmed Event
```
Loan Service logs should show:
📦 Reservation confirmed - Linking loan with reservationId
✅ Loan {loanId} linked with reservationId: {reservationId}
```

### 4. Verify ReservationId is Set
```bash
curl https://deviceloan-dev-ab07-func.azurewebsites.net/api/loan/id/{loanId}

# Should show: status = "Pending", reservationId = "reservation-uuid"
```

### 5. Staff Marks Device as Collected
From Confirmation Service UI, staff clicks "Mark as Collected"

```
Loan Service logs should show:
📦 Device collected - Activating loan
✅ Loan {loanId} status: Pending → Active
```

### 6. Verify Loan is Active
```bash
curl https://deviceloan-dev-ab07-func.azurewebsites.net/api/loan/id/{loanId}

# Should show: status = "Active"
```

### 7. Staff Marks Device as Returned
From Confirmation Service UI, staff clicks "Mark as Returned"

```
Loan Service logs should show:
📦 Device returned - Completing loan
✅ Loan {loanId} status: Active → Returned
🔄 Processing waitlist for device: {deviceId}
```

### 8. Verify Loan is Returned
```bash
curl https://deviceloan-dev-ab07-func.azurewebsites.net/api/loan/id/{loanId}

# Should show: status = "Returned", returnedAt = "timestamp"
```

## Student Dashboard Updates

The student dashboard will now show real-time status updates:

| Status | Display | Color | Description |
|--------|---------|-------|-------------|
| **Pending** | ⏳ Awaiting Collection | Yellow | Reservation confirmed, waiting for pickup |
| **Active** | ✅ Currently Borrowed | Green | Device collected, in use |
| **Returned** | ✔️ Completed | Gray | Device returned |
| **Cancelled** | ❌ Cancelled | Red | Loan cancelled |
| **Overdue** | ⚠️ Overdue | Orange | Past due date |

## Troubleshooting

### Loan not found for reservation
```
⚠️ Loan not found for reservation: {reservationId}
```

**Cause**: `Reservation.Confirmed` event was not processed or loanId was incorrect

**Fix**: 
1. Check reservation-events-http logs
2. Verify Reservation.Confirmed event includes correct `loanId`
3. Check Event Grid subscription exists

### Loan not activating on collection
```
⚠️ Loan not found for reservation: {reservationId}
```

**Cause**: Loan doesn't have reservationId set

**Fix**:
1. Ensure Reservation.Confirmed was processed
2. Check loan in database has reservationId field populated
3. Verify Event Grid subscription for reservation events

## Related Files

- [LinkReservationUseCase.ts](src/Application/UseCases/LinkReservationUseCase.ts)
- [ActivateLoanUseCase.ts](src/Application/UseCases/ActivateLoanUseCase.ts)
- [reservation-events-http.ts](src/API/functions/reservation-events-http.ts)
- [confirmation-events-http.ts](src/API/functions/confirmation-events-http.ts)
- [appServices.ts](src/appServices.ts)
