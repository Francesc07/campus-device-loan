// src/API/functions/list-loans-http.ts

import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import { appServices } from "../../appServices";

export async function listLoansHttp(req: HttpRequest): Promise<HttpResponseInit> {
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
