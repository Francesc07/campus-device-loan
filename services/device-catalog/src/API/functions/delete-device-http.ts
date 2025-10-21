import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { DeleteDeviceHandler } from "../../Application/UseCases/DeleteDeviceHandler";
import { appServices } from "../../appServices";

export async function deleteDeviceHttp(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const id = req.params["id"];
    const handler = new DeleteDeviceHandler(appServices.deviceRepository);
    await handler.execute(id!);
    return { status: 204 };
  } catch (err: any) {
    context.error(err);
    return { status: 404, jsonBody: { success: false, message: err.message } };
  }
}

app.http("deleteDeviceHttp", { methods: ["DELETE"], route: "devices/{id}", authLevel: "anonymous", handler: deleteDeviceHttp });
