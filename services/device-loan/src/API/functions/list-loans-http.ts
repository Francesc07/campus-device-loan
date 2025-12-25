// src/API/functions/list-loans-http.ts

import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { appServices } from "../../appServices";
import { requireAuth } from "../../Infrastructure/Auth/auth0Validation";

export async function listLoansHttp(
  req: HttpRequest,
  ctx: InvocationContext
): Promise<HttpResponseInit> {
  // Validate authentication and require view:my-loans permission
  const authResult = await requireAuth(req, ctx, ["view:my-loans"]);
  if ("status" in authResult) {
    return authResult as HttpResponseInit; // Return 401 or 403 error response
  }

  try {
    const userId = req.query.get("userId");

    if (!userId) {
      ctx.warn(`⚠️ LIST LOANS: Missing userId parameter`);
      return { 
        status: 400, 
        jsonBody: { 
          success: false,
          error: "userId is required",
          userFriendlyMessage: "User identification is required to list loans."
        } 
      };
    }

    ctx.log(`📋 LIST LOANS: Fetching loans for user ${userId}`);
    const loans = await appServices.listLoansHandler.execute({ userId });
    ctx.log(`✅ LIST LOANS: Retrieved ${loans.length} loans for user ${userId}`);

    return { 
      status: 200, 
      jsonBody: {
        success: true,
        data: loans,
        count: loans.length
      }
    };
  } catch (err: any) {
    ctx.error(`❌ LIST LOANS: Failed to list loans - ${err.message}`, {
      error: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString()
    });

    let userMessage = "We're having trouble retrieving your loan history. Please try again in a moment.";
    let statusCode = 500;

    if (err.message.includes("timeout") || err.message.includes("ECONNREFUSED")) {
      userMessage = "The service is temporarily unavailable. Please try again shortly.";
      statusCode = 503;
      ctx.error(`🔥 LIST LOANS: Service unavailable`);
    } else if (err.message.includes("database") || err.message.includes("cosmos")) {
      userMessage = "We're experiencing database connectivity issues. Please try again in a moment.";
      statusCode = 503;
      ctx.error(`🔥 LIST LOANS: Database connection issue`);
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
      } 
    };
  }
}

app.http("list-loans-http", {
  methods: ["GET"],
  route: "loan/list",
  authLevel: "anonymous",
  handler: listLoansHttp,
});
