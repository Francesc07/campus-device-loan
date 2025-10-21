import { IDeviceRepository } from "../Interfaces/IDeviceRepository";

/**
 * Handles retrieval of a single device by its ID.
 * Throws an error if the device does not exist.
 */
export class GetDeviceByIdHandler {
  constructor(private readonly deviceRepo: IDeviceRepository) {}

  async execute(id: string) {
    if (!id) throw new Error("Device ID is required.");

    const device = await this.deviceRepo.getById(id);
    if (!device) throw new Error("Device not found.");

    return device;
  }
}
