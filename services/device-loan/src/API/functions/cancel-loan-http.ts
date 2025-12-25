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
    ctx.log(`🚫 CANCEL LOAN: Starting loan cancellation request`);
    const body = (await req.json()) as CancelLoanDto;

    const { loanId, userId, reason } = body;

    if (!loanId || !userId) {
      ctx.warn(`⚠️ CANCEL LOAN: Missing required fields - loanId: ${!!loanId}, userId: ${!!userId}`);
      return {
        status: 400,
        jsonBody: { 
          success: false,
          error: "loanId and userId are required",
          userFriendlyMessage: "Loan ID and user ID are required to cancel a loan."
        }
      };
    }

    ctx.log(`🔄 CANCEL LOAN: Processing cancellation for loan ${loanId} by user ${userId}`);

    const result = await appServices.cancelLoanHandler.execute({
      loanId,
      userId,
      reason,
     
    });

    ctx.log(`✅ CANCEL LOAN: Successfully cancelled loan ${loanId}`);

    return {
      status: 200,
      jsonBody: {
        success: true,
        message: "Loan cancelled successfully",
        data: result
      }
    };
    
  } catch (err: any) {
    ctx.error(`❌ CANCEL LOAN: Failed to cancel loan - ${err.message}`, {
      error: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString()
    });

    let userMessage = "We're having trouble cancelling your loan. Please try again in a moment.";
    let statusCode = 500;

    if (err.message.includes("Loan not found")) {
      userMessage = "The loan you're trying to cancel could not be found. It may have already been cancelled or completed.";
      statusCode = 404;
      ctx.warn(`⚠️ CANCEL LOAN: Loan not found`);
    } else if (err.message.includes("Unauthorized")) {
      userMessage = "You don't have permission to cancel this loan. You can only cancel your own loans.";
      statusCode = 403;
      ctx.warn(`⚠️ CANCEL LOAN: Authorization failed - user doesn't own this loan`);
    } else if (err.message.includes("timeout") || err.message.includes("ECONNREFUSED")) {
      userMessage = "The service is temporarily unavailable. Please try again shortly.";
      statusCode = 503;
      ctx.error(`🔥 CANCEL LOAN: Service unavailable`);
    } else if (err.message.includes("database") || err.message.includes("cosmos")) {
      userMessage = "We're experiencing database connectivity issues. Please try again in a moment.";
      statusCode = 503;
      ctx.error(`🔥 CANCEL LOAN: Database connection issue`);
    }

    return {
      status: statusCode,
      jsonBody: { 
        success: false,
        error: err.message,
        userFriendlyMessage: userMessage,
        timestamp: new Date().toISOString(),
        retryable: statusCode >= 500,
        errorId: ctx.invocationId
      }
    };
  }
}

app.http("cancel-loan-http", {
  methods: ["POST"],
  route: "loan/cancel",
  authLevel: "anonymous",
  handler: cancelLoanHttp,
});
