"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listDeviceSnapshotsHttp = listDeviceSnapshotsHttp;
const functions_1 = require("@azure/functions");
const appServices_1 = require("../../appServices");
const auth0Validation_1 = require("../../Infrastructure/Auth/auth0Validation");
async function listDeviceSnapshotsHttp(req, ctx) {
    // Validate authentication and require read:devices permission
    const authResult = await (0, auth0Validation_1.requireAuth)(req, ctx, ["read:devices"]);
    if ("status" in authResult) {
        return authResult; // Return 401 or 403 error response
    }
    const result = await appServices_1.appServices.listDeviceSnapshotsHandler.handle();
    return {
        status: 200,
        jsonBody: { success: true, count: result.length, data: result }
    };
}
functions_1.app.http("list-device-snapshots-http", {
    methods: ["GET"],
    route: "devices/list",
    authLevel: "anonymous",
    handler: listDeviceSnapshotsHttp
});
//# sourceMappingURL=list-device-snapshots-http.js.map