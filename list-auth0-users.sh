#!/bin/bash

# List Auth0 Users
# This script lists users from your Auth0 tenant to help you find a user ID for testing

echo "📋 Listing Auth0 Users"
echo "======================"
echo ""

# Load environment variables from local.settings.json
AUTH0_DOMAIN=$(grep -o '"AUTH0_DOMAIN": "[^"]*' services/device-loan/local.settings.json | cut -d'"' -f4)
AUTH0_TOKEN=$(grep -o '"AUTH0_MGMT_API_TOKEN": "[^"]*' services/device-loan/local.settings.json | cut -d'"' -f4)

if [ -z "$AUTH0_DOMAIN" ] || [ -z "$AUTH0_TOKEN" ]; then
  echo "❌ Could not find Auth0 configuration in local.settings.json"
  exit 1
fi

echo "Auth0 Domain: $AUTH0_DOMAIN"
echo ""
echo "Fetching users..."
echo ""

# Fetch users from Auth0
RESPONSE=$(curl -s -X GET "https://$AUTH0_DOMAIN/api/v2/users?per_page=10" \
  -H "Authorization: Bearer $AUTH0_TOKEN")

# Check if jq is available
if command -v jq &> /dev/null; then
  echo "$RESPONSE" | jq -r '.[] | "User ID: \(.user_id)\nEmail: \(.email // "No email")\nName: \(.name // "No name")\n---"'
else
  echo "$RESPONSE" | python3 -m json.tool
fi

echo ""
echo "✅ Done! Use any of these User IDs for testing."
