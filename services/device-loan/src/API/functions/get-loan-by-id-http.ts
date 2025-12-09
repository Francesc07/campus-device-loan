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
    const loan = await appServices.getLoanByIdHandler.execute(id);

    return {
      status: 200,
      jsonBody: { success: true, data: loan },
    };
  } catch (err: any) {
    if (err.message && err.message.includes("not found")) {
      return {
        status: 404,
        jsonBody: { success: false, message: err.message },
      };
    }

    ctx.error("Error getting loan by id", err);
    return {
      status: 500,
      jsonBody: {
        success: false,
        message: err.message ?? "Failed to get loan",
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
