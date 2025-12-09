import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { appServices } from "../../appServices";
import { CreateLoanDto } from "../../Application/Dtos/CreateLoanDto";
import { requireAuth } from "../../Infrastructure/Auth/auth0Validation";

/**
 * POST /api/loan/create
 * Student initiates a loan (before reservation confirms it)
 */
export async function createLoanHttp(
  req: HttpRequest,
  ctx: InvocationContext
): Promise<HttpResponseInit> {
  // Validate authentication and require loan:devices permission
  const authResult = await requireAuth(req, ctx, ["loan:devices"]);
  if ("status" in authResult) {
    return authResult as HttpResponseInit; // Return 401 or 403 error response
  }

  try {
    const body = (await req.json()) as CreateLoanDto;

    const { userId, deviceId } = body;

    if (!userId || !deviceId ) {
      return {
        status: 400,
        jsonBody: { error: "userId and deviceId are required" }
      };
    }

    const result = await appServices.createLoanHandler.execute({
      userId,
      deviceId,
      
    });

    // Provide different messages based on loan status
    const isWaitlisted = result.status === "Waitlisted";
    const statusCode = isWaitlisted ? 202 : 201; // 202 Accepted for waitlist
    const message = isWaitlisted 
      ? "Device is currently unavailable. Your request has been added to the waitlist."
      : "Loan request created successfully";

    return {
      status: statusCode,
      jsonBody: {
        success: true,
        message,
        data: result,
        isWaitlisted
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

app.http("create-loan-http", {
  methods: ["POST"],
  route: "loan/create",
  authLevel: "anonymous",
  handler: createLoanHttp,
});
