"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListDeviceSnapshotsHandler = void 0;
class ListDeviceSnapshotsHandler {
    constructor(useCase) {
        this.useCase = useCase;
    }
    async handle() {
        return this.useCase.execute();
    }
}
exports.ListDeviceSnapshotsHandler = ListDeviceSnapshotsHandler;
//# sourceMappingURL=ListDeviceSnapshotsHandler.js.map