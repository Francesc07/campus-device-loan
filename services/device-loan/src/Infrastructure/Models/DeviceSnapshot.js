"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceSnapshot = void 0;
class DeviceSnapshot {
    constructor(data) {
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
exports.DeviceSnapshot = DeviceSnapshot;
//# sourceMappingURL=DeviceSnapshot.js.map