"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deviceSyncEventGrid = deviceSyncEventGrid;
const functions_1 = require("@azure/functions");
const DeviceSnapshotRepository_1 = require("../../Infrastructure/Persistence/DeviceSnapshotRepository");
/**
 * Event Grid Trigger: Device Catalog Sync
 * Subscribes to: Device.Created, Device.Updated, Device.Deleted
 * Maintains local device snapshots for resilience
 */
async function deviceSyncEventGrid(event, ctx) {
    try {
        ctx.log(`📥 Received event: ${event.eventType} for device ${event.data?.id}`);
        const repo = new DeviceSnapshotRepository_1.DeviceSnapshotRepository();
        switch (event.eventType) {
            case "Device.Snapshot":
            case "Device.Created":
            case "Device.Updated":
                // Upsert device snapshot
                await repo.saveSnapshot({
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
                await repo.deleteSnapshot(event.data.id);
                ctx.log(`🗑️ Deleted device snapshot: ${event.data.id}`);
                break;
            default:
                ctx.warn(`⚠️ Unknown event type: ${event.eventType}`);
        }
    }
    catch (err) {
        ctx.error("❌ Error syncing device snapshot:", err);
        throw err; // Propagate error for Event Grid retry
    }
}
functions_1.app.eventGrid("device-sync-http", {
    handler: deviceSyncEventGrid,
});
//# sourceMappingURL=device-sync-http.js.map