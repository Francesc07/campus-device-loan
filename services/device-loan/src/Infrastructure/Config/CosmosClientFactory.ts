// src/Infrastructure/Config/CosmosClientFactory.ts
import { CosmosClient, Container } from "@azure/cosmos";

/**
 * Centralised Cosmos DB client + container helper.
 * All repositories get their containers from here.
 */
export class CosmosClientFactory {
  private static client: CosmosClient | null = null;

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
   * Convenience helper: get a Cosmos container.
   */
  static getContainer(databaseId: string, containerId: string): Container {
    const client = this.getClient();
    return client.database(databaseId).container(containerId);
  }
}
