// src/API/functions/get-device-snapshot-http.ts
import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { appServices } from "../../appServices";
import { requireAuth } from "../../Infrastructure/Auth/auth0Validation";

export async function getDeviceSnapshotHttp(
  req: HttpRequest,
  ctx: InvocationContext
): Promise<HttpResponseInit> {
  // Validate authentication and require read:devices permission
  const authResult = await requireAuth(req, ctx, ["read:devices"]);
  if ("status" in authResult) {
    return authResult as HttpResponseInit; // Return 401 or 403 error response
  }

  const id = req.params.id;

  if (!id) {
    return {
      status: 400,
      jsonBody: { success: false, message: "Device id is required" },
    };
  }

  try {
    const device = await appServices.getDeviceSnapshotHandler.execute(id);

    if (!device) {
      return {
        status: 404,
        jsonBody: { success: false, message: "Device not found" },
      };
    }

    return {
      status: 200,
      jsonBody: { success: true, data: device },
    };
  } catch (err: any) {
    ctx.error("Error getting device snapshot", err);
    return {
      status: 500,
      jsonBody: {
        success: false,
        message: err.message ?? "Failed to get device",
      },
    };
  }
}

app.http("get-device-snapshot-http", {
  methods: ["GET"],
  route: "devices/id/{id}",
  authLevel: "anonymous",
  handler: getDeviceSnapshotHttp,
});
