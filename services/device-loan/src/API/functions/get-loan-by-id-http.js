"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLoanByIdHttp = getLoanByIdHttp;
// src/API/functions/get-loan-by-id-http.ts
const functions_1 = require("@azure/functions");
const appServices_1 = require("../../appServices");
const auth0Validation_1 = require("../../Infrastructure/Auth/auth0Validation");
async function getLoanByIdHttp(req, ctx) {
    // Validate authentication and require view:my-loans permission
    const authResult = await (0, auth0Validation_1.requireAuth)(req, ctx, ["view:my-loans"]);
    if ("status" in authResult) {
        return authResult; // Return 401 or 403 error response
    }
    const id = req.params.id;
    if (!id) {
        return {
            status: 400,
            jsonBody: { success: false, message: "Loan id is required" },
        };
    }
    try {
        const loan = await appServices_1.appServices.getLoanByIdHandler.execute(id);
        return {
            status: 200,
            jsonBody: { success: true, data: loan },
        };
    }
    catch (err) {
        if (err.message && err.message.includes("not found")) {
            return {
                status: 404,
                jsonBody: { success: false, message: err.message },
            };
        }
        ctx.error("Error getting loan by id", err);
        return {
            status: 500,
            jsonBody: {
                success: false,
                message: err.message ?? "Failed to get loan",
            },
        };
    }
}
functions_1.app.http("get-loan-by-id-http", {
    methods: ["GET"],
    route: "loan/id/{id}",
    authLevel: "anonymous",
    handler: getLoanByIdHttp,
});
//# sourceMappingURL=get-loan-by-id-http.js.map