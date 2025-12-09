import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { appServices } from "../../appServices";
import { CancelLoanDto } from "../../Application/Dtos/CancelLoanDto";
import { requireAuth } from "../../Infrastructure/Auth/auth0Validation";

/**
 * POST /api/loan/cancel
 * Student cancels a pending loan
 */
export async function cancelLoanHttp(
  req: HttpRequest,
  ctx: InvocationContext
): Promise<HttpResponseInit> {
  // Validate authentication and require loan:devices permission
  const authResult = await requireAuth(req, ctx, ["loan:devices"]);
  if ("status" in authResult) {
    return authResult as HttpResponseInit; // Return 401 or 403 error response
  }

  try {
    const body = (await req.json()) as CancelLoanDto;

    const { loanId, userId, reason } = body;

    if (!loanId || !userId) {
      return {
        status: 400,
        jsonBody: { error: "loanId and userId are required" }
      };
    }

    const result = await appServices.cancelLoanHandler.execute({
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
    
  } catch (err: any) {
    ctx.error("Error cancelling loan:", err);
    return {
      status: 500,
      jsonBody: { error: err.message }
    };
  }
}

app.http("cancel-loan-http", {
  methods: ["POST"],
  route: "loan/cancel",
  authLevel: "anonymous",
  handler: cancelLoanHttp,
});
