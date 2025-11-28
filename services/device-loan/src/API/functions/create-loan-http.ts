import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { appServices } from "../../appServices";
import { CreateLoanDto } from "../../Application/Dtos/CreateLoanDto";

/**
 * POST /api/loan/create
 * Student initiates a loan (before reservation confirms it)
 */
export async function createLoanHttp(
  req: HttpRequest,
  ctx: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const body = (await req.json()) as CreateLoanDto;

    const { userId, deviceId, reservationId } = body;

    if (!userId || !deviceId || !reservationId) {
      return {
        status: 400,
        jsonBody: { error: "userId, deviceId and reservationId are required" }
      };
    }

    const result = await appServices.createLoanHandler.execute({
      userId,
      deviceId,
      reservationId
    });

    return {
      status: 201,
      jsonBody: {
        success: true,
        message: "Loan created successfully",
        data: result
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
