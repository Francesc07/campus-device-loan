import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { CosmosLoanRepository } from "../../Infrastructure/CosmosLoanRepository";

/**
 * GET /loans?userId=<userId>
 * Lists all loans (current and past) for a specific user
 */
export async function listLoansHttp(req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> {
  try {
    const userId = req.query.get("userId");
    
    if (!userId) {
      return {
        status: 400,
        jsonBody: { error: "userId query parameter is required" }
      };
    }

    const repo = new CosmosLoanRepository();
    const loans = await repo.findByUser(userId);

    ctx.log(`Retrieved ${loans.length} loans for user ${userId}`);

    return {
      status: 200,
      jsonBody: {
        success: true,
        count: loans.length,
        data: loans
      }
    };
  } catch (err: any) {
    ctx.error("Error listing loans:", err);
    return {
      status: 500,
      jsonBody: { error: err.message }
    };
  }
}

app.http("listLoansHttp", {
  methods: ["GET"],
  route: "loans",
  authLevel: "anonymous",
  handler: listLoansHttp,
});
