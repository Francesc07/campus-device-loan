import { IDeviceRepository } from "../Interfaces/IDeviceRepository";
import { CreateDeviceDto } from "../DTOs/CreateDeviceDto";
import { DeviceResponseDto } from "../DTOs/DeviceResponseDto";
import { Device } from "../../Domain/Entities/Device";
import { DeviceBrand } from "../../Domain/Enums/DeviceBrand";
import { DeviceCategory } from "../../Domain/Enums/DeviceCategory";
import { randomUUID } from "crypto";

export class CreateDeviceHandler {
  constructor(private readonly repo: IDeviceRepository) {}

  async execute(input: CreateDeviceDto): Promise<DeviceResponseDto> {
    const device = new Device(
      randomUUID(),
      input.brand as DeviceBrand,
      input.model,
      input.category as DeviceCategory,
      input.description,
      input.availableCount
    );

    const created = await this.repo.create(device);
    return created as DeviceResponseDto;
  }
}
