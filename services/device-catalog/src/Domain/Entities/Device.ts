import { DeviceCategory } from "../Enums/DeviceCategory";
import { DeviceBrand } from "../Enums/DeviceBrand";

/**
 * Represents a device entity in the loan system.
 * Encapsulates all relevant attributes used across layers.
 */
export class Device {
  constructor(
    public id: string,
    public brand: DeviceBrand,
    public model: string,
    public category: DeviceCategory,
    public description: string,
    public availableCount: number
  ) {}
}
