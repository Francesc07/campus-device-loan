// src/API/functions/get-loan-by-id-http.ts
import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { appServices } from "../../appServices";
import { requireAuth } from "../../Infrastructure/Auth/auth0Validation";

export async function getLoanByIdHttp(
  req: HttpRequest,
  ctx: InvocationContext
): Promise<HttpResponseInit> {
  // Validate authentication and require view:my-loans permission
  const authResult = await requireAuth(req, ctx, ["view:my-loans"]);
  if ("status" in authResult) {
    return authResult as HttpResponseInit; // Return 401 or 403 error response
  }

  const id = req.params.id;

  if (!id) {
    return {
      status: 400,
      jsonBody: { success: false, message: "Loan id is required" },
    };
  }

  try {
    ctx.log(`🔍 GET LOAN BY ID: Fetching loan ${id}`);
    const loan = await appServices.getLoanByIdHandler.execute(id);
    ctx.log(`✅ GET LOAN BY ID: Retrieved loan ${id}`);

    return {
      status: 200,
      jsonBody: { success: true, data: loan },
    };
  } catch (err: any) {
    if (err.message && err.message.includes("not found")) {
      ctx.warn(`⚠️ GET LOAN BY ID: Loan ${id} not found`);
      return {
        status: 404,
        jsonBody: { 
          success: false, 
          error: err.message,
          userFriendlyMessage: "The loan you're looking for could not be found. It may have been cancelled or completed.",
          errorId: ctx.invocationId
        },
      };
    }

    ctx.error(`❌ GET LOAN BY ID: Failed to retrieve loan - ${err.message}`, {
      error: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString()
    });

    let userMessage = "We're having trouble retrieving the loan details. Please try again in a moment.";
    let statusCode = 500;

    if (err.message.includes("timeout") || err.message.includes("ECONNREFUSED")) {
      userMessage = "The service is temporarily unavailable. Please try again shortly.";
      statusCode = 503;
      ctx.error(`🔥 GET LOAN BY ID: Service unavailable`);
    } else if (err.message.includes("database") || err.message.includes("cosmos")) {
      userMessage = "We're experiencing database connectivity issues. Please try again in a moment.";
      statusCode = 503;
      ctx.error(`🔥 GET LOAN BY ID: Database connection issue`);
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
      },
    };
  }
}

app.http("get-loan-by-id-http", {
  methods: ["GET"],
  route: "loan/id/{id}",
  authLevel: "anonymous",
  handler: getLoanByIdHttp,
});
