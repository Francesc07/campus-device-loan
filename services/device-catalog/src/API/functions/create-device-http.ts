// src/API/functions/create-device-http.ts
import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { CosmosDeviceRepository } from "../../Infrastructure/Persistence/CosmosDeviceRepository";
import { Device } from "../../Domain/Entities/Device";
import { DeviceBrand } from "../../Domain/Enums/DeviceBrand";
import { DeviceCategory } from "../../Domain/Enums/DeviceCategory";
import { randomUUID } from "crypto";

export async function createDevice(req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> {
  try {
    const repo = new CosmosDeviceRepository();

    // Parse multipart form data
    const form = await req.formData();
    const brand = form.get("brand")?.toString();
    const model = form.get("model")?.toString();
    const category = form.get("category")?.toString();
    const description = form.get("description")?.toString() || "";
    const availableCount = Number(form.get("availableCount"));
    const maxDeviceCount = Number(form.get("maxDeviceCount"));
    const image = form.get("image") as unknown as File | null;
    const specFile = form.get("file") as unknown as File | null;

    if (!brand || !model || !category || isNaN(availableCount) || isNaN(maxDeviceCount)) {
      return { status: 400, jsonBody: { error: "Missing required fields" } };
    }

    // Upload image and file (if any)
    // TODO: Enable file upload when blob storage is configured
    let imageUrl, fileUrl;
    // if (image && image instanceof File) {
    //   const buffer = Buffer.from(await image.arrayBuffer());
    //   imageUrl = await repo.uploadAsset(buffer, image.name, image.type);
    // }
    // if (specFile && specFile instanceof File) {
    //   const buffer = Buffer.from(await specFile.arrayBuffer());
    //   fileUrl = await repo.uploadAsset(buffer, specFile.name, specFile.type);
    // }

    // Create the Device entity
    const device = new Device(
      randomUUID(),
      brand as DeviceBrand,
      model,
      category as DeviceCategory,
      description,
      availableCount,
      maxDeviceCount,
      imageUrl,
      fileUrl
    );

    await repo.create(device);

    ctx.log(`📦 Device created: ${device.model}`);
    return { status: 201, jsonBody: { message: "Device created successfully", device } };
  } catch (e: any) {
    ctx.error(`Error creating device: ${e.message}`);
    return { status: 500, jsonBody: { error: e.message } };
  }
}

app.http("create-device-http", {
  methods: ["POST"],
  route: "devices/create",
  authLevel: "anonymous",
  handler: createDevice
});
