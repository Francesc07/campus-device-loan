export interface DeviceSnapshotResponseDto {
  id: string;
  brand: string;
  model: string;
  category: string;
  description: string;
  availableCount: number;
  maxDeviceCount: number;
  imageUrl?: string;
  fileUrl?: string;
  lastUpdated?: string;
}
