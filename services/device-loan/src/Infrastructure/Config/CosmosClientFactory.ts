// src/Infrastructure/Config/CosmosClientFactory.ts
import { CosmosClient, Container } from "@azure/cosmos";

/**
 * Singleton factory for Azure Cosmos DB client and container access.
 * 
 * Provides centralized Cosmos DB client management ensuring single
 * connection instance across all repositories. Repositories should
 * use this factory instead of creating their own clients.
 */
export class CosmosClientFactory {
  private static client: CosmosClient | null = null;

  /**
   * Gets the singleton Cosmos DB client instance.
   * Creates the client on first call using connection string from environment.
   * 
   * @returns CosmosClient instance
   * @throws Error if COSMOS_DB_CONNECTION_STRING environment variable is missing
   */
  static getClient(): CosmosClient {
    if (!this.client) {
      const conn = process.env.COSMOS_DB_CONNECTION_STRING;
      if (!conn) {
        throw new Error("COSMOS_DB_CONNECTION_STRING missing.");
      }

      this.client = new CosmosClient(conn);
    }
    return this.client;
  }

  /**
   * Convenience method to get a Cosmos DB container.
   * 
   * @param databaseId - The database name
   * @param containerId - The container name
   * @returns Container instance for database operations
   */
  static getContainer(databaseId: string, containerId: string): Container {
    const client = this.getClient();
    return client.database(databaseId).container(containerId);
  }
}
