"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListDeviceSnapshotsUseCase = void 0;
class ListDeviceSnapshotsUseCase {
    constructor(repo) {
        this.repo = repo;
    }
    async execute() {
        const snapshots = await this.repo.listDevices();
        return snapshots
            .sort((a, b) => a.brand.localeCompare(b.brand))
            .map((snap) => ({
            id: snap.id,
            brand: snap.brand,
            model: snap.model,
            category: snap.category,
            description: snap.description,
            availableCount: snap.availableCount,
            maxDeviceCount: snap.maxDeviceCount,
            imageUrl: snap.imageUrl,
            fileUrl: snap.fileUrl,
            lastUpdated: snap.lastUpdated,
        }));
    }
}
exports.ListDeviceSnapshotsUseCase = ListDeviceSnapshotsUseCase;
//# sourceMappingURL=ListDeviceSnapshotsUseCase.js.map