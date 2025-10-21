import { IDeviceRepository } from "../Interfaces/IDeviceRepository";

/**
 * Handles the logic for listing all available devices.
 * Keeps business rules separate from persistence and HTTP details.
 */
export class ListDevicesHandler {
  constructor(private readonly deviceRepo: IDeviceRepository) {}

  async execute() {
    // Fetch devices via repository
    const devices = await this.deviceRepo.listAll();

    // Optional business logic: sort alphabetically by brand
    return devices.sort((a, b) => a.brand.localeCompare(b.brand));
  }
}
