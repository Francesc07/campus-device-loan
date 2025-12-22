#!/bin/bash
# Create Event Grid subscription from Reservation Service to Loan Service

set -e

ENV="${1:-dev}"

echo "=========================================="
echo "Creating Reservation → Loan Subscription"
echo "Environment: $ENV"
echo "=========================================="
echo ""

# Check if logged in
if ! az account show &>/dev/null; then
    echo "❌ Not logged in to Azure. Run 'az login' first."
    exit 1
fi

# Resource names
RESERVATION_TOPIC="devicereservation-${ENV}-ab07-topic"
RESERVATION_RG="CampusDeviceLender-${ENV}-Ab07-rg"
LOAN_FUNCTION="deviceloan-${ENV}-ab07-func"
LOAN_RG="CampusDeviceLender-${ENV}-Ab07-rg"
SUBSCRIPTION_NAME="loan-reservation-events"

echo "Source: $RESERVATION_TOPIC"
echo "Destination: $LOAN_FUNCTION/reservation-events-http"
echo ""

# Get Topic ID
echo "1️⃣ Getting Reservation Topic ID..."
TOPIC_ID=$(az eventgrid topic show \
    --name "$RESERVATION_TOPIC" \
    --resource-group "$RESERVATION_RG" \
    --query id -o tsv)

if [ -z "$TOPIC_ID" ]; then
    echo "❌ Reservation Topic not found"
    exit 1
fi
echo "✅ Topic ID: $TOPIC_ID"
echo ""

# Get Function App ID
echo "2️⃣ Getting Loan Function App ID..."
FUNCTION_ID=$(az functionapp show \
    --name "$LOAN_FUNCTION" \
    --resource-group "$LOAN_RG" \
    --query id -o tsv)

if [ -z "$FUNCTION_ID" ]; then
    echo "❌ Loan Function App not found"
    exit 1
fi
echo "✅ Function ID: $FUNCTION_ID"
echo ""

# Check if subscription already exists
EXISTING=$(az eventgrid event-subscription show \
    --name "$SUBSCRIPTION_NAME" \
    --source-resource-id "$TOPIC_ID" \
    --query name -o tsv 2>/dev/null || echo "")

if [ -n "$EXISTING" ]; then
    echo "⚠️  Subscription already exists: $SUBSCRIPTION_NAME"
    echo ""
    read -p "Delete and recreate? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🗑️  Deleting existing subscription..."
        az eventgrid event-subscription delete \
            --name "$SUBSCRIPTION_NAME" \
            --source-resource-id "$TOPIC_ID"
        echo "✅ Deleted"
    else
        echo "Keeping existing subscription. Exiting."
        exit 0
    fi
fi

# Create subscription
echo "3️⃣ Creating Event Grid subscription..."
ENDPOINT="${FUNCTION_ID}/functions/reservation-events-http"

az eventgrid event-subscription create \
    --name "$SUBSCRIPTION_NAME" \
    --source-resource-id "$TOPIC_ID" \
    --endpoint-type azurefunction \
    --endpoint "$ENDPOINT" \
    --included-event-types Reservation.Confirmed Reservation.Cancelled \
    --event-delivery-schema eventgridschema \
    --max-delivery-attempts 30 \
    --event-ttl 1440

echo ""
echo "✅ Event Grid subscription created successfully!"
echo ""

# Verify
echo "4️⃣ Verifying subscription..."
STATUS=$(az eventgrid event-subscription show \
    --name "$SUBSCRIPTION_NAME" \
    --source-resource-id "$TOPIC_ID" \
    --query "provisioningState" -o tsv)

if [ "$STATUS" == "Succeeded" ]; then
    echo "✅ Subscription status: $STATUS"
else
    echo "⚠️  Subscription status: $STATUS"
fi

echo ""
echo "=========================================="
echo "Setup Complete"
echo "=========================================="
echo ""
echo "Subscription Details:"
echo "  Name: $SUBSCRIPTION_NAME"
echo "  Source: $RESERVATION_TOPIC"
echo "  Destination: $LOAN_FUNCTION/reservation-events-http"
echo "  Events: Reservation.Confirmed, Reservation.Cancelled"
echo ""
echo "Next Steps:"
echo "1. Create a loan (POST /api/loans)"
echo "2. Check Loan Service logs:"
echo "   az functionapp logs tail -n $LOAN_FUNCTION -g $LOAN_RG"
echo ""
echo "Expected logs:"
echo "  📨 Loan Service received reservation events"
echo "  📦 Reservation confirmed - Linking loan with reservationId"
echo "  ✅ Loan {id} linked with reservationId: {reservationId}"
