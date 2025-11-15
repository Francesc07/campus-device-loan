import { app, InvocationContext } from "@azure/functions";
import { DeviceSnapshotRepository } from "../../Infrastructure/Persistence/DeviceSnapshotRepository";

/**
 * Event Grid Trigger: Device Catalog Sync
 * Subscribes to: Device.Created, Device.Updated, Device.Deleted
 * Maintains local device snapshots for resilience
 */
export async function deviceSyncEventGrid(event: any, ctx: InvocationContext): Promise<void> {
  try {
    ctx.log(`📥 Received event: ${event.eventType} for device ${event.data?.id}`);

    const repo = new DeviceSnapshotRepository();

    switch (event.eventType) {
      case "Device.Created":
      case "Device.Updated":
        // Upsert device snapshot
        await repo.upsert({
          id: event.data.id,
          brand: event.data.brand,
          model: event.data.model,
          category: event.data.category,
          description: event.data.description,
          availableCount: event.data.availableCount,
          maxDeviceCount: event.data.maxDeviceCount,
          imageUrl: event.data.imageUrl,
          fileUrl: event.data.fileUrl,
          lastUpdated: event.eventTime || new Date().toISOString()
        });
        ctx.log(`✅ Synced device snapshot: ${event.data.model}`);
        break;

      case "Device.Deleted":
        // Remove device snapshot
        await repo.delete(event.data.id);
        ctx.log(`🗑️ Deleted device snapshot: ${event.data.id}`);
        break;

      default:
        ctx.warn(`⚠️ Unknown event type: ${event.eventType}`);
    }
  } catch (err: any) {
    ctx.error("❌ Error syncing device snapshot:", err);
    throw err; // Propagate error for Event Grid retry
  }
}

app.eventGrid("deviceSyncEventGrid", {
  handler: deviceSyncEventGrid,
});
