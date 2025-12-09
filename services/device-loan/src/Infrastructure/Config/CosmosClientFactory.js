"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CosmosClientFactory = void 0;
// src/Infrastructure/Config/CosmosClientFactory.ts
const cosmos_1 = require("@azure/cosmos");
/**
 * Centralised Cosmos DB client + container helper.
 * All repositories get their containers from here.
 */
class CosmosClientFactory {
    static getClient() {
        if (!this.client) {
            const conn = process.env.COSMOS_DB_CONNECTION_STRING;
            if (!conn) {
                throw new Error("COSMOS_DB_CONNECTION_STRING missing.");
            }
            this.client = new cosmos_1.CosmosClient(conn);
        }
        return this.client;
    }
    /**
     * Convenience helper: get a Cosmos container.
     */
    static getContainer(databaseId, containerId) {
        const client = this.getClient();
        return client.database(databaseId).container(containerId);
    }
}
exports.CosmosClientFactory = CosmosClientFactory;
CosmosClientFactory.client = null;
//# sourceMappingURL=CosmosClientFactory.js.map