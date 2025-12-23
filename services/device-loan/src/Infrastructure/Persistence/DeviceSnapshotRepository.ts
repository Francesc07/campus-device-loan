// src/Infrastructure/Persistence/DeviceSnapshotRepository.ts
import { Container } from "@azure/cosmos";
import { DeviceSnapshot } from "../Models/DeviceSnapshot";
import { CosmosClientFactory } from "../Config/CosmosClientFactory";
import { IDeviceSnapshotRepository } from "../../Application/Interfaces/IDeviceSnapshotRepository";

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

  /** Save or update a snapshot */
  async saveSnapshot(snapshot: DeviceSnapshot): Promise<void> {
    await this.container.items.upsert(snapshot);
  }

  /** Delete a snapshot */
  async deleteSnapshot(deviceId: string): Promise<void> {
    try {
      await this.container.item(deviceId, deviceId).delete();
    } catch {
      // ignore if it doesn't exist
    }
  }

  /** List all devices */
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
