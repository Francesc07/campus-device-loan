import { IDeviceRepository } from "../Interfaces/IDeviceRepository";
import { DeviceResponseDto } from "../DTOs/DeviceResponseDto";

export class ListDevicesHandler {
  constructor(private readonly repo: IDeviceRepository) {}

  async execute(): Promise<DeviceResponseDto[]> {
    const devices = await this.repo.listAll();
    return devices.sort((a, b) => a.brand.localeCompare(b.brand)) as DeviceResponseDto[];
  }
}
