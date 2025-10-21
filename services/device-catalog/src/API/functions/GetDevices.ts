import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { CosmosDeviceRepository } from "../../Infrastructure/Persistence/CosmosDeviceRepository";
import { ListDevicesHandler } from "../../Application/UseCases/ListDevicesHandler";

/**
 * Azure Function endpoint for retrieving all devices.
 */
export async function GetDevices(
  req: HttpRequest,
  ctx: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const repo = new CosmosDeviceRepository();
    const handler = new ListDevicesHandler(repo);
    const devices = await handler.execute();

    return { status: 200, jsonBody: devices };
  } catch (err: any) {
    ctx.error(`GetDevices Error: ${err.message}`);
    return { status: 500, jsonBody: { message: "Failed to fetch devices." } };
  }
}

app.http("GetDevices", {
  methods: ["GET"],
  authLevel: "anonymous",
  handler: GetDevices,
});
