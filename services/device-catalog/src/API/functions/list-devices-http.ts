import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { ListDevicesHandler } from "../../Application/UseCases/ListDevicesHandler";
import { appServices } from "../../appServices";

export async function listDevicesHttp(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const handler = new ListDevicesHandler(appServices.deviceRepository);
    const devices = await handler.execute();
    return { status: 200, jsonBody: { success: true, count: devices.length, data: devices } };
  } catch (err: any) {
    context.error(err);
    return { status: 500, jsonBody: { success: false, message: err.message } };
  }
}

app.http("listDevicesHttp", { methods: ["GET"], route: "devices", authLevel: "anonymous", handler: listDevicesHttp });
