import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { DeviceSnapshotRepository } from "../../Infrastructure/DeviceSnapshotRepository";

const deviceSnapshotRepo = new DeviceSnapshotRepository();

/**
 * Event Grid webhook endpoint for syncing device catalog data.
 * Receives Device.Snapshot and Device.Deleted events from Catalog Service.
 * 
 * POST /api/events/device-sync
 */
async function deviceSyncHandler(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const events = await req.json() as any[];

    if (!Array.isArray(events)) {
      return {
        status: 400,
        body: JSON.stringify({ error: "Expected array of events" }),
      };
    }

    context.log(`📥 Received ${events.length} device sync event(s)`);

    for (const event of events) {
      // Handle Event Grid validation
      if (event.eventType === "Microsoft.EventGrid.SubscriptionValidationEvent") {
        context.log("🔐 Validating Event Grid subscription");
        return {
          status: 200,
          body: JSON.stringify({ validationResponse: event.data.validationCode }),
        };
      }

      // Handle device snapshot updates
      if (event.eventType === "Device.Snapshot") {
        context.log(`📦 Syncing device snapshot: ${event.data.model} (${event.data.id})`);
        await deviceSnapshotRepo.upsert(event.data);
      }

      // Handle device deletions
      if (event.eventType === "Device.Deleted") {
        context.log(`🗑️ Deleting device snapshot: ${event.data.id}`);
        await deviceSnapshotRepo.delete(event.data.id);
      }
    }

    return {
      status: 200,
      body: JSON.stringify({ 
        message: `Processed ${events.length} event(s)`,
        processed: events.length 
      }),
    };

  } catch (error: any) {
    context.error("❌ Error processing device sync events:", error);
    return {
      status: 500,
      body: JSON.stringify({ 
        error: "Failed to process device sync events",
        details: error.message 
      }),
    };
  }
}

app.http("onDeviceSnapshot", {
  methods: ["POST"],
  route: "events/device-sync",
  authLevel: "function",
  handler: deviceSyncHandler,
});
