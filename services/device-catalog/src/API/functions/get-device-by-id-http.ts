import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { GetDeviceByIdHandler } from "../../Application/UseCases/GetDeviceByIdHandler";
import { appServices } from "../../appServices";

export async function getDeviceByIdHttp(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const id = req.params["id"];
    const handler = new GetDeviceByIdHandler(appServices.deviceRepository);
    const device = await handler.execute(id!);

    return { status: 200, jsonBody: { success: true, data: device } };
  } catch (err: any) {
    context.error(err);
    return { status: 404, jsonBody: { success: false, message: err.message } };
  }
}

app.http("getDeviceByIdHttp", { methods: ["GET"], route: "devices/{id}", authLevel: "anonymous", handler: getDeviceByIdHttp });
