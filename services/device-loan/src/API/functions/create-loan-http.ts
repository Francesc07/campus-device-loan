import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { appServices } from "../../appServices";
import { CreateLoanDto } from "../../Application/Dtos/CreateLoanDto";
import { requireAuth } from "../../Infrastructure/Auth/auth0Validation";

/**
 * Azure Function HTTP trigger for creating a new device loan.
 * 
 * Endpoint: POST /api/loan/create
 * 
 * Creates a loan request for a student. If the device is available, the loan
 * is created with Pending status. If unavailable, it's added to the waitlist.
 * 
 * Requires authentication and 'loan:devices' permission.
 * Publishes Loan.Created or Loan.Waitlisted event to Event Grid.
 * 
 * @param req - HTTP request with userId, deviceId in body
 * @param ctx - Azure Functions invocation context
 * @returns 201 Created (available) or 202 Accepted (waitlisted)
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
    ctx.log(`📝 CREATE LOAN: Starting loan creation request`);
    const body = (await req.json()) as CreateLoanDto;
    
    // Debug: Log the entire request body to see what frontend is sending
    ctx.log(`🔍 CREATE LOAN: Request body:`, JSON.stringify(body, null, 2));

    const { userId, deviceId, userEmail } = body;
    
    ctx.log(`🔍 CREATE LOAN: Extracted fields - userId: ${userId}, deviceId: ${deviceId}, userEmail: ${userEmail || 'NOT PROVIDED'}`);

    if (!userId || !deviceId ) {
      ctx.warn(`⚠️ CREATE LOAN: Missing required fields - userId: ${!!userId}, deviceId: ${!!deviceId}`);
      return {
        status: 400,
        jsonBody: { 
          success: false,
          error: "Missing required information",
          message: "Both user ID and device ID are required to create a loan request.",
          userFriendlyMessage: "Please provide all required information to request a device."
        }
      };
    }

    ctx.log(`🔄 CREATE LOAN: Processing request for user ${userId}, device ${deviceId}`);

    // Extract access token from Authorization header
    const authHeader = req.headers.get("authorization") || "";
    const accessToken = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : undefined;

    const result = await appServices.createLoanHandler.execute({
      userId,
      deviceId,
      userEmail, // Pass userEmail from frontend to use case
    }, accessToken);

    // Provide different messages based on loan status
    const isWaitlisted = result.status === "Waitlisted";
    const statusCode = isWaitlisted ? 202 : 201; // 202 Accepted for waitlist
    const message = isWaitlisted 
      ? "Device is currently unavailable. Your request has been added to the waitlist."
      : "Loan request created successfully";

    ctx.log(`✅ CREATE LOAN: ${isWaitlisted ? 'Waitlisted' : 'Created'} loan ${result.id} for user ${userId}`);

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
    ctx.error(`❌ CREATE LOAN: Failed to create loan - ${err.message}`, {
      error: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString()
    });

    // Provide user-friendly error messages based on error type
    let userMessage = "We're experiencing technical difficulties. Please try again in a few moments.";
    let statusCode = 500;

    if (err.message.includes("Device not found")) {
      userMessage = "The requested device could not be found. Please verify the device is available in the catalog.";
      statusCode = 404;
      ctx.warn(`⚠️ CREATE LOAN: Device not found in catalog`);
    } else if (err.message.includes("Unauthorized")) {
      userMessage = "You don't have permission to perform this action.";
      statusCode = 403;
      ctx.warn(`⚠️ CREATE LOAN: Authorization failed`);
    } else if (err.message.includes("timeout") || err.message.includes("ECONNREFUSED")) {
      userMessage = "The service is temporarily unavailable. Our team has been notified. Please try again shortly.";
      statusCode = 503;
      ctx.error(`🔥 CREATE LOAN: Service unavailable - possible connectivity issue`);
    } else if (err.message.includes("database") || err.message.includes("cosmos")) {
      userMessage = "We're having trouble accessing our database. Please try again in a moment.";
      statusCode = 503;
      ctx.error(`🔥 CREATE LOAN: Database connection issue`);
    }

    return {
      status: statusCode,
      jsonBody: { 
        success: false,
        error: err.message,
        userFriendlyMessage: userMessage,
        timestamp: new Date().toISOString(),
        retryable: statusCode >= 500,
        supportMessage: statusCode >= 500 ? "If this problem persists, please contact support with this error ID." : undefined,
        errorId: ctx.invocationId
      }
    };
  }
}

app.http("create-loan-http", {
  methods: ["POST"],
  route: "loan/create",
  authLevel: "anonymous",
  handler: createLoanHttp,
});
