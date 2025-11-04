import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { DeviceBrand } from "../../Domain/Enums/DeviceBrand";
import { addCorsHeaders, handlePreflightRequest } from "../../utils/corsUtils";

/**
 * Azure Function to get all available device brands
 * GET /api/brands
 * 
 * Returns array of available device brands for filtering
 */
export async function getBrandsHttp(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const origin = req.headers.get("origin");

  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    return handlePreflightRequest(origin);
  }

  try {
    // Get all enum values
    const brands = Object.values(DeviceBrand);

    return addCorsHeaders({
      status: 200,
      jsonBody: {
        success: true,
        count: brands.length,
        data: brands
      }
    }, origin);
  } catch (err: any) {
    context.error(err);

    return addCorsHeaders({
      status: 500,
      jsonBody: {
        success: false,
        message: err.message
      }
    }, origin);
  }
}

app.http("getBrandsHttp", {
  methods: ["GET", "OPTIONS"],
  route: "brands",
  authLevel: "anonymous",
  handler: getBrandsHttp
});
