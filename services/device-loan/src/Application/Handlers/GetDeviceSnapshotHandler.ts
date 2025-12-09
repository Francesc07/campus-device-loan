// src/Application/Handlers/GetDeviceSnapshotHandler.ts
import { GetDeviceSnapshotUseCase } from "../UseCases/GetDeviceSnapshotUseCase";
import { DeviceSnapshotResponseDto } from "../Dtos/DeviceSnapshotResponseDto";

export class GetDeviceSnapshotHandler {
  constructor(private readonly useCase: GetDeviceSnapshotUseCase) {}

  async execute(deviceId: string): Promise<DeviceSnapshotResponseDto | null> {
    return this.useCase.execute(deviceId);
  }
}
