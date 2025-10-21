import { Device } from "../../Domain/Entities/Device";

/**
 * Repository abstraction for accessing device data.
 * Defines the contract that any infrastructure implementation must fulfil.
 */
export interface IDeviceRepository {
  listAll(): Promise<Device[]>;
  getById(id: string): Promise<Device | null>;
}
