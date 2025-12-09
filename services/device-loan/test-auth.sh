#!/bin/bash
# Test Auth0 token validation with Azure Function

echo "🔐 Testing Auth0 Authentication with Device Loan API"
echo "=================================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
FUNCTION_URL="https://deviceloan-dev-ab07-func.azurewebsites.net/api"
TEST_USER_ID="auth0|69354f8bdcf452e5f17fdb41"

echo "📋 Prerequisites:"
echo "  - You need a valid Auth0 access token"
echo "  - Token must have 'view:my-loans' permission"
echo "  - Token audience must be: https://campus-deviceloan-api"
echo ""

# Check if token is provided
if [ -z "$1" ]; then
    echo -e "${YELLOW}⚠️  No token provided${NC}"
    echo ""
    echo "Usage: $0 <ACCESS_TOKEN>"
    echo ""
    echo "To get a token:"
    echo "  1. Login to your frontend app"
    echo "  2. Open browser DevTools > Console"
    echo "  3. Run: localStorage.getItem('@@auth0spajs@@::your-client-id::https://campus-deviceloan-api::openid profile email...')"
    echo "  4. Copy the access_token value"
    echo ""
    exit 1
fi

TOKEN="$1"

echo "🧪 Test 1: Health Check (No Auth Required)"
echo "-------------------------------------------"
HEALTH_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "$FUNCTION_URL/health/ready")
HTTP_STATUS=$(echo "$HEALTH_RESPONSE" | grep HTTP_STATUS | cut -d: -f2)
BODY=$(echo "$HEALTH_RESPONSE" | sed '$d')

if [ "$HTTP_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Health check passed${NC}"
else
    echo -e "${RED}❌ Health check failed (HTTP $HTTP_STATUS)${NC}"
fi
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

echo "🧪 Test 2: List Loans (Auth Required)"
echo "---------------------------------------"
LOANS_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
    -H "Authorization: Bearer $TOKEN" \
    "$FUNCTION_URL/loan/list?userId=$TEST_USER_ID")
HTTP_STATUS=$(echo "$LOANS_RESPONSE" | grep HTTP_STATUS | cut -d: -f2)
BODY=$(echo "$LOANS_RESPONSE" | sed '$d')

if [ "$HTTP_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Authentication successful!${NC}"
    echo "Loans retrieved:"
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
elif [ "$HTTP_STATUS" = "401" ]; then
    echo -e "${RED}❌ Authentication failed (401 Unauthorized)${NC}"
    echo "Response:"
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
    echo ""
    echo "Common causes:"
    echo "  - Token expired"
    echo "  - Token doesn't have correct audience"
    echo "  - Auth0 settings not configured in Azure"
elif [ "$HTTP_STATUS" = "403" ]; then
    echo -e "${RED}❌ Forbidden (403)${NC}"
    echo "Token is valid but missing required permissions"
    echo "Required permission: view:my-loans"
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
elif [ "$HTTP_STATUS" = "500" ]; then
    echo -e "${RED}❌ Server error (500)${NC}"
    echo "Response:"
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
else
    echo -e "${RED}❌ Unexpected response (HTTP $HTTP_STATUS)${NC}"
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
fi
echo ""

echo "🧪 Test 3: List Devices (Auth Required)"
echo "----------------------------------------"
DEVICES_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
    -H "Authorization: Bearer $TOKEN" \
    "$FUNCTION_URL/devices/list")
HTTP_STATUS=$(echo "$DEVICES_RESPONSE" | grep HTTP_STATUS | cut -d: -f2)
BODY=$(echo "$DEVICES_RESPONSE" | sed '$d')

if [ "$HTTP_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Device list retrieved successfully${NC}"
    DEVICE_COUNT=$(echo "$BODY" | jq '.count' 2>/dev/null)
    echo "Device count: $DEVICE_COUNT"
elif [ "$HTTP_STATUS" = "401" ] || [ "$HTTP_STATUS" = "403" ]; then
    echo -e "${RED}❌ Authentication/Authorization failed (HTTP $HTTP_STATUS)${NC}"
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
else
    echo -e "${YELLOW}⚠️  HTTP $HTTP_STATUS${NC}"
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
fi
echo ""

echo "=================================================="
echo "✨ Tests complete!"
