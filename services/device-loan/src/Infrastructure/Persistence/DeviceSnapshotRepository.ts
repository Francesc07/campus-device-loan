import { Container } from "@azure/cosmos";
import { DeviceSnapshot } from "../Models/DeviceSnapshot";
import { CosmosClientFactory } from "../Config/CosmosClientFactory";

/**
 * Repository for managing local device catalog snapshots.
 * Synced from the Catalog Service via Event Grid.
 */
export class DeviceSnapshotRepository {
  private container: Container;

  constructor() {
    const databaseId = process.env.COSMOS_DB_DATABASE;
    const containerId = process.env.COSMOS_DEVICESNAPSHOTS_CONTAINER_ID ;

    this.container = CosmosClientFactory.getContainer(databaseId, containerId);
  }

  /**
   * Upsert (insert or update) a device snapshot from catalog sync.
   */
  async upsert(deviceData: any): Promise<DeviceSnapshot> {
    const snapshot = new DeviceSnapshot({
      id: deviceData.id,
      brand: deviceData.brand,
      model: deviceData.model,
      category: deviceData.category,
      description: deviceData.description,
      availableCount: deviceData.availableCount,
      maxDeviceCount: deviceData.maxDeviceCount,
      imageUrl: deviceData.imageUrl,
      fileUrl: deviceData.fileUrl,
      lastUpdated: deviceData.lastUpdated || new Date().toISOString(),
    });

    await this.container.items.upsert(snapshot);
    console.log(`✅ Synced device snapshot: ${snapshot.model} (${snapshot.id})`);
    return snapshot;
  }

  /**
   * Delete a device snapshot (when device is removed from catalog).
   */
  async delete(deviceId: string): Promise<void> {
    try {
      await this.container.item(deviceId, deviceId).delete();
      console.log(`🗑️ Deleted device snapshot: ${deviceId}`);
    } catch (error: any) {
      if (error.code === 404) {
        console.log(`⚠️ Device snapshot ${deviceId} not found, skipping deletion`);
      } else {
        throw error;
      }
    }
  }

  /**
   * Get a device snapshot by ID.
   */
  async findById(deviceId: string): Promise<DeviceSnapshot | null> {
    try {
      const { resource } = await this.container.item(deviceId, deviceId).read<DeviceSnapshot>();
      return resource || null;
    } catch (error: any) {
      if (error.code === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * List all device snapshots (for catalog browsing).
   */
  async findAll(): Promise<DeviceSnapshot[]> {
    const querySpec = {
      query: "SELECT * FROM c ORDER BY c.brand, c.model",
    };

    const { resources } = await this.container.items.query<DeviceSnapshot>(querySpec).fetchAll();
    return resources;
  }

  /**
   * Find devices by category.
   */
  async findByCategory(category: string): Promise<DeviceSnapshot[]> {
    const querySpec = {
      query: "SELECT * FROM c WHERE c.category = @category ORDER BY c.brand, c.model",
      parameters: [{ name: "@category", value: category }],
    };

    const { resources } = await this.container.items.query<DeviceSnapshot>(querySpec).fetchAll();
    return resources;
  }
}
