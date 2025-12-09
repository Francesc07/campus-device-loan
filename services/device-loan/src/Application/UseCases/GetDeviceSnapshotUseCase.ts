// src/Application/UseCases/GetDeviceSnapshotUseCase.ts
import { IDeviceSnapshotRepository } from "../Interfaces/IDeviceSnapshotRepository";
import { DeviceSnapshotResponseDto } from "../Dtos/DeviceSnapshotResponseDto";

export class GetDeviceSnapshotUseCase {
  constructor(private readonly repo: IDeviceSnapshotRepository) {}

  async execute(deviceId: string): Promise<DeviceSnapshotResponseDto | null> {
    const snapshot = await this.repo.getSnapshot(deviceId);
    if (!snapshot) return null;

    return {
      id: snapshot.id,
      brand: snapshot.brand,
      model: snapshot.model,
      category: snapshot.category,
      description: snapshot.description,
      availableCount: snapshot.availableCount,
      maxDeviceCount: snapshot.maxDeviceCount,
      imageUrl: snapshot.imageUrl,
      fileUrl: snapshot.fileUrl,
      lastUpdated: snapshot.lastUpdated,
    };
  }
}
