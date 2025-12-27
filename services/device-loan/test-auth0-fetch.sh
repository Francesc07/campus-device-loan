#!/bin/bash

# Test Auth0 Email Fetching Script
# This script helps you test that the Auth0 user service is correctly fetching user emails

echo "🧪 Testing Auth0 User Email Fetch"
echo "=================================="
echo ""

# Check if userId is provided
if [ -z "$1" ]; then
  echo "❌ Error: User ID required"
  echo ""
  echo "Usage: ./test-auth0-fetch.sh <userId> [access-token]"
  echo ""
  echo "Examples:"
  echo "  # Using management API token (from local.settings.json)"
  echo "  ./test-auth0-fetch.sh auth0|123456789"
  echo ""
  echo "  # Using user's access token"
  echo "  ./test-auth0-fetch.sh auth0|123456789 eyJhbGci..."
  echo ""
  echo "To get your user ID, you can:"
  echo "  1. Check Auth0 Dashboard -> Users"
  echo "  2. Use: ./get-auth0-token.sh"
  exit 1
fi

USER_ID="$1"
ACCESS_TOKEN="$2"

# Function host URL
HOST_URL="http://localhost:7071"

echo "Testing with:"
echo "  User ID: $USER_ID"
if [ -n "$ACCESS_TOKEN" ]; then
  echo "  Token: User access token (provided)"
else
  echo "  Token: Management API token (from config)"
fi
echo ""

# Make the request
if [ -n "$ACCESS_TOKEN" ]; then
  echo "📡 Making request with user token..."
  curl -X GET "$HOST_URL/api/test-auth0-email?userId=$USER_ID" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -w "\n\n⏱️  HTTP Status: %{http_code}\n⏱️  Time: %{time_total}s\n" \
    -s | jq '.'
else
  echo "📡 Making request with management token..."
  curl -X GET "$HOST_URL/api/test-auth0-email?userId=$USER_ID" \
    -H "Content-Type: application/json" \
    -w "\n\n⏱️  HTTP Status: %{http_code}\n⏱️  Time: %{time_total}s\n" \
    -s | jq '.'
fi

echo ""
echo "✅ Test complete!"
echo ""
echo "If successful, you should see:"
echo "  - The user's email address"
echo "  - Confirmation that a test email was sent (if SendGrid is configured)"
echo ""
