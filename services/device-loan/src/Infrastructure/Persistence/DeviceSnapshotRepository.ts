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
      process.env.DEVICE_SNAPSHOTS_CONTAINER_NAME || "DeviceSnapshots";

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
      const { resource } =
        await this.container.item(deviceId, deviceId).read<DeviceSnapshot>();
      return resource ?? null;
    } catch {
      return null;
    }
  }
}
