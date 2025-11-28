// src/Application/Interfaces/IDeviceSnapshotRepository.ts
import { DeviceSnapshot } from "../../Infrastructure/Models/DeviceSnapshot";

export interface IDeviceSnapshotRepository {
  saveSnapshot(snapshot: DeviceSnapshot): Promise<void>;
  deleteSnapshot(deviceId: string): Promise<void>;
  listDevices(): Promise<DeviceSnapshot[]>;
  getSnapshot(deviceId: string): Promise<DeviceSnapshot | null>;
}
