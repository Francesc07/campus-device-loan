import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { CancelLoanHandler } from "../../Application/useCases/CancelLoanHandler";
import { CosmosLoanRepository } from "../../Infrastructure/CosmosLoanRepository";
import { LoanEventPublisher } from "../../Infrastructure/EventGrid/LoanEventPublisher";

/**
 * DELETE /loans/{loanId}
 * Cancels a loan before pickup
 * Publishes: Loan.Cancelled event
 */
export async function cancelLoanHttp(req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> {
  try {
    const loanId = req.params.loanId;
    
    if (!loanId) {
      return {
        status: 400,
        jsonBody: { error: "loanId is required" }
      };
    }

    const handler = new CancelLoanHandler(
      new CosmosLoanRepository(),
      new LoanEventPublisher()
    );

    const loan = await handler.execute(loanId);

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
