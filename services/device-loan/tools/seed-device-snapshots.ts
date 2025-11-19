import { CosmosClient } from "@azure/cosmos";
import * as fs from "fs";
import * as path from "path";

// Load local.settings.json
const settingsPath = path.join(__dirname, "..", "local.settings.json");
const settings = JSON.parse(fs.readFileSync(settingsPath, "utf8"));

// Set environment variables
Object.keys(settings.Values).forEach((key) => {
  process.env[key] = settings.Values[key];
});

const endpoint = process.env.COSMOS_DB_ENDPOINT!;
const key = process.env.COSMOS_DB_KEY!;
const databaseId = process.env.COSMOS_DB_DATABASE || "DeviceLoanDB";
const containerId = process.env.COSMOS_DEVICESNAPSHOTS_CONTAINER_ID || "DeviceSnapshots";

const client = new CosmosClient({ endpoint, key });
const container = client.database(databaseId).container(containerId);

const testDevices = [
  {
    id: "d1",
    brand: "Dell",
    model: "Latitude 5420",
    category: "Laptop",
    description: "14-inch business laptop with Intel i5",
    availableCount: 5,
    maxDeviceCount: 10,
    imageUrl: "",
    fileUrl: "",
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "d2",
    brand: "HP",
    model: "EliteBook 840",
    category: "Laptop",
    description: "Premium 14-inch laptop",
    availableCount: 3,
    maxDeviceCount: 8,
    imageUrl: "",
    fileUrl: "",
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "d3",
    brand: "Apple",
    model: "MacBook Pro 14",
    category: "Laptop",
    description: "14-inch MacBook Pro with M3 chip",
    availableCount: 5,
    maxDeviceCount: 10,
    imageUrl: "",
    fileUrl: "",
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "d4",
    brand: "Canon",
    model: "EOS R6",
    category: "Camera",
    description: "Professional mirrorless camera",
    availableCount: 4,
    maxDeviceCount: 6,
    imageUrl: "",
    fileUrl: "",
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "d5",
    brand: "Logitech",
    model: "C920 HD Pro",
    category: "Camera",
    description: "1080p webcam with stereo audio",
    availableCount: 8,
    maxDeviceCount: 12,
    imageUrl: "",
    fileUrl: "",
    lastUpdated: new Date().toISOString(),
  },
];

async function seedDeviceSnapshots() {
  console.log("🌱 Seeding device snapshots...");
  console.log(`Database: ${databaseId}`);
  console.log(`Container: ${containerId}\n`);

  for (const device of testDevices) {
    try {
      await container.items.upsert(device);
      console.log(`✅ Inserted: ${device.model} (${device.id}) - Available: ${device.availableCount}`);
    } catch (err: any) {
      console.error(`❌ Error inserting ${device.model}:`, err.message);
    }
  }

  console.log("\n✨ Device snapshot seeding complete!");
}

seedDeviceSnapshots().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
