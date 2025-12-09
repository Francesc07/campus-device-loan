// src/Application/UseCases/ListDeviceSnapshotsUseCase.ts
import { IDeviceSnapshotRepository } from "../Interfaces/IDeviceSnapshotRepository";
import { DeviceSnapshotResponseDto } from "../Dtos/DeviceSnapshotResponseDto";

export class ListDeviceSnapshotsUseCase {
  constructor(private readonly repo: IDeviceSnapshotRepository) {}

  async execute(): Promise<DeviceSnapshotResponseDto[]> {
    const snapshots = await this.repo.listDevices();

    return snapshots
      .sort((a, b) => a.brand.localeCompare(b.brand))
      .map((snap) => ({
        id: snap.id,
        brand: snap.brand,
        model: snap.model,
        category: snap.category,
        description: snap.description,
        availableCount: snap.availableCount,
        maxDeviceCount: snap.maxDeviceCount,
        imageUrl: snap.imageUrl,
        fileUrl: snap.fileUrl,
        lastUpdated: snap.lastUpdated,
      }));
  }
}
