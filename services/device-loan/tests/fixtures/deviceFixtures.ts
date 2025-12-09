// tests/fixtures/deviceFixtures.ts
import { DeviceSnapshot } from "../../src/Infrastructure/Models/DeviceSnapshot";

export const createDeviceSnapshot = (overrides: Partial<DeviceSnapshot> = {}): DeviceSnapshot => ({
  id: "device-123",
  brand: "Apple",
  model: "MacBook Pro",
  category: "Laptop",
  description: "High-performance laptop",
  availableCount: 5,
  maxDeviceCount: 10,
  imageUrl: "https://example.com/image.jpg",
  lastUpdated: new Date().toISOString(),
  ...overrides
});

export const availableDevice: DeviceSnapshot = createDeviceSnapshot({
  id: "device-available",
  availableCount: 3,
  maxDeviceCount: 5
});

export const unavailableDevice: DeviceSnapshot = createDeviceSnapshot({
  id: "device-unavailable",
  availableCount: 0,
  maxDeviceCount: 5
});

export const singleAvailableDevice: DeviceSnapshot = createDeviceSnapshot({
  id: "device-single",
  availableCount: 1,
  maxDeviceCount: 10
});
