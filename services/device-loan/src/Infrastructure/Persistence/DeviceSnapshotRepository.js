"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceSnapshotRepository = void 0;
const CosmosClientFactory_1 = require("../Config/CosmosClientFactory");
class DeviceSnapshotRepository {
    constructor() {
        const databaseId = process.env.COSMOS_DB_DATABASE_NAME || "DeviceLoanDB";
        const containerId = process.env.DEVICE_SNAPSHOTS_CONTAINER_NAME || "DeviceSnapshots";
        this.container = CosmosClientFactory_1.CosmosClientFactory.getClient()
            .database(databaseId)
            .container(containerId);
    }
    /** Save or update a snapshot */
    async saveSnapshot(snapshot) {
        await this.container.items.upsert(snapshot);
    }
    /** Delete a snapshot */
    async deleteSnapshot(deviceId) {
        try {
            await this.container.item(deviceId, deviceId).delete();
        }
        catch {
            // ignore if it doesn't exist
        }
    }
    /** List all devices */
    async listDevices() {
        const query = { query: "SELECT * FROM c" };
        const { resources } = await this.container.items.query(query).fetchAll();
        // sort in memory
        return resources.sort((a, b) => `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`));
    }
    /** Get a device snapshot by id */
    async getSnapshot(deviceId) {
        try {
            const { resource } = await this.container.item(deviceId, deviceId).read();
            return resource ?? null;
        }
        catch {
            return null;
        }
    }
}
exports.DeviceSnapshotRepository = DeviceSnapshotRepository;
//# sourceMappingURL=DeviceSnapshotRepository.js.map