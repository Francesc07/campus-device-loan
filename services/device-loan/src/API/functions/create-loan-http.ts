import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { appServices } from "../../appServices";

/**
 * POST /loans
 * Creates a new loan (borrow/reserve device)
 * Publishes: Loan.Created event
 */
export async function createLoanHttp(req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> {
  try {
    const body = await req.json() as { userId: string; deviceId: string; notes?: string };
    
    if (!body.userId || !body.deviceId) {
      return {
        status: 400,
        jsonBody: { error: "userId and deviceId are required" }
      };
    }

    const loan = await appServices.createLoanHandler.execute({
      userId: body.userId,
      deviceId: body.deviceId,
      notes: body.notes
    });

    ctx.log(`Loan created: ${loan.id} for user ${loan.userId}`);

    return {
      status: 201,
      jsonBody: {
        success: true,
        data: loan
      }
    };
  } catch (err: any) {
    ctx.error("Error creating loan:", err);
    return {
      status: 500,
      jsonBody: { error: err.message }
    };
  }
}

app.http("createLoanHttp", {
  methods: ["POST"],
  route: "loans",
  authLevel: "anonymous",
  handler: createLoanHttp,
});
