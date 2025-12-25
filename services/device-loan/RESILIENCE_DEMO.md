# Resilience & Error Handling Demonstration

This document demonstrates the robust error handling, retry logic, and graceful degradation patterns implemented in the Device Loan system.

## Overview

The system includes:
- **User-friendly error messages** - Clear, actionable messages for end users
- **Structured logging** - Detailed diagnostic information for Application Insights
- **Automatic retry logic** - Exponential backoff for transient failures
- **Error categorization** - Different handling for validation vs. service availability issues
- **Request correlation** - Error IDs for support tracing

## Error Handling Features

### 1. User-Friendly Error Messages

All API endpoints return structured error responses with:
```json
{
  "success": false,
  "error": "Technical error message for logging",
  "userFriendlyMessage": "Clear, actionable message for the user",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "retryable": true,
  "errorId": "abc123-invocation-id"
}
```

### 2. Structured Logging with Emojis

The system uses clear, visual logging:
- 📝 **CREATE LOAN**: Starting operations
- 🔄 **Processing**: Retry attempts
- ✅ **Success**: Successful operations
- ⚠️ **Warning**: Non-critical issues (404, validation errors)
- ❌ **Error**: Failed operations with context
- 🔥 **Critical**: Service unavailability, database connection issues

### 3. Automatic Retry Logic

The `CosmosLoanRepository` includes automatic retry with:
- **3 retry attempts** with exponential backoff (1s, 2s, 4s)
- **Transient error detection** (429 throttling, 503 service unavailable, timeouts)
- **Detailed retry logging** showing attempt number and wait times
- **Non-transient errors fail fast** (404, 400, 403 - no retry)

Example retry log:
```
🔄 [CREATE loan abc123] Attempt 1/3
❌ [CREATE loan abc123] Attempt 1/3 failed: { error: "Timeout", code: "ETIMEDOUT", isTransient: true, willRetry: true }
⏳ [CREATE loan abc123] Waiting 1000ms before retry...
🔄 [CREATE loan abc123] Attempt 2/3
✅ [CREATE loan abc123] Succeeded after 2 attempts
```

## Demonstration Scenarios

### Scenario 1: Database Connection Failure

**Steps to Reproduce:**
1. Stop the Azure Functions app or simulate network failure
2. Try to create a loan via the API
3. Observe the error response

**Expected Behavior:**
```json
{
  "success": false,
  "error": "Database operation failed after 3 attempts: ECONNREFUSED",
  "userFriendlyMessage": "The service is temporarily unavailable. Our team has been notified. Please try again shortly.",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "retryable": true,
  "supportMessage": "If this problem persists, please contact support with this error ID.",
  "errorId": "abc123-invocation-id"
}
```

**Console Output:**
```
🔄 [CREATE loan abc123] Attempt 1/3
❌ [CREATE loan abc123] Attempt 1/3 failed: { error: "Connection refused", code: "ECONNREFUSED", isTransient: true, willRetry: true }
⏳ [CREATE loan abc123] Waiting 1000ms before retry...
🔄 [CREATE loan abc123] Attempt 2/3
❌ [CREATE loan abc123] Attempt 2/3 failed: { error: "Connection refused", code: "ECONNREFUSED", isTransient: true, willRetry: true }
⏳ [CREATE loan abc123] Waiting 2000ms before retry...
🔄 [CREATE loan abc123] Attempt 3/3
❌ [CREATE loan abc123] Attempt 3/3 failed: { error: "Connection refused", code: "ECONNREFUSED", isTransient: true, willRetry: false }
🔥 CREATE LOAN: Service unavailable - possible connectivity issue
```

### Scenario 2: Cosmos DB Throttling (429)

**Steps to Reproduce:**
1. Generate high load to exceed RU/s limits
2. Create multiple loans simultaneously
3. Observe automatic retry behavior

**Expected Behavior:**
- First attempt fails with 429
- System automatically retries with exponential backoff
- Request succeeds on subsequent attempt
- User never sees the error

**Console Output:**
```
🔄 [CREATE loan def456] Attempt 1/3
❌ [CREATE loan def456] Attempt 1/3 failed: { statusCode: 429, isTransient: true, willRetry: true }
⏳ [CREATE loan def456] Waiting 1000ms before retry...
🔄 [CREATE loan def456] Attempt 2/3
✅ [CREATE loan def456] Succeeded after 2 attempts
📝 CREATE LOAN: Created loan def456 for user user789
```

### Scenario 3: Validation Errors (Fail Fast)

**Steps to Reproduce:**
1. Create a loan without required fields
2. Request a loan that doesn't exist
3. Cancel a loan you don't own

**Expected Behavior:**
- Immediate error response (no retries)
- Clear, actionable user message
- Appropriate HTTP status code (400, 404, 403)

**Examples:**

**Missing Fields (400):**
```json
{
  "success": false,
  "error": "Missing required information",
  "message": "Both user ID and device ID are required to create a loan request.",
  "userFriendlyMessage": "Please provide all required information to request a device."
}
```

**Not Found (404):**
```json
{
  "success": false,
  "error": "Loan not found",
  "userFriendlyMessage": "The loan you're trying to cancel could not be found. It may have already been cancelled or completed.",
  "errorId": "xyz789"
}
```

**Unauthorized (403):**
```json
{
  "success": false,
  "error": "Unauthorized",
  "userFriendlyMessage": "You don't have permission to cancel this loan. You can only cancel your own loans.",
  "errorId": "xyz789"
}
```

### Scenario 4: Service Recovery

**Steps to Reproduce:**
1. Stop the Azure Functions app
2. Try to create a loan (should fail with retries)
3. Restart the Azure Functions app
4. Try to create a loan again (should succeed)

**Expected Behavior:**
- First request shows retry attempts, then fails gracefully
- Second request succeeds immediately
- All error IDs are logged for support tracing

## Error Categories

### Client Errors (4xx) - No Retry
- **400 Bad Request**: Missing or invalid input
- **401 Unauthorized**: Authentication failure
- **403 Forbidden**: Authorization failure
- **404 Not Found**: Resource doesn't exist

**User Message Pattern:** Clear, actionable feedback about what's wrong

### Server Errors (5xx) - Automatic Retry
- **500 Internal Server Error**: Unexpected application error
- **503 Service Unavailable**: Database connection issues, timeouts

**User Message Pattern:** "Service temporarily unavailable, please try again"

## Application Insights Integration

All errors include structured data for Application Insights queries:

```typescript
ctx.error("❌ CREATE LOAN: Failed to create loan", {
  error: err.message,
  stack: err.stack,
  timestamp: new Date().toISOString(),
  userId: userId,
  deviceId: deviceId
});
```

### Useful Queries

**Count errors by type:**
```kusto
traces
| where message contains "❌"
| summarize count() by operation_Name
| order by count_ desc
```

**Find retry attempts:**
```kusto
traces
| where message contains "🔄" and message contains "Attempt"
| project timestamp, operation_Id, message
| order by timestamp desc
```

**Identify service unavailability:**
```kusto
traces
| where message contains "🔥"
| project timestamp, operation_Name, message
| order by timestamp desc
```

## Testing Error Handling

### Unit Tests
All use cases include error handling tests:
- Invalid input validation
- Repository failures
- Authorization failures
- Not found scenarios

### Integration Tests
The `LoanWorkflow.integration.test.ts` demonstrates end-to-end error scenarios.

### Load Tests
The `load-test.yml` includes failure scenarios to test retry logic under load.

## Best Practices Implemented

1. **Fail Fast for Client Errors** - Don't retry validation errors
2. **Exponential Backoff** - Increase wait time between retries
3. **Limited Retry Count** - Max 3 attempts to prevent infinite loops
4. **Detailed Logging** - Include context for debugging
5. **User-Friendly Messages** - Never expose technical details to users
6. **Error Correlation** - Include invocationId for support tracing
7. **Transient Detection** - Automatically identify retryable errors
8. **Structured Responses** - Consistent error format across all endpoints

## Monitoring Recommendations

### Key Metrics to Track
1. **Retry Success Rate**: How often retries succeed
2. **Error Rate by Category**: 4xx vs 5xx errors
3. **Average Retry Count**: Number of attempts per request
4. **Time to Recovery**: How long services take to recover

### Alerts to Configure
1. **High Error Rate**: > 5% of requests failing
2. **Frequent Retries**: > 50% of requests needing retries
3. **Service Unavailable**: Multiple 503 errors in short time
4. **Database Throttling**: High rate of 429 errors

## Related Documentation
- [README.md](./README.md) - Main project documentation
- [LOAN_STATUS_FLOW.md](./README.md#loan-lifecycle) - Loan state machine
- [Application Insights Documentation](https://learn.microsoft.com/azure/azure-monitor/app/app-insights-overview)
