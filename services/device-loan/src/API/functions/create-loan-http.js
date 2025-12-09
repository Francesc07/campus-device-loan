"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLoanHttp = createLoanHttp;
const functions_1 = require("@azure/functions");
const appServices_1 = require("../../appServices");
const auth0Validation_1 = require("../../Infrastructure/Auth/auth0Validation");
/**
 * POST /api/loan/create
 * Student initiates a loan (before reservation confirms it)
 */
async function createLoanHttp(req, ctx) {
    // Validate authentication and require loan:devices permission
    const authResult = await (0, auth0Validation_1.requireAuth)(req, ctx, ["loan:devices"]);
    if ("status" in authResult) {
        return authResult; // Return 401 or 403 error response
    }
    try {
        const body = (await req.json());
        const { userId, deviceId } = body;
        if (!userId || !deviceId) {
            return {
                status: 400,
                jsonBody: { error: "userId and deviceId are required" }
            };
        }
        const result = await appServices_1.appServices.createLoanHandler.execute({
            userId,
            deviceId,
        });
        // Provide different messages based on loan status
        const isWaitlisted = result.status === "Waitlisted";
        const statusCode = isWaitlisted ? 202 : 201; // 202 Accepted for waitlist
        const message = isWaitlisted
            ? "Device is currently unavailable. Your request has been added to the waitlist."
            : "Loan request created successfully";
        return {
            status: statusCode,
            jsonBody: {
                success: true,
                message,
                data: result,
                isWaitlisted
            }
        };
    }
    catch (err) {
        ctx.error("Error creating loan:", err);
        return {
            status: 500,
            jsonBody: { error: err.message }
        };
    }
}
functions_1.app.http("create-loan-http", {
    methods: ["POST"],
    route: "loan/create",
    authLevel: "anonymous",
    handler: createLoanHttp,
});
//# sourceMappingURL=create-loan-http.js.map