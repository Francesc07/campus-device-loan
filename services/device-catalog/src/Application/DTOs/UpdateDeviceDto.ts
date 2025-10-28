import { DeviceBrand } from "../../Domain/Enums/DeviceBrand";
import { DeviceCategory } from "../../Domain/Enums/DeviceCategory";

/**
 * DTO for updating an existing device.
 * Used by PUT /devices/{id}
 */
export interface UpdateDeviceDto {
  brand?: DeviceBrand;
  model?: DeviceCategory;
  category?: string;
  description?: string;
  availableCount?: number;
  maxDeviceCount?: number;
  imageUrl?: string;
  fileUrl?: string;
}
