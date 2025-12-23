// src/Infrastructure/Persistence/DeviceSnapshotRepository.ts
import { Container } from "@azure/cosmos";
import { DeviceSnapshot } from "../Models/DeviceSnapshot";
import { CosmosClientFactory } from "../Config/CosmosClientFactory";
import { IDeviceSnapshotRepository } from "../../Application/Interfaces/IDeviceSnapshotRepository";

/**
 * Cosmos DB repository for device snapshot data.
 * 
 * Manages cached device information synchronized from the Catalog Service.
 * Uses /deviceId as partition key for efficient queries.
 */
export class DeviceSnapshotRepository implements IDeviceSnapshotRepository {
  private container: Container;

  constructor() {
    const databaseId = process.env.COSMOS_DB_DATABASE_NAME || "DeviceLoanDB";
    const containerId =
      process.env.COSMOS_DEVICESNAPSHOTS_CONTAINER_ID || "device-snapshots";

    this.container = CosmosClientFactory.getClient()
      .database(databaseId)
      .container(containerId);
  }

  /**
   * Saves or updates a device snapshot.
   * Uses upsert to handle both create and update operations.
   * @param snapshot - The device snapshot to save
   */
  async saveSnapshot(snapshot: DeviceSnapshot): Promise<void> {
    await this.container.items.upsert(snapshot);
  }

  /**
   * Deletes a device snapshot.
   * @param deviceId - The device ID to delete
   */
  async deleteSnapshot(deviceId: string): Promise<void> {
    try {
      await this.container.item(deviceId, deviceId).delete();
    } catch {
      // Ignore if device doesn't exist
    }
  }

  /**
   * Lists all device snapshots sorted by brand and model.
   * @returns Array of all device snapshots
   */
  async listDevices(): Promise<DeviceSnapshot[]> {
  const query = { query: "SELECT * FROM c" };

  const { resources } =
    await this.container.items.query<DeviceSnapshot>(query).fetchAll();

  // sort in memory
  return resources.sort((a, b) =>
    `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`)
  );
}


  /** Get a device snapshot by id */
  async getSnapshot(deviceId: string): Promise<DeviceSnapshot | null> {
    try {
      // Try point read first (efficient when deviceId field exists)
      const { resource } =
        await this.container.item(deviceId, deviceId).read<DeviceSnapshot>();
      return resource ?? null;
    } catch (error: any) {
      // Fallback to query if point read fails (for documents without deviceId field)
      if (error.code === 404) {
        try {
          const query = {
            query: "SELECT * FROM c WHERE c.id = @id",
            parameters: [{ name: "@id", value: deviceId }]
          };
          const { resources } = await this.container.items.query<DeviceSnapshot>(query).fetchAll();
          return resources.length > 0 ? resources[0] : null;
        } catch {
          return null;
        }
      }
      return null;
    }
  }
}
