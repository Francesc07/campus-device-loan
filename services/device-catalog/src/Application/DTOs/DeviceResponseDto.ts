/**
 * DTO representing the shape of a device returned to clients.
 */
export interface DeviceResponseDto {
  id: string;
  brand: string;
  model: string;
  category: string;
  description: string;
  availableCount: number;
  maxDeviceCount: number;
  imageUrl?: string;
  fileUrl?: string;
}
