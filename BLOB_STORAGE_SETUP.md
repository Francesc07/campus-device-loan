# Azure Blob Storage Configuration

This document explains how to configure Azure Blob Storage for the Campus Device Catalog system to handle image and file uploads.

## Prerequisites

1. An Azure Storage Account
2. Access keys for the storage account
3. The `@azure/storage-blob` npm package (already installed)

## Azure Portal Setup

### 1. Create Azure Storage Account

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Storage accounts** → **+ Create**
3. Fill in the required details:
   - **Resource Group**: Use your existing resource group or create new
   - **Storage account name**: Choose a globally unique name (e.g., `devicecatalogstorage`)
   - **Region**: Same as your other Azure resources
   - **Performance**: Standard
   - **Redundancy**: LRS (Locally-redundant storage) for development

### 2. Get Connection String

1. After creation, navigate to your storage account
2. Go to **Access keys** under **Security + networking**
3. Copy the **Connection string** from key1

### 3. Configure CORS (Optional - for web uploads)

1. In your storage account, go to **Resource sharing (CORS)** under **Settings**
2. Add a rule for Blob service:
   - **Allowed origins**: `*` (or your specific domain)
   - **Allowed methods**: `GET, POST, PUT, DELETE`
   - **Allowed headers**: `*`
   - **Exposed headers**: `*`
   - **Maximum age**: `3600`

## Local Development Configuration

### Update local.settings.json

Replace the placeholder in your `local.settings.json`:

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "COSMOS_ENDPOINT": "https://your-cosmos-account.documents.azure.com:443/",
    "COSMOS_KEY": "your-cosmos-key",
    "COSMOS_DB": "deviceCatalogDb",
    "COSMOS_CONTAINER": "devices",
    "AZURE_STORAGE_CONNECTION_STRING": "DefaultEndpointsProtocol=https;AccountName=your-storage-account;AccountKey=your-storage-key;EndpointSuffix=core.windows.net"
  }
}
```

### Environment Variables

The system will automatically:
- Create a blob container named `device-assets` if it doesn't exist
- Set public read access on uploaded files
- Generate unique filenames to prevent conflicts

## Production Deployment

### Azure Function App Configuration

Add the following application settings to your Azure Function App:

1. **AZURE_STORAGE_CONNECTION_STRING**: Your storage account connection string
2. Or use individual settings for better security:
   - **AZURE_STORAGE_ACCOUNT_NAME**: Storage account name
   - **AZURE_STORAGE_ACCOUNT_KEY**: Access key

### Security Best Practices

1. **Use Azure Key Vault**: Store connection strings in Azure Key Vault
2. **Managed Identity**: Use system-assigned managed identity instead of connection strings
3. **SAS Tokens**: Consider using SAS tokens for time-limited access
4. **Private Endpoints**: Use private endpoints for enhanced security

## API Usage

### Upload Asset

Upload images or files for devices:

```http
POST /api/upload-asset
Content-Type: multipart/form-data

file: [binary file data]
```

**Response (Success):**
```json
{
  "url": "https://your-storage.blob.core.windows.net/device-assets/1698765432123_image.jpg",
  "filename": "image.jpg",
  "contentType": "image/jpeg",
  "size": 102400
}
```

**Supported File Types:**
- Images: JPEG, PNG, GIF, WebP
- Documents: PDF, TXT, DOC, DOCX

**File Size Limit:** 10MB

### Use Uploaded URLs

When creating or updating devices, use the returned URL:

```http
POST /api/devices
Content-Type: application/json

{
  "brand": "Dell",
  "model": "Laptop 5520",
  "category": "Laptop",
  "description": "Business laptop",
  "availableCount": 5,
  "maxDeviceCount": 10,
  "imageUrl": "https://your-storage.blob.core.windows.net/device-assets/1698765432123_image.jpg",
  "fileUrl": "https://your-storage.blob.core.windows.net/device-assets/1698765432456_manual.pdf"
}
```

## Container Structure

The blob storage container `device-assets` will contain:

```
device-assets/
├── 1698765432123_laptop_image.jpg      # Device images
├── 1698765432456_manual.pdf            # Device manuals/files
├── 1698765432789_camera_photo.png      # More device images
└── ...
```

Files are prefixed with timestamp to ensure uniqueness.

## Troubleshooting

### Common Issues

1. **"Blob Storage is not configured"**
   - Ensure `AZURE_STORAGE_CONNECTION_STRING` is set in `local.settings.json`
   - Verify the connection string is correct

2. **"Failed to upload asset"**
   - Check your storage account permissions
   - Verify the storage account is accessible from your network
   - Check if the container exists and has proper permissions

3. **CORS errors (web uploads)**
   - Configure CORS settings in your storage account
   - Add your domain to allowed origins

### Testing Connection

You can test your blob storage configuration by:

1. Starting the Functions runtime: `npm start`
2. Using a tool like Postman to upload a test file to `/api/upload-asset`
3. Checking if the file appears in your storage account's `device-assets` container

## Cost Considerations

- **Storage costs**: Based on data stored and transactions
- **Bandwidth costs**: For data egress (downloads)
- **Operation costs**: Per API call
- Consider using **Azure CDN** for frequently accessed images to reduce costs and improve performance