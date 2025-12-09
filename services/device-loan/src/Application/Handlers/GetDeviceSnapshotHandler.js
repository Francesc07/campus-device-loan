"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetDeviceSnapshotHandler = void 0;
class GetDeviceSnapshotHandler {
    constructor(useCase) {
        this.useCase = useCase;
    }
    async execute(deviceId) {
        return this.useCase.execute(deviceId);
    }
}
exports.GetDeviceSnapshotHandler = GetDeviceSnapshotHandler;
//# sourceMappingURL=GetDeviceSnapshotHandler.js.map