"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CosmosLoanRepository = void 0;
const CosmosClientFactory_1 = require("../Config/CosmosClientFactory");
class CosmosLoanRepository {
    constructor() {
        const dbName = process.env.COSMOS_DB_DATABASE_NAME;
        const containerName = process.env.COSMOS_DB_CONTAINER_NAME;
        this.container = CosmosClientFactory_1.CosmosClientFactory.getContainer(dbName, containerName);
    }
    async create(loan) {
        await this.container.items.create(loan);
    }
    async update(loan) {
        // Partition key is /id, so use loan.id for both id + partitionKey
        await this.container.item(loan.id, loan.id).replace(loan);
    }
    async getById(loanId) {
        const query = {
            query: "SELECT * FROM c WHERE c.id = @id",
            parameters: [{ name: "@id", value: loanId }],
        };
        const { resources } = await this.container.items.query(query).fetchAll();
        return resources[0] || null;
    }
    async listByUser(userId) {
        const query = {
            query: "SELECT * FROM c WHERE c.userId = @userId ORDER BY c.status = 'Waitlisted' DESC, c.createdAt DESC",
            parameters: [{ name: "@userId", value: userId }],
        };
        const { resources } = await this.container.items.query(query).fetchAll();
        return resources;
    }
    async getByReservation(reservationId) {
        const query = {
            query: "SELECT * FROM c WHERE c.reservationId = @resId",
            parameters: [{ name: "@resId", value: reservationId }],
        };
        const { resources } = await this.container.items.query(query).fetchAll();
        return resources[0] || null;
    }
    async getByDeviceAndStatus(deviceId, status) {
        const query = {
            query: "SELECT * FROM c WHERE c.deviceId = @deviceId AND c.status = @status ORDER BY c.createdAt ASC",
            parameters: [
                { name: "@deviceId", value: deviceId },
                { name: "@status", value: status }
            ],
        };
        const { resources } = await this.container.items.query(query).fetchAll();
        return resources;
    }
}
exports.CosmosLoanRepository = CosmosLoanRepository;
//# sourceMappingURL=CosmosLoanRepository.js.map