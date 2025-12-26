# Fix Event Grid Circular Loop

## Problem
Your create-loan function is stuck in an infinite loop because:
1. Creating a loan publishes `Loan.Created` event
2. An Event Grid subscription sends this event BACK to create-loan function
3. This creates another loan, which publishes another event, etc.

## Solution

### Step 1: Identify the Problem Subscription

```bash
# List all Event Grid subscriptions for your loan events topic
az eventgrid event-subscription list \
  --source-resource-id "/subscriptions/YOUR_SUB/resourceGroups/YOUR_RG/providers/Microsoft.EventGrid/topics/YOUR_LOAN_TOPIC" \
  --output table
```

### Step 2: Delete the Circular Subscription

Look for a subscription that has:
- **Filter**: includes `Loan.Created` event type
- **Endpoint**: points to your `create-loan-http` Azure Function

```bash
# Delete the problematic subscription
az eventgrid event-subscription delete \
  --name SUBSCRIPTION_NAME \
  --source-resource-id "/subscriptions/YOUR_SUB/resourceGroups/YOUR_RG/providers/Microsoft.EventGrid/topics/YOUR_LOAN_TOPIC"
```

### Step 3: Correct Event Flow

Your event flow should be:

```
create-loan-http (POST)
  ↓ publishes
Loan.Created event
  ↓ triggers
reservation-events-http   ✅ CORRECT
  ↓ (NOT create-loan-http again!)
```

## What Each Function Should Subscribe To

| Function | Should Listen To | Should NOT Listen To |
|----------|------------------|----------------------|
| `create-loan-http` | HTTP POST requests | ❌ Loan.Created events |
| `reservation-events-http` | Reservation.Confirmed | ✅ Correct |
| `cancel-loan-http` | HTTP POST requests | N/A |

## Quick Fix - Azure Portal

1. Go to **Azure Portal** → **Event Grid Topics**
2. Find your loan events topic (e.g., `deviceloan-{env}-topic`)
3. Click **Event Subscriptions**
4. **Delete** any subscription where:
   - Event Types include `Loan.Created`
   - Endpoint URL contains `create-loan-http`

## Verification

After fixing, your logs should show:
```
✅ CREATE LOAN: Created loan {id}
✅ Event published → Loan.Created
[NO REPEAT OF CREATE LOAN]
```

Instead of the current infinite loop:
```
❌ CREATE LOAN: Created loan {id}
❌ Event published → Loan.Created
❌ CREATE LOAN: Created loan {id}  ← LOOP!
❌ Event published → Loan.Created
❌ CREATE LOAN: Created loan {id}  ← LOOP!
...
```

## Prevention

**Never** create an Event Grid subscription that triggers the same function that published the event. This creates an infinite loop.

✅ **Correct**: Function A publishes event → Function B handles event
❌ **Wrong**: Function A publishes event → Function A handles same event

## Related Files

- Event publisher: `src/Infrastructure/EventGrid/LoanEventPublisher.ts`
- Create loan function: `src/API/functions/create-loan-http.ts`
- Reservation handler: `src/API/functions/reservation-events-http.ts`
