import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { CosmosDeviceRepository } from "../../Infrastructure/Persistence/CosmosDeviceRepository";
import { GetDeviceByIdHandler } from "../../Application/UseCases/GetDeviceByIdHandler";

/**
 * Azure Function endpoint for retrieving a single device by ID.
 */
export async function GetDeviceById(
  req: HttpRequest,
  ctx: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const id = req.params["id"];
    const repo = new CosmosDeviceRepository();
    const handler = new GetDeviceByIdHandler(repo);
    const device = await handler.execute(id);

    return { status: 200, jsonBody: device };
  } catch (err: any) {
    ctx.error(`GetDeviceById Error: ${err.message}`);
    return { status: 404, jsonBody: { message: err.message } };
  }
}

app.http("GetDeviceById", {
  route: "GetDeviceById/{id}",
  methods: ["GET"],
  authLevel: "anonymous",
  handler: GetDeviceById,
});
