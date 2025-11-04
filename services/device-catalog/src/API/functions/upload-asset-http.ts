import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { CosmosDeviceRepository } from "../../Infrastructure/Persistence/CosmosDeviceRepository";
import { ErrorResponseDto } from "../../Application/DTOs/ErrorResponseDto";
import { addCorsHeaders, handlePreflightRequest } from "../../utils/corsUtils";

/**
 * Azure Function to handle file uploads for device assets (images and files).
 * Accepts multipart/form-data with file uploads and returns the uploaded asset URL.
 * 
 * POST /api/upload-asset
 * Content-Type: multipart/form-data
 * Body: file (binary data)
 * 
 * Returns:
 * - 200: { "url": "https://...blob.url" }
 * - 400: Invalid file or missing file
 * - 500: Upload failed
 */
export async function uploadAssetHttp(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log(`HTTP function processed request for url "${request.url}"`);
  
  const origin = request.headers.get("origin");

  // Handle preflight OPTIONS request
  if (request.method === "OPTIONS") {
    return handlePreflightRequest(origin);
  }

  try {
    // Get the form data
    const formData = await request.formData();
    const fileEntry = formData.get('file');
    
    // Check if we got a File object
    if (!fileEntry || typeof fileEntry === 'string') {
      const error: ErrorResponseDto = {
        success: false,
        error: "INVALID_FILE_FORMAT",
        message: "Invalid file format. Please upload a binary file.",
        timestamp: new Date().toISOString()
      };
      return addCorsHeaders({
        status: 400,
        jsonBody: error
      }, origin);
    }
    
    const file = fileEntry as any; // Use any to avoid type conflicts between different File implementations
    
    if (!file || !file.name || !file.type || typeof file.size !== 'number') {
      const error: ErrorResponseDto = {
        success: false,
        error: "MISSING_FILE",
        message: "No file provided. Please include a file in the 'file' field of the form data.",
        timestamp: new Date().toISOString()
      };
      return addCorsHeaders({
        status: 400,
        jsonBody: error
      }, origin);
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      const error: ErrorResponseDto = {
        success: false,
        error: "FILE_TOO_LARGE",
        message: `File size too large. Maximum size is ${maxSize / 1024 / 1024}MB.`,
        timestamp: new Date().toISOString()
      };
      return addCorsHeaders({
        status: 400,
        jsonBody: error
      }, origin);
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'text/plain', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      const error: ErrorResponseDto = {
        success: false,
        error: "INVALID_FILE_TYPE",
        message: `File type not allowed. Supported types: ${allowedTypes.join(', ')}`,
        timestamp: new Date().toISOString()
      };
      return addCorsHeaders({
        status: 400,
        jsonBody: error
      }, origin);
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to blob storage
    const repository = new CosmosDeviceRepository();
    const assetUrl = await repository.uploadAsset(buffer, file.name, file.type);

    return addCorsHeaders({
      status: 200,
      jsonBody: {
        url: assetUrl,
        filename: file.name,
        contentType: file.type,
        size: file.size
      }
    }, origin);

  } catch (error) {
    context.error('Error uploading asset:', error);
    
    const errorResponse: ErrorResponseDto = {
      success: false,
      error: "UPLOAD_FAILED",
      message: error instanceof Error ? error.message : "Failed to upload asset",
      timestamp: new Date().toISOString()
    };
    
    return addCorsHeaders({
      status: 500,
      jsonBody: errorResponse
    }, origin);
  }
}

app.http("upload-asset", {
  methods: ["POST", "OPTIONS"],
  authLevel: "anonymous",
  route: "upload-asset",
  handler: uploadAssetHttp,
});