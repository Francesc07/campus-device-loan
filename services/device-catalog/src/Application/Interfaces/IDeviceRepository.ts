import { Device } from "../../Domain/Entities/Device";

export interface IDeviceRepository {
  listAll(): Promise<Device[]>;
  getById(id: string): Promise<Device | null>;
  create(device: Device): Promise<Device>;
  update(id: string, device: Partial<Device>): Promise<Device>;
  delete(id: string): Promise<boolean>;
}
