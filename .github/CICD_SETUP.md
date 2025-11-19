# GitHub Actions CI/CD Setup for Device Loan Service

## Overview

This repository uses GitHub Actions to automatically build and deploy the Device Loan Service to Azure Functions across multiple environments.

## Workflow: `device-loan-cicd.yml`

### Triggers

1. **Automatic Deployment**:
   - Push to `main` branch → Deploys to TEST, then PROD
   - Only triggers when changes are made to `services/device-loan/**`

2. **Manual Deployment**:
   - Go to Actions → Device Loan Service - CI/CD → Run workflow
   - Choose environment: `test`, `prod`, or `all`

### Pipeline Stages

1. **Build** (runs on every trigger)
   - Install dependencies
   - Build TypeScript
   - Run tests
   - Upload artifacts

2. **Deploy to TEST** (automatic on main push)
   - Downloads build artifacts
   - Deploys to `func-deviceloan-test-ab07`

3. **Deploy to PROD** (after TEST succeeds)
   - Downloads build artifacts
   - Deploys to `func-deviceloan-prod-ab07`

## Required GitHub Secrets

You need to create the following secrets in your GitHub repository:

### 1. AZURE_CREDENTIALS_TEST

Service Principal for TEST environment:

```bash
az ad sp create-for-rbac \
  --name "github-deviceloan-test" \
  --role contributor \
  --scopes /subscriptions/51186783-fdaf-4528-8604-f28eefd39809/resourceGroups/deviceloan-test-Ab07-rg \
  --sdk-auth
```

Copy the JSON output and add it as a secret named `AZURE_CREDENTIALS_TEST`

### 2. AZURE_CREDENTIALS_PROD

Service Principal for PROD environment:

```bash
az ad sp create-for-rbac \
  --name "github-deviceloan-prod" \
  --role contributor \
  --scopes /subscriptions/51186783-fdaf-4528-8604-f28eefd39809/resourceGroups/deviceloan-prod-Ab07-rg \
  --sdk-auth
```

Copy the JSON output and add it as a secret named `AZURE_CREDENTIALS_PROD`

## Setup Instructions

### Step 1: Create Service Principals

Run the commands above to create service principals for TEST and PROD.

### Step 2: Add Secrets to GitHub

1. Go to your GitHub repository
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add both `AZURE_CREDENTIALS_TEST` and `AZURE_CREDENTIALS_PROD`

### Step 3: Configure Environment Protection (Optional)

1. Go to Settings → Environments
2. Create environments: `test` and `prod`
3. For `prod`, add protection rules:
   - Required reviewers (your GitHub username)
   - Wait timer (optional)

### Step 4: Test the Pipeline

1. Make a small change in `services/device-loan/`
2. Commit and push to `main`
3. Go to Actions tab to watch the deployment

## Service Principal JSON Format

The output should look like this:

```json
{
  "clientId": "<GUID>",
  "clientSecret": "<SECRET>",
  "subscriptionId": "51186783-fdaf-4528-8604-f28eefd39809",
  "tenantId": "bd73de33-fceb-4a60-9f54-f988e69aa524",
  "activeDirectoryEndpointUrl": "https://login.microsoftonline.com",
  "resourceManagerEndpointUrl": "https://management.azure.com/",
  "activeDirectoryGraphResourceId": "https://graph.windows.net/",
  "sqlManagementEndpointUrl": "https://management.core.windows.net:8443/",
  "galleryEndpointUrl": "https://gallery.azure.com/",
  "managementEndpointUrl": "https://management.core.windows.net/"
}
```

## Deployment Flow

```
┌─────────────────┐
│  Push to main   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Build & Test  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Deploy to TEST │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Deploy to PROD  │  ← Requires TEST success
└─────────────────┘
```

## Troubleshooting

### Build Fails

- Check TypeScript compilation errors
- Ensure all dependencies are in `package.json`

### Deployment Fails

- Verify service principal has correct permissions
- Check Azure Function App name matches in workflow
- Ensure secrets are correctly formatted JSON

### No Deployment Triggered

- Verify changes are in `services/device-loan/**` path
- Check branch is `main`
- Review workflow trigger conditions

## Manual Deployment

To deploy manually without pushing to main:

1. Go to Actions → Device Loan Service - CI/CD
2. Click "Run workflow"
3. Select branch and environment
4. Click "Run workflow"

## Monitoring

After deployment:
- Check Azure Portal → Function App → Functions to see deployed functions
- View logs in Application Insights
- Test endpoints to verify deployment
