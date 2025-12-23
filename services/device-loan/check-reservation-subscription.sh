#!/bin/bash
# Check Event Grid subscription from Reservation Service to Loan Service

ENV="${1:-dev}"

echo "=========================================="
echo "Checking Reservation → Loan Subscription"
echo "Environment: $ENV"
echo "=========================================="
echo ""

# Resource names
RESERVATION_TOPIC="devicereservation-${ENV}-ab07-topic"
RESERVATION_RG="CampusDeviceLender-${ENV}-Ab07-rg"
LOAN_FUNCTION="deviceloan-${ENV}-ab07-func"
LOAN_RG="CampusDeviceLender-${ENV}-Ab07-rg"
SUBSCRIPTION_NAME="loan-reservation-events"

echo "Source Topic: $RESERVATION_TOPIC"
echo "Destination Function: $LOAN_FUNCTION"
echo ""

# Check if logged in
if ! az account show &>/dev/null; then
    echo "❌ Not logged in to Azure. Run 'az login' first."
    exit 1
fi

# Get Reservation Topic ID
echo "1️⃣ Checking Reservation Service Event Grid Topic..."
TOPIC_ID=$(az eventgrid topic show \
    --name "$RESERVATION_TOPIC" \
    --resource-group "$RESERVATION_RG" \
    --query id -o tsv 2>/dev/null)

if [ -z "$TOPIC_ID" ]; then
    echo "❌ Reservation Topic not found: $RESERVATION_TOPIC"
    exit 1
fi
echo "✅ Topic found: $RESERVATION_TOPIC"
echo ""

# Check for existing subscription
echo "2️⃣ Checking for existing Event Grid subscription..."
EXISTING_SUB=$(az eventgrid event-subscription show \
    --name "$SUBSCRIPTION_NAME" \
    --source-resource-id "$TOPIC_ID" \
    --query name -o tsv 2>/dev/null)

if [ -n "$EXISTING_SUB" ]; then
    echo "✅ Subscription exists: $SUBSCRIPTION_NAME"
    echo ""
    echo "Subscription Details:"
    az eventgrid event-subscription show \
        --name "$SUBSCRIPTION_NAME" \
        --source-resource-id "$TOPIC_ID" \
        --query "{Name:name, EndpointType:destination.endpointType, ResourceId:destination.resourceId, Status:provisioningState}" \
        -o json | jq .
    echo ""
    echo "✅ Loan Service IS subscribed to Reservation.Confirmed events"
else
    echo "❌ NO subscription found!"
    echo ""
    echo "To create subscription, run:"
    echo ""
    echo "  ./create-reservation-subscription.sh $ENV"
    echo ""
    exit 1
fi

echo ""
echo "=========================================="
echo "Testing Event Flow"
echo "=========================================="
echo ""
echo "To test:"
echo "1. Create a loan (POST /api/loans)"
echo "2. Check Loan Service logs:"
echo "   az functionapp logs tail -n $LOAN_FUNCTION -g $LOAN_RG"
echo ""
echo "You should see:"
echo "  📨 Loan Service received reservation events"
echo "  📦 Reservation confirmed - Linking loan with reservationId"
echo "  ✅ Loan {id} linked with reservationId: {reservationId}"
