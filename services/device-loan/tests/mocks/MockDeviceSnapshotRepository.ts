// tests/mocks/MockDeviceSnapshotRepository.ts
import { IDeviceSnapshotRepository } from "../../src/Application/Interfaces/IDeviceSnapshotRepository";
import { DeviceSnapshot } from "../../src/Infrastructure/Models/DeviceSnapshot";

interface SnapshotWithVersion extends DeviceSnapshot {
  _version?: number;
}

export class MockDeviceSnapshotRepository implements IDeviceSnapshotRepository {
  private snapshots: Map<string, SnapshotWithVersion> = new Map();
  private callCounts: { [key: string]: number } = {};
  private operationLocks: Map<string, Promise<void>> = new Map();

  async getSnapshot(deviceId: string): Promise<DeviceSnapshot | null> {
    this.incrementCallCount('getSnapshot');
    
    // Simulate eventual consistency
    await this.simulateNetworkLatency();
    
    const snapshot = this.snapshots.get(deviceId);
    return snapshot ? this.stripVersion(snapshot) : null;
  }

  async listDevices(): Promise<DeviceSnapshot[]> {
    this.incrementCallCount('listDevices');
    
    await this.simulateNetworkLatency();
    
    return Array.from(this.snapshots.values()).map(s => this.stripVersion(s));
  }

  async saveSnapshot(snapshot: DeviceSnapshot): Promise<void> {
    this.incrementCallCount('saveSnapshot');
    
    // Simulate upsert with optimistic concurrency
    await this.withLock(snapshot.id, async () => {
      const existing = this.snapshots.get(snapshot.id);
      const version = existing ? ((existing as SnapshotWithVersion)._version || 1) + 1 : 1;
      
      const versionedSnapshot: SnapshotWithVersion = {
        ...snapshot,
        _version: version,
        lastUpdated: new Date().toISOString()
      };
      
      this.snapshots.set(snapshot.id, versionedSnapshot);
    });
  }

  async deleteSnapshot(deviceId: string): Promise<void> {
    this.incrementCallCount('deleteSnapshot');
    
    await this.withLock(deviceId, async () => {
      this.snapshots.delete(deviceId);
    });
  }

  // Test utilities
  clear(): void {
    this.snapshots.clear();
    this.callCounts = {};
    this.operationLocks.clear();
  }

  addSnapshot(snapshot: DeviceSnapshot): void {
    const versionedSnapshot: SnapshotWithVersion = {
      ...snapshot,
      _version: 1
    };
    this.snapshots.set(snapshot.id, versionedSnapshot);
  }

  getCallCount(method: string): number {
    return this.callCounts[method] || 0;
  }

  private incrementCallCount(method: string): void {
    this.callCounts[method] = (this.callCounts[method] || 0) + 1;
  }

  // Simulate database locking mechanism
  private async withLock<T>(key: string, operation: () => Promise<T>): Promise<T> {
    // Wait for any existing operation on this key
    while (this.operationLocks.has(key)) {
      await this.operationLocks.get(key);
      await new Promise(resolve => setImmediate(resolve));
    }

    // Create new lock
    let releaseLock: () => void;
    const lockPromise = new Promise<void>(resolve => {
      releaseLock = resolve;
    });
    this.operationLocks.set(key, lockPromise);

    try {
      await this.simulateNetworkLatency();
      return await operation();
    } finally {
      this.operationLocks.delete(key);
      releaseLock!();
    }
  }

  // Simulate network latency (1-5ms)
  private async simulateNetworkLatency(): Promise<void> {
    const latency = Math.random() * 4 + 1;
    await new Promise(resolve => setTimeout(resolve, latency));
  }

  // Remove internal version field
  private stripVersion(snapshot: SnapshotWithVersion): DeviceSnapshot {
    const { _version, ...clean } = snapshot;
    return clean;
  }
}
