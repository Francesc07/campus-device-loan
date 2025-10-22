import { CosmosClient } from "@azure/cosmos";
import { DeviceCategory } from "../src/Domain/Enums/DeviceCategory";
import { DeviceBrand } from "../src/Domain/Enums/DeviceBrand";

/**
 * Seeds initial device catalog data into Azure Cosmos DB.
 * Uses environment variables defined in local.settings.json
 * to connect securely to the live database.
 */
// If env vars aren't set (ts-node run), try loading them from local.settings.json
try {
  const fs = require("fs");
  const path = require("path");  
  const localPath = path.join(process.cwd(), "local.settings.json");
  if (fs.existsSync(localPath)) {
    const raw = fs.readFileSync(localPath, "utf8");
    const parsed = JSON.parse(raw);
    const values = parsed.Values || {};
    for (const k of ["COSMOS_ENDPOINT", "COSMOS_KEY", "COSMOS_DB", "COSMOS_CONTAINER"]) {
      if (!process.env[k] && values[k]) process.env[k] = values[k];
    }
  }
} catch (e) {
  // ignore: best-effort load only
}

const endpoint = process.env.COSMOS_ENDPOINT;
const key = process.env.COSMOS_KEY;
const dbName = process.env.COSMOS_DB;
const containerName = process.env.COSMOS_CONTAINER || "";

if (!endpoint || !key || !dbName || !containerName) {
  console.error("Missing Cosmos configuration. Make sure COSMOS_ENDPOINT, COSMOS_KEY, COSMOS_DB and COSMOS_CONTAINER are set in environment or local.settings.json.");
  process.exit(1);
}

async function main() {
  const client = new CosmosClient({ endpoint, key });

  // ✅ Ensure database and container exist
  const { database } = await client.databases.createIfNotExists({ id: dbName });
  await database.containers.createIfNotExists({
    id: containerName,
    partitionKey: { paths: ["/id"] },
  });

  // 🌱 Seed items aligned with enums
  const items = [
    {
      id: "d1",
      brand: DeviceBrand.Dell,
      model: "Latitude 5430",
      category: DeviceCategory.Laptop,
      description: "Business-grade laptop with 14-inch display, Intel i7 processor, and 16GB RAM.",
      availableCount: 5,
    },
    {
      id: "d2",
      brand: DeviceBrand.Apple,
      model: "iPad 10th Gen",
      category: DeviceCategory.Tablet,
      description: "Portable tablet featuring the A14 Bionic chip, USB-C, and 10.9-inch Liquid Retina display.",
      availableCount: 3,
    },
    {
      id: "d3",
      brand: DeviceBrand.Canon,
      model: "EOS M50",
      category: DeviceCategory.Camera,
      description: "Compact mirrorless camera with 24.1MP sensor, dual-pixel autofocus, and 4K video support.",
      availableCount: 2,
    },
    {
      id: "d4",
      brand: DeviceBrand.HP,
      model: "EliteBook 840 G8",
      category: DeviceCategory.Laptop,
      description: "Lightweight business laptop with 11th Gen Intel CPU, 512GB SSD, and robust security features.",
      availableCount: 4,
    },
    {
      id: "d5",
      brand: DeviceBrand.Logitech,
      model: "C920 HD Pro Webcam",
      category: DeviceCategory.Accessory,
      description: "Full HD 1080p webcam with stereo mics and automatic light correction for high-quality calls.",
      availableCount: 6,
    },
    {
      id: "d6",
      brand: DeviceBrand.Sony,
      model: "WH-1000XM5",
      category: DeviceCategory.Accessory,
      description: "Wireless noise-cancelling headphones with adaptive sound control and 30-hour battery life.",
      availableCount: 5,
    },
  ];

  const container = database.container(containerName);

  // 🧩 Insert or update each record
  for (const item of items) {
    await container.items.upsert(item);
  }

  console.log("✅ Device catalog seeded successfully into Azure Cosmos DB!");
}

main().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
