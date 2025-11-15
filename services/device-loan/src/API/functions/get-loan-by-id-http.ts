import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { appServices } from "../../appServices";

/**
 * GET /loans/{loanId}
 * Get a specific loan by ID
 */
export async function getLoanByIdHttp(req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> {
  try {
    const loanId = req.params.loanId;
    
    if (!loanId) {
      return {
        status: 400,
        jsonBody: { error: "loanId is required" }
      };
    }

    const loans = await appServices.listLoansHandler.execute({ loanId });

    if (!loans || loans.length === 0) {
      return {
        status: 404,
        jsonBody: { error: "Loan not found" }
      };
    }

    ctx.log(`Retrieved loan: ${loanId}`);

    return {
      status: 200,
      jsonBody: {
        success: true,
        data: loans[0]
      }
    };
  } catch (err: any) {
    ctx.error("Error getting loan:", err);
    return {
      status: 500,
      jsonBody: { error: err.message }
    };
  }
}

app.http("getLoanByIdHttp", {
  methods: ["GET"],
  route: "loans/{loanId}",
  authLevel: "anonymous",
  handler: getLoanByIdHttp,
});
