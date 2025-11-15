import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { CreateLoanHandler } from "../../Application/useCases/CreateLoanHandler";
import { CosmosLoanRepository } from "../../Infrastructure/CosmosLoanRepository";
import { LoanEventPublisher } from "../../Infrastructure/EventGrid/LoanEventPublisher";

/**
 * POST /loans
 * Creates a new loan (borrow/reserve device) and triggers 2-day timer
 * Publishes: Loan.Created event
 */
export async function createLoanHttp(req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> {
  try {
    const body = await req.json() as { userId: string; modelId: string };
    
    if (!body.userId || !body.modelId) {
      return {
        status: 400,
        jsonBody: { error: "userId and modelId are required" }
      };
    }

    const handler = new CreateLoanHandler(
      new CosmosLoanRepository(),
      new LoanEventPublisher()
    );

    const loan = await handler.execute(body.userId, body.modelId);

    ctx.log(`Loan created: ${loan.loanId} for user ${loan.userId}`);

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
