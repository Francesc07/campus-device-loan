#!/bin/bash

# Query Central Logging - Campus Device Loan System
# Usage: ./query-logs.sh [dev|test|prod] [query-type]

set -e

ENV=${1:-dev}
QUERY_TYPE=${2:-recent}
WORKSPACE="log-campusdevice-${ENV}-Ab07-central"
RG="CampusDeviceLender-${ENV}-Ab07-rg"

echo "🔍 Querying $ENV environment logs..."
echo "Workspace: $WORKSPACE"
echo ""

# Helper function to run queries
run_query() {
  local query=$1
  az monitor log-analytics workspace query \
    --resource-group "$RG" \
    --workspace-name "$WORKSPACE" \
    --analytics-query "$query" \
    --output table
}

case $QUERY_TYPE in
  recent)
    echo "📊 Recent logs from all services (last hour):"
    run_query "
      union AppTraces, AppRequests, AppExceptions
      | where TimeGenerated > ago(1h)
      | project TimeGenerated, AppRoleName, Message, OperationName, SeverityLevel
      | order by TimeGenerated desc
      | take 50
    "
    ;;
    
  errors)
    echo "❌ Errors from all services (last 24h):"
    run_query "
      AppExceptions
      | where TimeGenerated > ago(24h)
      | project TimeGenerated, AppRoleName, ProblemId, ExceptionMessage = tostring(parse_json(tostring(Details))[0].message)
      | order by TimeGenerated desc
    "
    ;;
    
  performance)
    echo "⚡ Performance by service (last hour):"
    run_query "
      AppRequests
      | where TimeGenerated > ago(1h)
      | summarize 
          RequestCount = count(),
          AvgDuration = avg(DurationMs),
          P95Duration = percentile(DurationMs, 95),
          FailureCount = countif(Success == false)
        by AppRoleName
      | extend FailureRate = (FailureCount * 100.0) / RequestCount
      | project AppRoleName, RequestCount, AvgDuration, P95Duration, FailureRate
    "
    ;;
    
  trace)
    if [ -z "$3" ]; then
      echo "⚠️  Please provide OperationId as third argument"
      echo "Usage: $0 $ENV trace <operation-id>"
      exit 1
    fi
    
    OPERATION_ID=$3
    echo "🔗 Tracing request $OPERATION_ID across services:"
    run_query "
      union AppRequests, AppDependencies, AppTraces
      | where OperationId == '$OPERATION_ID'
      | project TimeGenerated, AppRoleName, OperationName, Message, DurationMs
      | order by TimeGenerated asc
    "
    ;;
    
  services)
    echo "📊 Active services in last hour:"
    run_query "
      union AppRequests, AppTraces
      | where TimeGenerated > ago(1h)
      | summarize 
          LastActivity = max(TimeGenerated),
          EventCount = count()
        by AppRoleName
      | order by LastActivity desc
    "
    ;;
    
  waitlist)
    echo "📋 Waitlist processing events (last 24h):"
    run_query "
      AppTraces
      | where TimeGenerated > ago(24h)
      | where Message contains 'waitlist' or Message contains 'Waitlist'
      | project TimeGenerated, AppRoleName, Message
      | order by TimeGenerated desc
      | take 50
    "
    ;;
    
  email)
    echo "📧 Email notification events (last 24h):"
    run_query "
      AppTraces
      | where TimeGenerated > ago(24h)
      | where Message contains 'email' or Message contains 'Email' or Message contains '📧'
      | project TimeGenerated, AppRoleName, Message
      | order by TimeGenerated desc
      | take 50
    "
    ;;
    
  *)
    echo "❌ Unknown query type: $QUERY_TYPE"
    echo ""
    echo "Available query types:"
    echo "  recent      - Recent logs from all services (default)"
    echo "  errors      - Errors from all services"
    echo "  performance - Performance metrics by service"
    echo "  trace       - Trace a specific request by OperationId"
    echo "  services    - Show active services"
    echo "  waitlist    - Waitlist processing events"
    echo "  email       - Email notification events"
    echo ""
    echo "Usage: $0 [dev|test|prod] [query-type]"
    exit 1
    ;;
esac

echo ""
echo "✅ Query complete!"
