import { IDeviceSnapshotRepository } from "../Interfaces/IDeviceSnapshotRepository";
import fetch from "node-fetch";

export interface DeviceFromCatalog {
  id: string;
  brand: string;
  model: string;
  category: string;
  description?: string;
  availableCount: number;
  maxDeviceCount: number;
  imageUrl?: string;
  fileUrl?: string;
}

export class SyncAllDevicesUseCase {
  constructor(
    private snapshotRepo: IDeviceSnapshotRepository,
    private catalogServiceUrl: string
  ) {}

  async execute(): Promise<{ synced: number; deleted: number; errors: string[] }> {
    const errors: string[] = [];
    let syncedCount = 0;
    let deletedCount = 0;

    try {
      // 1. Fetch all devices from Catalog Service
      const response = await fetch(`${this.catalogServiceUrl}/api/devices`);
      
      if (!response.ok) {
        throw new Error(`Catalog API returned ${response.status}: ${response.statusText}`);
      }

      const catalogDevices: DeviceFromCatalog[] = await response.json() as DeviceFromCatalog[];
      
      console.log(`📦 Fetched ${catalogDevices.length} devices from Catalog Service`);

      // 2. Get all existing snapshots
      const existingSnapshots = await this.snapshotRepo.listDevices();
      const existingIds = new Set(existingSnapshots.map(s => s.id));
      const catalogIds = new Set(catalogDevices.map(d => d.id));

      // 3. Sync/Update all devices from catalog
      for (const device of catalogDevices) {
        try {
          await this.snapshotRepo.saveSnapshot({
            id: device.id,
            brand: device.brand,
            model: device.model,
            category: device.category,
            description: device.description,
            availableCount: device.availableCount,
            maxDeviceCount: device.maxDeviceCount,
            imageUrl: device.imageUrl,
            fileUrl: device.fileUrl,
            lastUpdated: new Date().toISOString()
          });
          syncedCount++;
        } catch (err: any) {
          errors.push(`Failed to sync device ${device.id}: ${err.message}`);
        }
      }

      // 4. Delete snapshots for devices that no longer exist in catalog
      for (const snapshot of existingSnapshots) {
        if (!catalogIds.has(snapshot.id)) {
          try {
            await this.snapshotRepo.deleteSnapshot(snapshot.id);
            deletedCount++;
            console.log(`🗑️ Deleted orphaned snapshot: ${snapshot.brand} ${snapshot.model}`);
          } catch (err: any) {
            errors.push(`Failed to delete snapshot ${snapshot.id}: ${err.message}`);
          }
        }
      }

      console.log(`✅ Full sync complete: ${syncedCount} synced, ${deletedCount} deleted`);
      
      return { synced: syncedCount, deleted: deletedCount, errors };
    } catch (err: any) {
      throw new Error(`Full device sync failed: ${err.message}`);
    }
  }
}
