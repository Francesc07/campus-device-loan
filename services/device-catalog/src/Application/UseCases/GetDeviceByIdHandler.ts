import { IDeviceRepository } from "../Interfaces/IDeviceRepository";
import { DeviceResponseDto } from "../DTOs/DeviceResponseDto";

export class GetDeviceByIdHandler {
  constructor(private readonly repo: IDeviceRepository) {}

  async execute(id: string): Promise<DeviceResponseDto> {
    if (!id) throw new Error("Device ID is required.");
    const device = await this.repo.getById(id);
    if (!device) throw new Error(`Device with ID ${id} not found.`);
    return device as DeviceResponseDto;
  }
}
