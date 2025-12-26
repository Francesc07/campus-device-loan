# Resilience Demo - Quick Start Guide

Quick reference for demonstrating error handling and resilience in your presentation.

## 🎯 Key Features to Highlight

1. **User-Friendly Error Messages** - No technical jargon exposed to users
2. **Automatic Retry Logic** - 3 attempts with exponential backoff
3. **Visual Logging** - Clear emoji-based logging for monitoring
4. **Error Correlation** - Every error has a unique ID for support tracking
5. **Graceful Degradation** - System stays responsive even when services fail

## 🚀 Quick Demo Scenarios

### Demo 1: Service Unavailable (30 seconds)

**What to Show:** System handles service failures gracefully

1. Open Azure Portal → Stop the Function App
2. In your app, try to create a loan
3. **Point out the response:**
   ```json
   {
     "userFriendlyMessage": "The service is temporarily unavailable. Please try again shortly.",
     "retryable": true,
     "errorId": "abc123"
   }
   ```
4. **Open Application Insights** → Show the retry logs:
   ```
   🔄 Attempt 1/3
   ❌ Failed: Connection refused, will retry
   ⏳ Waiting 1000ms...
   🔄 Attempt 2/3
   ```
5. Restart the Function App
6. Try again → **Success!** ✅

**Key Message:** "The system automatically retries transient failures, and users get clear, actionable messages instead of technical errors."

---

### Demo 2: Database Throttling (Recovery) (20 seconds)

**What to Show:** System automatically recovers from throttling

1. Explain: "When Cosmos DB throttles requests (429), we automatically retry"
2. Show the code in `CosmosLoanRepository.ts`:
   ```typescript
   private async withRetry<T>(operation: () => Promise<T>, operationName: string)
   ```
3. **Point out the logic:**
   - Detects transient errors (429, 503, timeouts)
   - Exponential backoff (1s → 2s → 4s)
   - Detailed logging of each attempt

**Key Message:** "We built resilience into the data layer, so temporary throttling doesn't impact users."

---

### Demo 3: Validation Errors (Fail Fast) (15 seconds)

**What to Show:** Non-retryable errors fail immediately with clear guidance

1. Try to create a loan without required fields
2. **Point out the response:**
   ```json
   {
     "error": "Missing required information",
     "userFriendlyMessage": "Please provide all required information to request a device.",
     "retryable": false
   }
   ```
3. Try to cancel someone else's loan
4. **Point out the 403 response:**
   ```json
   {
     "userFriendlyMessage": "You can only cancel your own loans."
   }
   ```

**Key Message:** "We don't waste time retrying validation errors—we fail fast with helpful messages."

---

## 📊 Application Insights Queries

### Show Retry Activity
```kusto
traces
| where message contains "🔄" and message contains "Attempt"
| project timestamp, operation_Name, message
| order by timestamp desc
| take 20
```

### Show Error Distribution
```kusto
traces
| where message contains "❌"
| summarize count() by operation_Name
| order by count_ desc
```

### Show Service Unavailability
```kusto
traces
| where message contains "🔥"
| project timestamp, operation_Name, message
| order by timestamp desc
```

---

## 🎤 Talking Points

### Why This Matters
- **User Experience:** Users see helpful messages, not stack traces
- **Reliability:** Automatic recovery from transient failures
- **Observability:** Clear logging for debugging production issues
- **Support:** Error IDs enable quick issue resolution

### Technical Highlights
- **Exponential Backoff:** Reduces load during recovery
- **Transient Error Detection:** Smart retry logic
- **Structured Logging:** Easy to query in Application Insights
- **Error Categorization:** Different handling for different error types

### Production Benefits
- **Reduced Support Tickets:** Clear user messages
- **Faster Debugging:** Structured logs with error IDs
- **Better Uptime:** Automatic recovery from transient failures
- **Cost Optimization:** Handles throttling gracefully

---

## 📁 Code References

- **API Error Handling:** `src/API/functions/*-http.ts`
- **Retry Logic:** `src/Infrastructure/Persistence/CosmosLoanRepository.ts`
- **Full Documentation:** [RESILIENCE_DEMO.md](./RESILIENCE_DEMO.md)

---

## ⏱️ 2-Minute Version

**Setup (5 sec):** "We built comprehensive error handling into our system."

**Demo (60 sec):**
1. Stop service → Show user-friendly error + retry logs
2. Restart service → Show recovery
3. Show validation error → Clear, actionable message

**Wrap-up (30 sec):** "This approach gives users clarity, automatic recovery, and makes debugging production issues much easier with structured logging and error IDs."

**Questions (25 sec):** Open floor

---

## 🔗 Quick Links

- **GitHub Actions:** Check deployment status
- **Azure Portal:** Function App + Application Insights
- **API Endpoints:** 
  - Create Loan: `POST /api/loan`
  - List Loans: `GET /api/loan?userId=X`
  - Cancel Loan: `POST /api/loan/cancel`

---

**Pro Tip:** Have Application Insights open in another tab during the demo to show real-time logs as you trigger errors. The emoji-based logging makes it very visual and engaging! 📊✨
