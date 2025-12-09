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
      return { status: 400, jsonBody: { error: "userId is required" } };
    }

    const loans = await appServices.listLoansHandler.execute({ userId });

    return { status: 200, jsonBody: loans };
  } catch (err: any) {
    return { status: 500, jsonBody: { error: err.message } };
  }
}

app.http("list-loans-http", {
  methods: ["GET"],
  route: "loan/list",
  authLevel: "anonymous",
  handler: listLoansHttp,
});
