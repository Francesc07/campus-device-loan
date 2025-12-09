"use strict";
// src/API/functions/device-sync-eventgrid.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.deviceSyncEventGrid = deviceSyncEventGrid;
const functions_1 = require("@azure/functions");
const DeviceSnapshotRepository_1 = require("../../Infrastructure/Persistence/DeviceSnapshotRepository");
/**
 * Event Grid Trigger: Device Catalog Sync
 * Loan Service keeps a local read-only copy of all device data
 */
async function deviceSyncEventGrid(event, ctx) {
    try {
        const evtType = event.eventType;
        const data = event.data;
        ctx.log(`📥 LoanService received catalog event: ${evtType} (${data?.id})`);
        const repo = new DeviceSnapshotRepository_1.DeviceSnapshotRepository();
        switch (evtType) {
            case "Device.Snapshot":
            case "Device.Created":
            case "Device.Updated":
                await repo.saveSnapshot({
                    id: data.id,
                    brand: data.brand,
                    model: data.model,
                    category: data.category,
                    description: data.description,
                    availableCount: data.availableCount,
                    maxDeviceCount: data.maxDeviceCount,
                    imageUrl: data.imageUrl,
                    fileUrl: data.fileUrl,
                    lastUpdated: event.eventTime ?? new Date().toISOString()
                });
                ctx.log(`✅ Sync applied for device: ${data.model}`);
                break;
            case "Device.Deleted":
                await repo.deleteSnapshot(data.id);
                ctx.log(`🗑️ Snapshot deleted for device: ${data.id}`);
                break;
            default:
                ctx.warn(`⚠️ Unknown catalog event type: ${evtType}`);
                break;
        }
    }
    catch (err) {
        ctx.error("❌ Error processing device sync event:", err);
        throw err; // Event Grid will retry
    }
}
functions_1.app.eventGrid("device-sync-event-grid", {
    handler: deviceSyncEventGrid,
});
//# sourceMappingURL=device-sync-event-grid.js.map