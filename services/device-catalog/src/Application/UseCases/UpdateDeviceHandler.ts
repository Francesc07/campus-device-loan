import { IDeviceRepository } from "../Interfaces/IDeviceRepository";
import { UpdateDeviceDto } from "../DTOs/UpdateDeviceDto";
import { DeviceResponseDto } from "../DTOs/DeviceResponseDto";
import { DeviceBrand } from "../../Domain/Enums/DeviceBrand";
import { DeviceCategory } from "../../Domain/Enums/DeviceCategory";

/**
 * Handles updating existing device records.
 * Maps string DTO values into Domain enums for type safety.
 */
export class UpdateDeviceHandler {
  constructor(private readonly repo: IDeviceRepository) {}

  async execute(id: string, updates: UpdateDeviceDto): Promise<DeviceResponseDto> {
    if (!id) throw new Error("Device ID is required for update.");

    // Map plain strings to Domain enums and include new fields
    const mappedUpdates: any = {
      ...updates,
      ...(updates.brand && { brand: updates.brand as DeviceBrand }),
      ...(updates.category && { category: updates.category as DeviceCategory }),
    };

    const updated = await this.repo.update(id, mappedUpdates);
    return this.mapToResponseDto(updated);
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
