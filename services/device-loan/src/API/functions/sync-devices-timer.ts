import { app, InvocationContext, Timer } from "@azure/functions";
import { appServices } from "../../appServices";

/**
 * Timer Trigger: Scheduled Full Device Sync
 * Runs every 6 hours to keep device snapshots in sync with Catalog Service
 * Schedule: "0 0 star-slash-6 star star star" (every 6 hours at minute 0)
 * 
 * This ensures:
 * - No missed events from Event Grid
 * - Recovery from any transient failures
 * - Consistency between Catalog and Loan Service
 */
export async function syncDevicesTimer(
  myTimer: Timer,
  ctx: InvocationContext
): Promise<void> {
  try {
    ctx.log("⏰ Scheduled device sync started at:", new Date().toISOString());

    const result = await appServices.syncAllDevicesUseCase.execute();

    ctx.log(`✅ Scheduled sync complete: ${result.synced} synced, ${result.deleted} deleted`);
    
    if (result.errors.length > 0) {
      ctx.warn(`⚠️ Sync completed with ${result.errors.length} errors:`, result.errors);
    }
  } catch (err: any) {
    ctx.error("❌ Scheduled device sync failed:", err.message);
    throw err; // Let Azure Functions retry logic handle it
  }
}

app.timer("sync-devices-timer", {
  schedule: "0 0 */6 * * *", // Every 6 hours
  handler: syncDevicesTimer
});
