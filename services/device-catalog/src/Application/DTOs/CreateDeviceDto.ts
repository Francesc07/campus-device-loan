export interface CreateDeviceDto {
  brand: string;
  model: string;
  category: string;
  description: string;
  availableCount: number;
  maxDeviceCount: number;
  imageUrl?: string;
  fileUrl?: string;
}
