export interface DeviceSnapshot {
  id: string;
  brand: string;
  model: string;
  category: string;
  availableCount: number;
  maxDeviceCount: number;
  lastUpdated: string;
}

export interface IDeviceSnapshotRepository {
  saveSnapshot(snapshot: DeviceSnapshot): Promise<void>;
  deleteSnapshot(deviceId: string): Promise<void>;
  getSnapshot(deviceId: string): Promise<DeviceSnapshot | null>;
}
