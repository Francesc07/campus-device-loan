import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { appServices } from "../../appServices";

/**
 * GET /loans?userId={userId}&status={status}
 * Lists loans filtered by userId and/or status
 */
export async function listLoansHttp(req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> {
  try {
    const userId = req.query.get("userId");
    const status = req.query.get("status");
    
    const loans = await appServices.listLoansHandler.execute({ userId, status });

    ctx.log(`Retrieved ${loans.length} loans`);

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
