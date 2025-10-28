import { DeviceCategory } from "../Enums/DeviceCategory";
import { DeviceBrand } from "../Enums/DeviceBrand";

// src/Domain/Device.ts
export class Device {
  /**
   * Represents a device model entry in the catalog.
   * Maintains both total capacity and real-time availability.
   * Integrates with Azure Blob Storage for images/files.
   */
  constructor(
    public id: string,
    public brand: DeviceBrand,
    public model: string,
    public category: DeviceCategory,
    public description: string,
    public availableCount: number,
    public maxDeviceCount: number,
    public imageUrl?: string,
    public fileUrl?: string
  ) {
    // Business rule: availableCount can never exceed maxDeviceCount
    if (availableCount > maxDeviceCount) {
      throw new Error("availableCount cannot exceed maxDeviceCount");
    }
  }
}
