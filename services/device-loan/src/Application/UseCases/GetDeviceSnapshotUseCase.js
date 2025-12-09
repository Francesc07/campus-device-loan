"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetDeviceSnapshotUseCase = void 0;
class GetDeviceSnapshotUseCase {
    constructor(repo) {
        this.repo = repo;
    }
    async execute(deviceId) {
        const snapshot = await this.repo.getSnapshot(deviceId);
        if (!snapshot)
            return null;
        return {
            id: snapshot.id,
            brand: snapshot.brand,
            model: snapshot.model,
            category: snapshot.category,
            description: snapshot.description,
            availableCount: snapshot.availableCount,
            maxDeviceCount: snapshot.maxDeviceCount,
            imageUrl: snapshot.imageUrl,
            fileUrl: snapshot.fileUrl,
            lastUpdated: snapshot.lastUpdated,
        };
    }
}
exports.GetDeviceSnapshotUseCase = GetDeviceSnapshotUseCase;
//# sourceMappingURL=GetDeviceSnapshotUseCase.js.map