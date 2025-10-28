// src/Infrastructure/CosmosDeviceRepository.ts
import { CosmosClient } from "@azure/cosmos";
import { BlobServiceClient } from "@azure/storage-blob";
import { Device } from "../../Domain/Entities/Device";
import { IDeviceRepository } from "../../Application/Interfaces/IDeviceRepository";
import { DeviceBrand } from "../../Domain/Enums/DeviceBrand";
import { DeviceCategory } from "../../Domain/Enums/DeviceCategory";

export class CosmosDeviceRepository implements IDeviceRepository {
  private container;
  private blobServiceClient?: BlobServiceClient;
  private blobContainerName = "device-assets";

  constructor() {
    const cosmos = new CosmosClient({
      endpoint: process.env.COSMOS_ENDPOINT!,
      key: process.env.COSMOS_KEY!
    });
    const db = cosmos.database(process.env.COSMOS_DB || "deviceCatalogDb");
    this.container = db.container(process.env.COSMOS_CONTAINER || "devices");

    // Initialize Blob Storage for images & files
    if (process.env.AZURE_STORAGE_CONNECTION_STRING) {
      this.blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
      this.initializeBlobContainer();
    } else {
      console.warn("Azure Blob Storage connection string not provided. File upload functionality will be disabled.");
    }
  }

  /**
   * Ensures the blob container exists for storing device assets.
   */
  private async initializeBlobContainer(): Promise<void> {
    if (!this.blobServiceClient) return;
    
    try {
      const containerClient = this.blobServiceClient.getContainerClient(this.blobContainerName);
      await containerClient.createIfNotExists({
        access: 'blob' // Allow public read access to blobs
      });
    } catch (error) {
      console.error('Error initializing blob container:', error);
    }
  }

  async listAll(): Promise<Device[]> {
    try {
      const { resources } = await this.container.items.query("SELECT * FROM c").fetchAll();
      return resources.map(item => this.mapToDevice(item));
    } catch (error) {
      console.error('Error fetching all devices:', error);
      return [];
    }
  }

  async getById(id: string): Promise<Device | null> {
    try {
      const { resource } = await this.container.item(id, id).read();
      return resource ? this.mapToDevice(resource) : null;
    } catch (error) {
      console.error(`Error fetching device with id ${id}:`, error);
      return null;
    }
  }

  async create(device: Device): Promise<Device> {
    try {
      const { resource } = await this.container.items.create(device);
      return this.mapToDevice(resource);
    } catch (error) {
      console.error('Error creating device:', error);
      throw error;
    }
  }

  async update(id: string, deviceUpdates: Partial<Device>): Promise<Device> {
    try {
      // First get the existing device
      const existingDevice = await this.getById(id);
      if (!existingDevice) {
        throw new Error(`Device with id ${id} not found`);
      }

      // Merge the updates with existing device
      const updatedDevice = new Device(
        existingDevice.id,
        deviceUpdates.brand ?? existingDevice.brand,
        deviceUpdates.model ?? existingDevice.model,
        deviceUpdates.category ?? existingDevice.category,
        deviceUpdates.description ?? existingDevice.description,
        deviceUpdates.availableCount ?? existingDevice.availableCount,
        deviceUpdates.maxDeviceCount ?? existingDevice.maxDeviceCount,
        deviceUpdates.imageUrl ?? existingDevice.imageUrl,
        deviceUpdates.fileUrl ?? existingDevice.fileUrl
      );

      const { resource } = await this.container.item(id, id).replace(updatedDevice);
      return this.mapToDevice(resource);
    } catch (error) {
      console.error(`Error updating device with id ${id}:`, error);
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.container.item(id, id).delete();
      return true;
    } catch (error) {
      console.error(`Error deleting device with id ${id}:`, error);
      return false;
    }
  }

  private mapToDevice(item: any): Device {
    return new Device(
      item.id,
      item.brand || DeviceBrand.Other,
      item.model || "Unknown Model",
      item.category || DeviceCategory.Other,
      item.description || "No description available",
      item.availableCount || 0,
      item.maxDeviceCount || 0,
      item.imageUrl,
      item.fileUrl
    );
  }

  /** 
   * Uploads a device image or file to Blob Storage and returns the public URL.
   */
  async uploadAsset(fileBuffer: Buffer, fileName: string, contentType: string): Promise<string> {
    if (!this.blobServiceClient) {
      throw new Error("Azure Blob Storage is not configured. Please set AZURE_STORAGE_CONNECTION_STRING environment variable.");
    }

    try {
      const containerClient = this.blobServiceClient.getContainerClient(this.blobContainerName);
      
      // Generate unique filename to avoid conflicts
      const timestamp = Date.now();
      const uniqueFileName = `${timestamp}_${fileName}`;
      
      const blockBlobClient = containerClient.getBlockBlobClient(uniqueFileName);
      
      await blockBlobClient.uploadData(fileBuffer, {
        blobHTTPHeaders: { 
          blobContentType: contentType 
        }
      });

      return blockBlobClient.url;
    } catch (error) {
      console.error('Error uploading asset to blob storage:', error);
      throw new Error(`Failed to upload asset: ${error}`);
    }
  }

  /**
   * Deletes an asset from blob storage using its URL
   */
  async deleteAsset(assetUrl: string): Promise<boolean> {
    if (!this.blobServiceClient || !assetUrl) {
      return false;
    }

    try {
      const containerClient = this.blobServiceClient.getContainerClient(this.blobContainerName);
      
      // Extract blob name from URL
      const urlParts = assetUrl.split('/');
      const blobName = urlParts[urlParts.length - 1];
      
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.deleteIfExists();
      
      return true;
    } catch (error) {
      console.error('Error deleting asset from blob storage:', error);
      return false;
    }
  }
}
