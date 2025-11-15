/**
 * Local copy of device catalog data synced from the Catalog Service.
 * Maintains a read-only snapshot for loan validation and display.
 */
export interface DeviceSnapshot {
  id: string;                    // Cosmos DB document id (same as device id)
  brand: string;                 // Device brand (e.g., "Apple", "Dell")
  model: string;                 // Device model (e.g., "MacBook Pro 16")
  category: string;              // Device category (e.g., "Laptop", "Tablet")
  description?: string;          // Device description
  availableCount: number;        // Current available devices
  maxDeviceCount: number;        // Total devices in inventory
  imageUrl?: string;             // Product image URL
  fileUrl?: string;              // Manual/spec sheet URL
  lastUpdated: string;           // ISO timestamp of last sync
}

export class DeviceSnapshot implements DeviceSnapshot {
  id: string;
  brand: string;
  model: string;
  category: string;
  description?: string;
  availableCount: number;
  maxDeviceCount: number;
  imageUrl?: string;
  fileUrl?: string;
  lastUpdated: string;

  constructor(data: {
    id: string;
    brand: string;
    model: string;
    category: string;
    description?: string;
    availableCount: number;
    maxDeviceCount: number;
    imageUrl?: string;
    fileUrl?: string;
    lastUpdated?: string;
  }) {
    this.id = data.id;
    this.brand = data.brand;
    this.model = data.model;
    this.category = data.category;
    this.description = data.description;
    this.availableCount = data.availableCount;
    this.maxDeviceCount = data.maxDeviceCount;
    this.imageUrl = data.imageUrl;
    this.fileUrl = data.fileUrl;
    this.lastUpdated = data.lastUpdated || new Date().toISOString();
  }
}
