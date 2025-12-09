"use strict";
// src/API/functions/list-loans-http.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.listLoansHttp = listLoansHttp;
const functions_1 = require("@azure/functions");
const appServices_1 = require("../../appServices");
const auth0Validation_1 = require("../../Infrastructure/Auth/auth0Validation");
async function listLoansHttp(req, ctx) {
    // Validate authentication and require view:my-loans permission
    const authResult = await (0, auth0Validation_1.requireAuth)(req, ctx, ["view:my-loans"]);
    if ("status" in authResult) {
        return authResult; // Return 401 or 403 error response
    }
    try {
        const userId = req.query.get("userId");
        if (!userId) {
            return { status: 400, jsonBody: { error: "userId is required" } };
        }
        const loans = await appServices_1.appServices.listLoansHandler.execute({ userId });
        return { status: 200, jsonBody: loans };
    }
    catch (err) {
        return { status: 500, jsonBody: { error: err.message } };
    }
}
functions_1.app.http("list-loans-http", {
    methods: ["GET"],
    route: "loan/list",
    authLevel: "anonymous",
    handler: listLoansHttp,
});
//# sourceMappingURL=list-loans-http.js.map