# Central Logging for Campus Device Loan System

## ✅ Setup Complete

Your centralized logging is now configured with:

- **3 Log Analytics Workspaces** (one per environment):
  - `log-campusdevice-dev-Ab07-central`
  - `log-campusdevice-test-Ab07-central`
  - `log-campusdevice-prod-Ab07-central`

- **12 Application Insights** linked to workspaces:
  - devicecatalog (dev, test, prod)
  - deviceloan (dev, test, prod)
  - deviceconfirmation (dev, test, prod)
  - devicereservation (dev, test, prod)

- **12 Function Apps** configured with diagnostic settings

## 🔍 How to Query Logs

### Option 1: Azure Portal (Recommended)

1. Go to **Azure Portal** → **Monitor** → **Logs**
2. Click **Select scope**
3. Choose Resource Group: `CampusDeviceLender-dev-Ab07-rg` (or test/prod)
4. Run your queries

### Option 2: Direct Workspace Link

**Dev**: https://portal.azure.com/#@yourtenant/resource/subscriptions/51186783-fdaf-4528-8604-f28eefd39809/resourceGroups/CampusDeviceLender-dev-Ab07-rg/providers/Microsoft.OperationalInsights/workspaces/log-campusdevice-dev-Ab07-central/logs

**Test**: https://portal.azure.com/#@yourtenant/resource/subscriptions/51186783-fdaf-4528-8604-f28eefd39809/resourceGroups/CampusDeviceLender-test-Ab07-rg/providers/Microsoft.OperationalInsights/workspaces/log-campusdevice-test-Ab07-central/logs

**Prod**: https://portal.azure.com/#@yourtenant/resource/subscriptions/51186783-fdaf-4528-8604-f28eefd39809/resourceGroups/CampusDeviceLender-prod-Ab07-rg/providers/Microsoft.OperationalInsights/workspaces/log-campusdevice-prod-Ab07-central/logs

## 📊 Useful Queries

### 1. View Recent Logs from All Services

```kql
union AppTraces, AppRequests, AppExceptions
| where TimeGenerated > ago(1h)
| project TimeGenerated, AppRoleName, Message, OperationName, SeverityLevel
| order by TimeGenerated desc
| take 100
```

### 2. Trace a Request Across Services

Replace `YOUR_OPERATION_ID` with actual operation ID:

```kql
union AppRequests, AppDependencies, AppTraces
| where OperationId == 'YOUR_OPERATION_ID'
| project TimeGenerated, AppRoleName, OperationName, Message, DurationMs, Success
| order by TimeGenerated asc
```

### 3. Error Summary by Service

```kql
AppExceptions
| where TimeGenerated > ago(24h)
| summarize ErrorCount = count() by AppRoleName, ProblemId
| order by ErrorCount desc
```

### 4. Performance Metrics by Service

```kql
AppRequests
| where TimeGenerated > ago(1h)
| summarize 
    RequestCount = count(),
    AvgDuration = avg(DurationMs),
    P95Duration = percentile(DurationMs, 95),
    P99Duration = percentile(DurationMs, 99),
    FailureCount = countif(Success == false)
  by AppRoleName
| extend FailureRate = round((FailureCount * 100.0) / RequestCount, 2)
| project AppRoleName, RequestCount, AvgDuration, P95Duration, P99Duration, FailureRate
| order by RequestCount desc
```

### 5. Active Services

```kql
union AppRequests, AppTraces
| where TimeGenerated > ago(1h)
| summarize 
    LastActivity = max(TimeGenerated),
    EventCount = count()
  by AppRoleName
| order by LastActivity desc
```

### 6. Waitlist Processing Events

```kql
AppTraces
| where TimeGenerated > ago(24h)
| where Message contains "waitlist" or Message contains "Waitlist"
| project TimeGenerated, AppRoleName, Message
| order by TimeGenerated desc
```

### 7. Email Notification Events

```kql
AppTraces
| where TimeGenerated > ago(24h)
| where Message contains "email" or Message contains "Email" or Message contains "📧"
| project TimeGenerated, AppRoleName, Message
| order by TimeGenerated desc
```

### 8. Device Loan Lifecycle

```kql
AppTraces
| where TimeGenerated > ago(24h)
| where Message contains "Loan." or Message contains "status:"
| project TimeGenerated, AppRoleName, Message, OperationId
| order by TimeGenerated desc
```

### 9. API Requests by Endpoint

```kql
AppRequests
| where TimeGenerated > ago(24h)
| summarize 
    Count = count(),
    AvgDuration = avg(DurationMs),
    SuccessRate = round((countif(Success == true) * 100.0) / count(), 2)
  by OperationName, AppRoleName
| order by Count desc
```

### 10. Service Dependencies (Cross-Service Calls)

```kql
AppDependencies
| where TimeGenerated > ago(1h)
| project TimeGenerated, AppRoleName, Target, DurationMs, Success
| order by TimeGenerated desc
```

## 🎯 Correlation and Distributed Tracing

To trace a complete user request across all services:

1. **Find the initial request**:
```kql
AppRequests
| where TimeGenerated > ago(1h)
| where Name contains "create-loan"
| project TimeGenerated, OperationId, AppRoleName, Name
| take 1
```

2. **Trace across all services** using the OperationId:
```kql
let operationId = "YOUR_OPERATION_ID_HERE";
union AppRequests, AppDependencies, AppTraces, AppExceptions
| where OperationId == operationId
| project 
    TimeGenerated, 
    Type = $table,
    Service = AppRoleName, 
    Operation = OperationName,
    Message,
    Duration = DurationMs,
    Success
| order by TimeGenerated asc
```

## 📈 Creating Dashboards

1. Go to **Azure Portal** → **Dashboards** → **New dashboard**
2. Add **Logs** tiles
3. Select your workspace
4. Add your favorite queries
5. Pin to dashboard

## 🚨 Setting Up Alerts

1. Go to **Monitor** → **Alerts** → **New alert rule**
2. Select scope: Your workspace
3. Add condition with KQL query
4. Example: Alert on high error rate:

```kql
AppExceptions
| where TimeGenerated > ago(5m)
| summarize ErrorCount = count() by AppRoleName
| where ErrorCount > 10
```

## 💡 Tips

1. **Use time filters**: Always filter by TimeGenerated to improve query performance
2. **Limit results**: Use `take N` to limit result sets
3. **Use summarize**: Aggregate data before displaying
4. **Save queries**: Save frequently used queries in the portal
5. **Share queries**: Export queries and share with team

## 🔗 Useful Links

- [Kusto Query Language (KQL) Reference](https://learn.microsoft.com/azure/data-explorer/kusto/query/)
- [Application Insights Query Examples](https://learn.microsoft.com/azure/azure-monitor/logs/queries)
- [Log Analytics Tutorial](https://learn.microsoft.com/azure/azure-monitor/logs/log-analytics-tutorial)

## 📝 Common Scenarios

### Debugging a Failed Request

```kql
let failedOperationId = "YOUR_OPERATION_ID";
union AppRequests, AppDependencies, AppTraces, AppExceptions
| where OperationId == failedOperationId
| project TimeGenerated, Type = $table, AppRoleName, Message, Details
| order by TimeGenerated asc
```

### Finding Slow Requests

```kql
AppRequests
| where TimeGenerated > ago(1h)
| where DurationMs > 5000  // Requests taking more than 5 seconds
| project TimeGenerated, AppRoleName, OperationName, DurationMs, Success
| order by DurationMs desc
```

### Monitoring Email Delivery

```kql
AppTraces
| where TimeGenerated > ago(24h)
| where Message contains "✅ Email sent" or Message contains "❌ Failed to send email"
| extend EmailStatus = case(
    Message contains "✅", "Success",
    Message contains "❌", "Failed",
    "Unknown"
)
| summarize Count = count() by EmailStatus, bin(TimeGenerated, 1h)
| render timechart
```

---

**🎉 You now have enterprise-grade centralized logging for your Campus Device Loan System!**
