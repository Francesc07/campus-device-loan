"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelLoanHttp = cancelLoanHttp;
const functions_1 = require("@azure/functions");
const appServices_1 = require("../../appServices");
const auth0Validation_1 = require("../../Infrastructure/Auth/auth0Validation");
/**
 * POST /api/loan/cancel
 * Student cancels a pending loan
 */
async function cancelLoanHttp(req, ctx) {
    // Validate authentication and require loan:devices permission
    const authResult = await (0, auth0Validation_1.requireAuth)(req, ctx, ["loan:devices"]);
    if ("status" in authResult) {
        return authResult; // Return 401 or 403 error response
    }
    try {
        const body = (await req.json());
        const { loanId, userId, reason } = body;
        if (!loanId || !userId) {
            return {
                status: 400,
                jsonBody: { error: "loanId and userId are required" }
            };
        }
        const result = await appServices_1.appServices.cancelLoanHandler.execute({
            loanId,
            userId,
            reason,
        });
        return {
            status: 200,
            jsonBody: {
                success: true,
                message: "Loan cancelled successfully",
                data: result
            }
        };
    }
    catch (err) {
        ctx.error("Error cancelling loan:", err);
        return {
            status: 500,
            jsonBody: { error: err.message }
        };
    }
}
functions_1.app.http("cancel-loan-http", {
    methods: ["POST"],
    route: "loan/cancel",
    authLevel: "anonymous",
    handler: cancelLoanHttp,
});
//# sourceMappingURL=cancel-loan-http.js.map