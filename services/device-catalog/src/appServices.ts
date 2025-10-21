import { CosmosDeviceRepository } from "./Infrastructure/Persistence/CosmosDeviceRepository";

/**
 * Centralized application service container.
 * Resolves and exposes core dependencies (repositories, APIs, etc.)
 * that other parts of the system can reuse without re-instantiation.
 */
class AppServices {
  private static _instance: AppServices;

  // 🔹 Exposed services
  public readonly deviceRepository: CosmosDeviceRepository;

  private constructor() {
    // Load configuration from environment
    const endpoint = process.env.COSMOS_ENDPOINT;
    const key = process.env.COSMOS_KEY;
    const db = process.env.COSMOS_DB;
    const container = process.env.COSMOS_CONTAINER;

    // Validate required environment variables
    if (!endpoint || !key || !db || !container) {
      throw new Error(
        "Missing Cosmos DB configuration. Ensure COSMOS_ENDPOINT, COSMOS_KEY, COSMOS_DB, and COSMOS_CONTAINER are set."
      );
    }

    // Instantiate repositories or external services
    this.deviceRepository = new CosmosDeviceRepository();
  }

  // 🧠 Singleton pattern ensures one shared instance per function host
  static get instance(): AppServices {
    if (!AppServices._instance) {
      AppServices._instance = new AppServices();
    }
    return AppServices._instance;
  }
}

// Export a globally shared instance
export const appServices = AppServices.instance;
