import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { appServices } from "../../appServices";

/**
 * HTTP Trigger: Full Device Sync
 * Manually trigger a full sync of all devices from Catalog Service
 * Useful for:
 * - Initial setup
 * - Recovery from missed events
 * - Fixing inconsistencies
 */
export async function syncDevicesHttp(
  req: HttpRequest,
  ctx: InvocationContext
): Promise<HttpResponseInit> {
  try {
    ctx.log("🔄 Starting full device sync from Catalog Service...");

    const result = await appServices.syncAllDevicesUseCase.execute();

    ctx.log(`✅ Full sync complete: ${result.synced} synced, ${result.deleted} deleted`);
    
    if (result.errors.length > 0) {
      ctx.warn(`⚠️ Sync completed with ${result.errors.length} errors:`, result.errors);
    }

    return {
      status: 200,
      jsonBody: {
        success: true,
        synced: result.synced,
        deleted: result.deleted,
        errors: result.errors
      }
    };
  } catch (err: any) {
    ctx.error("❌ Full device sync failed:", err.message);
    return {
      status: 500,
      jsonBody: {
        success: false,
        error: err.message
      }
    };
  }
}

app.http("sync-devices-http", {
  route: "admin/sync-devices",
  methods: ["POST"],
  authLevel: "function", // Requires function key for security
  handler: syncDevicesHttp
});
