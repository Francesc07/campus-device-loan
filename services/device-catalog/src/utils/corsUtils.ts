// src/utils/corsUtils.ts
import { HttpResponseInit } from "@azure/functions";

/**
 * CORS configuration for the Campus Device Catalog API
 */
export const corsConfig = {
  allowedOrigins: [
    "http://localhost:5173",
    "https://localhost:5173",
    "http://localhost:3000",
    "https://localhost:3000"
  ],
  allowedMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type", 
    "Authorization", 
    "X-Requested-With",
    "Accept",
    "Origin"
  ],
  maxAge: 86400
};

/**
 * Adds CORS headers to HTTP response
 */
export function addCorsHeaders(response: HttpResponseInit, origin?: string): HttpResponseInit {
  const existingHeaders = response.headers || {};
  
  const isAllowedOrigin = !origin || corsConfig.allowedOrigins.includes(origin) || origin === "*";
  
  const corsHeaders: Record<string, string> = {};
  
  if (isAllowedOrigin) {
    corsHeaders["Access-Control-Allow-Origin"] = origin || "*";
    corsHeaders["Access-Control-Allow-Methods"] = corsConfig.allowedMethods.join(", ");
    corsHeaders["Access-Control-Allow-Headers"] = corsConfig.allowedHeaders.join(", ");
    corsHeaders["Access-Control-Max-Age"] = corsConfig.maxAge.toString();
  }

  return {
    ...response,
    headers: {
      ...existingHeaders,
      ...corsHeaders
    }
  };
}

/**
 * Handles preflight OPTIONS requests
 */
export function handlePreflightRequest(origin?: string): HttpResponseInit {
  return addCorsHeaders({
    status: 200,
    body: ""
  }, origin);
}
