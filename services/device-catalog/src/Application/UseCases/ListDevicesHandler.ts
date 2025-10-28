import { IDeviceRepository } from "../Interfaces/IDeviceRepository";
import { DeviceResponseDto } from "../DTOs/DeviceResponseDto";

export class ListDevicesHandler {
  constructor(private readonly repo: IDeviceRepository) {}

  async execute(): Promise<DeviceResponseDto[]> {
    const devices = await this.repo.listAll();
    return devices
      .sort((a, b) => a.brand.localeCompare(b.brand))
      .map(device => this.mapToResponseDto(device));
  }

  private mapToResponseDto(device: any): DeviceResponseDto {
    return {
      id: device.id,
      brand: device.brand,
      model: device.model,
      category: device.category,
      description: device.description,
      availableCount: device.availableCount,
      maxDeviceCount: device.maxDeviceCount,
      imageUrl: device.imageUrl,
      fileUrl: device.fileUrl
    };
  }
}
