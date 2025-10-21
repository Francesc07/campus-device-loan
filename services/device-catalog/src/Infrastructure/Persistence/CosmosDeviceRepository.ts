import { CosmosClient } from "@azure/cosmos";
import { Device } from "../../Domain/Entities/Device";
import { IDeviceRepository } from "../../Application/Interfaces/IDeviceRepository";

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
    return resources;
  }

  async getById(id: string): Promise<Device | null> {
    try {
      const { resource } = await this.container.item(id, id).read();
      return resource || null;
    } catch {
      return null;
    }
  }

  async create(device: Device): Promise<Device> {
    const { resource } = await this.container.items.create(device);
    return resource as Device;
  }

  async update(id: string, updates: Partial<Device>): Promise<Device> {
    const existing = await this.getById(id);
    if (!existing) throw new Error("Device not found.");
    const updated = { ...existing, ...updates };
    const { resource } = await this.container.item(id, id).replace(updated);
    return resource as Device;
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.container.item(id, id).delete();
      return true;
    } catch {
      return false;
    }
  }
}
