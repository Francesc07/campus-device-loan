import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { appServices } from "../../appServices";

/**
 * DELETE /loans/{loanId}
 * Cancels a pending loan before pickup
 * Publishes: Loan.Cancelled event
 */
export async function cancelLoanHttp(req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> {
  try {
    const loanId = req.params.loanId;
    const body = await req.json().catch(() => ({})) as { reason?: string };
    
    if (!loanId) {
      return {
        status: 400,
        jsonBody: { error: "loanId is required" }
      };
    }

    const loan = await appServices.cancelLoanHandler.execute({
      loanId,
      userId: "", // Not needed for cancel by ID
      reason: body.reason
    });

    if (!loan) {
      return {
        status: 404,
        jsonBody: { error: "Loan not found" }
      };
    }

    ctx.log(`Loan cancelled: ${loanId}`);

    return {
      status: 200,
      jsonBody: {
        success: true,
        message: "Loan cancelled successfully",
        data: loan
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

app.http("cancelLoanHttp", {
  methods: ["DELETE"],
  route: "loans/{loanId}",
  authLevel: "anonymous",
  handler: cancelLoanHttp,
});
