import { IDeviceRepository } from "../Interfaces/IDeviceRepository";

export class DeleteDeviceHandler {
  constructor(private readonly repo: IDeviceRepository) {}

  async execute(id: string): Promise<void> {
    if (!id) throw new Error("Device ID is required for deletion.");
    const deleted = await this.repo.delete(id);
    if (!deleted) throw new Error(`Device with ID ${id} not found.`);
  }
}
