import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { appServices } from "../../appServices";
import { requireAuth } from "../../Infrastructure/Auth/auth0Validation";

export async function listDeviceSnapshotsHttp(
  req: HttpRequest,
  ctx: InvocationContext
): Promise<HttpResponseInit> {
  // Validate authentication and require read:devices permission
  const authResult = await requireAuth(req, ctx, ["read:devices"]);
  if ("status" in authResult) {
    return authResult as HttpResponseInit; // Return 401 or 403 error response
  }
  
  const result = await appServices.listDeviceSnapshotsHandler.handle();

  return {
    status: 200,
    jsonBody: { success: true, count: result.length, data: result }
  };
}

app.http("list-device-snapshots-http", {
  methods: ["GET"],
  route: "devices/list",
  authLevel: "anonymous",
  handler: listDeviceSnapshotsHttp
});
