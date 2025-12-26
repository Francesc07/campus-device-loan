#!/bin/bash

# Script to get Auth0 Management API token
# Usage: ./get-auth0-token.sh <CLIENT_SECRET>

if [ -z "$1" ]; then
  echo "Usage: ./get-auth0-token.sh <CLIENT_SECRET>"
  echo ""
  echo "Get your Client Secret from:"
  echo "Auth0 Dashboard > Applications > CampusDeviceLoanAPI (Test Application) > Settings"
  exit 1
fi

CLIENT_ID="q6zdoS0wgzFPm9190rtNNzqTeCfgY8oi"
CLIENT_SECRET="$1"
DOMAIN="dev-x21op5myzhuj4ugr.us.auth0.com"
AUDIENCE="https://${DOMAIN}/api/v2/"

echo "Fetching Auth0 Management API token..."
echo ""

RESPONSE=$(curl --silent --request POST \
  --url "https://${DOMAIN}/oauth/token" \
  --header 'content-type: application/json' \
  --data "{
    \"client_id\":\"${CLIENT_ID}\",
    \"client_secret\":\"${CLIENT_SECRET}\",
    \"audience\":\"${AUDIENCE}\",
    \"grant_type\":\"client_credentials\"
  }")

# Extract token from response
TOKEN=$(echo $RESPONSE | grep -o '"access_token":"[^"]*' | sed 's/"access_token":"//')

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to get token. Response:"
  echo $RESPONSE
  exit 1
fi

echo "✅ Token obtained successfully!"
echo ""
echo "AUTH0_MGMT_API_TOKEN:"
echo "$TOKEN"
echo ""
echo "Add this to your local.settings.json:"
echo "\"AUTH0_MGMT_API_TOKEN\": \"$TOKEN\""
