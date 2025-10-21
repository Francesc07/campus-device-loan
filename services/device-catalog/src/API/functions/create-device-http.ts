import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { CreateDeviceHandler } from "../../Application/UseCases/CreateDeviceHandler";
import { appServices } from "../../appServices";
import { CreateDeviceDto } from "../../Application/DTOs/CreateDeviceDto";

export async function createDeviceHttp(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const body = (await req.json()) as CreateDeviceDto;

    if (!body.brand || !body.model || !body.category || !body.description || body.availableCount === undefined) {
      return { status: 400, jsonBody: { success: false, message: "Missing required device fields." } };
    }

    const handler = new CreateDeviceHandler(appServices.deviceRepository);
    const device = await handler.execute(body);

    return { status: 201, jsonBody: { success: true, data: device } };
  } catch (err: any) {
    context.error(err);
    return { status: 400, jsonBody: { success: false, message: err.message } };
  }
}

app.http("createDeviceHttp", { methods: ["POST"], route: "devices", authLevel: "anonymous", handler: createDeviceHttp });
