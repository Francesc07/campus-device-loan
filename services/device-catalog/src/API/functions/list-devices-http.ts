import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { ListDevicesHandler } from "../../Application/UseCases/ListDevicesHandler";
import { appServices } from "../../appServices";
import { addCorsHeaders, handlePreflightRequest } from "../../utils/corsUtils";

export async function listDevicesHttp(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const origin = req.headers.get("origin") || req.headers.get("Origin");

  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    context.log("Handling OPTIONS preflight request from origin:", origin);
    return handlePreflightRequest(origin);
  }

  try {
    context.log("Processing GET request from origin:", origin);
    const handler = new ListDevicesHandler(appServices.deviceRepository);
    const devices = await handler.execute();
    
    const response = addCorsHeaders({
      status: 200,
      jsonBody: { success: true, count: devices.length, data: devices }
    }, origin);
    
    context.log("Response headers:", JSON.stringify(response.headers));
    return response;
  } catch (err: any) {
    context.error(err);
    
    return addCorsHeaders({
      status: 500,
      jsonBody: { success: false, message: err.message }
    }, origin);
  }
}

app.http("listDevicesHttp", { 
  methods: ["GET", "OPTIONS"], 
  route: "devices", 
  authLevel: "anonymous", 
  handler: listDevicesHttp 
});
