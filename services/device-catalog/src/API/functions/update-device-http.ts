import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { UpdateDeviceHandler } from "../../Application/UseCases/UpdateDeviceHandler";
import { appServices } from "../../appServices";
import { UpdateDeviceDto } from "../../Application/DTOs/UpdateDeviceDto";

export async function updateDeviceHttp(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const id = req.params["id"];
    const body = (await req.json()) as UpdateDeviceDto;
    const handler = new UpdateDeviceHandler(appServices.deviceRepository);
    const updated = await handler.execute(id!, body);

    return { status: 200, jsonBody: { success: true, data: updated } };
  } catch (err: any) {
    context.error(err);
    return { status: 400, jsonBody: { success: false, message: err.message } };
  }
}

app.http("updateDeviceHttp", { methods: ["PUT"], route: "devices/{id}", authLevel: "anonymous", handler: updateDeviceHttp });
