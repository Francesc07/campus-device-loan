import { CosmosClient } from "@azure/cosmos";
import { Device } from "../../Domain/Entities/Device";
import { IDeviceRepository } from "../../Application/Interfaces/IDeviceRepository";
import { DeviceCategory } from "../../Domain/Enums/DeviceCategory";
import { DeviceBrand } from "../../Domain/Enums/DeviceBrand";

/**
 * Cosmos DB implementation of the device repository interface.
 * Handles all persistence logic for Device entities.
 */
export class CosmosDeviceRepository implements IDeviceRepository {
  private container;

  constructor() {
    const endpoint = process.env.COSMOS_ENDPOINT!;
    const key = process.env.COSMOS_KEY!;
    const db = process.env.COSMOS_DB!;
    const container = process.env.COSMOS_CONTAINER!;
    const client = new CosmosClient({ endpoint, key });
    this.container = client.database(db).container(container);
  }

  async listAll(): Promise<Device[]> {
    const { resources } = await this.container.items.query("SELECT * FROM c").fetchAll();

    return resources.map((item: any) =>
      new Device(
        item.id,
        (item.brand as DeviceBrand) || DeviceBrand.Other,
        item.model,
        (item.category as DeviceCategory) || DeviceCategory.Other,
        item.description || "No description provided",
        item.availableCount ?? 0
      )
    );
  }

  async getById(id: string): Promise<Device | null> {
    try {
      const { resource } = await this.container.item(id, id).read();
      if (!resource) return null;

      return new Device(
        resource.id,
        (resource.brand as DeviceBrand) || DeviceBrand.Other,
        resource.model,
        (resource.category as DeviceCategory) || DeviceCategory.Other,
        resource.description || "No description provided",
        resource.availableCount ?? 0
      );
    } catch {
      return null;
    }
  }
}
