import { CosmosClient, Container } from "@azure/cosmos";

let cosmosClient: CosmosClient | null = null;

export class CosmosClientFactory {
  
  /**
   * Returns a singleton CosmosClient instance.
   */
  static getClient(): CosmosClient {
    if (!cosmosClient) {
      const endpoint = process.env.COSMOS_ENDPOINT;
      const key = process.env.COSMOS_KEY;

      if (!endpoint || !key) {
        throw new Error("CosmosClientFactory: COSMOS_ENDPOINT or COSMOS_KEY missing");
      }

      cosmosClient = new CosmosClient({ endpoint, key });
    }

    return cosmosClient;
  }

  /**
   * Gets a Cosmos DB container using the singleton client.
   */
  static getContainer(databaseId: string, containerId: string): Container {
    const client = this.getClient();
    const db = client.database(databaseId);
    return db.container(containerId);
  }
}
