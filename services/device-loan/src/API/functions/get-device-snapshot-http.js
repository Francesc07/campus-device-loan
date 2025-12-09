"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDeviceSnapshotHttp = getDeviceSnapshotHttp;
// src/API/functions/get-device-snapshot-http.ts
const functions_1 = require("@azure/functions");
const appServices_1 = require("../../appServices");
const auth0Validation_1 = require("../../Infrastructure/Auth/auth0Validation");
async function getDeviceSnapshotHttp(req, ctx) {
    // Validate authentication and require read:devices permission
    const authResult = await (0, auth0Validation_1.requireAuth)(req, ctx, ["read:devices"]);
    if ("status" in authResult) {
        return authResult; // Return 401 or 403 error response
    }
    const id = req.params.id;
    if (!id) {
        return {
            status: 400,
            jsonBody: { success: false, message: "Device id is required" },
        };
    }
    try {
        const device = await appServices_1.appServices.getDeviceSnapshotHandler.execute(id);
        if (!device) {
            return {
                status: 404,
                jsonBody: { success: false, message: "Device not found" },
            };
        }
        return {
            status: 200,
            jsonBody: { success: true, data: device },
        };
    }
    catch (err) {
        ctx.error("Error getting device snapshot", err);
        return {
            status: 500,
            jsonBody: {
                success: false,
                message: err.message ?? "Failed to get device",
            },
        };
    }
}
functions_1.app.http("get-device-snapshot-http", {
    methods: ["GET"],
    route: "devices/id/{id}",
    authLevel: "anonymous",
    handler: getDeviceSnapshotHttp,
});
//# sourceMappingURL=get-device-snapshot-http.js.map