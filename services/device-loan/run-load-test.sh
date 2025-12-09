#!/bin/bash
# run-load-test.sh - Execute load testing against deployed Function App

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Device Loan Service Load Test ===${NC}"

# Check if environment parameter is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: Environment parameter required${NC}"
    echo "Usage: ./run-load-test.sh <environment> [duration]"
    echo "Example: ./run-load-test.sh dev 300"
    exit 1
fi

ENVIRONMENT=$1
DURATION=${2:-300}  # Default 5 minutes

# Set function app URL based on environment
case $ENVIRONMENT in
    dev)
        FUNCTION_APP_URL="https://func-campus-device-loan-dev.azurewebsites.net"
        ;;
    test)
        FUNCTION_APP_URL="https://func-campus-device-loan-test.azurewebsites.net"
        ;;
    prod)
        FUNCTION_APP_URL="https://func-campus-device-loan-prod.azurewebsites.net"
        ;;
    *)
        echo -e "${RED}Invalid environment: $ENVIRONMENT${NC}"
        echo "Valid options: dev, test, prod"
        exit 1
        ;;
esac

echo -e "${YELLOW}Target: $FUNCTION_APP_URL${NC}"
echo -e "${YELLOW}Duration: $DURATION seconds${NC}"

# Check if Artillery is installed
if ! command -v artillery &> /dev/null; then
    echo -e "${YELLOW}Artillery not found. Installing...${NC}"
    npm install -g artillery
fi

# Check if faker is installed
if [ ! -d "node_modules/@faker-js/faker" ]; then
    echo -e "${YELLOW}Installing faker for test data generation...${NC}"
    npm install @faker-js/faker
fi

# Create results directory
RESULTS_DIR="load-test-results"
mkdir -p $RESULTS_DIR

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_FILE="$RESULTS_DIR/load-test-${ENVIRONMENT}-${TIMESTAMP}.json"
HTML_REPORT="$RESULTS_DIR/load-test-${ENVIRONMENT}-${TIMESTAMP}.html"

echo -e "${GREEN}Starting load test...${NC}"

# Run Artillery load test
export FUNCTION_APP_URL=$FUNCTION_APP_URL

artillery run \
    --output "$REPORT_FILE" \
    load-test.yml

# Generate HTML report
echo -e "${GREEN}Generating HTML report...${NC}"
artillery report "$REPORT_FILE" --output "$HTML_REPORT"

echo -e "${GREEN}Load test completed!${NC}"
echo -e "JSON Report: ${YELLOW}$REPORT_FILE${NC}"
echo -e "HTML Report: ${YELLOW}$HTML_REPORT${NC}"

# Check if test passed performance thresholds
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ All performance thresholds met${NC}"
    exit 0
else
    echo -e "${RED}✗ Performance thresholds not met${NC}"
    exit 1
fi
