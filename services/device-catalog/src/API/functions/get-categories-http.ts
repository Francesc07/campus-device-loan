import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { DeviceCategory } from "../../Domain/Enums/DeviceCategory";
import { addCorsHeaders, handlePreflightRequest } from "../../utils/corsUtils";

/**
 * Azure Function to get all available device categories
 * GET /api/categories
 * 
 * Returns array of available device categories for filtering
 */
export async function getCategoriesHttp(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const origin = req.headers.get("origin");

  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    return handlePreflightRequest(origin);
  }

  try {
    // Get all enum values
    const categories = Object.values(DeviceCategory);

    return addCorsHeaders({
      status: 200,
      jsonBody: {
        success: true,
        count: categories.length,
        data: categories
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

app.http("getCategoriesHttp", {
  methods: ["GET", "OPTIONS"],
  route: "categories",
  authLevel: "anonymous",
  handler: getCategoriesHttp
});
