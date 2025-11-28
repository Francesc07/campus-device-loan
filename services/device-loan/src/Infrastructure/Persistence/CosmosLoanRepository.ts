// src/Infrastructure/Persistence/CosmosLoanRepository.ts
import { Container } from "@azure/cosmos";
import { ILoanRepository } from "../../Application/Interfaces/ILoanRepository";
import { LoanRecord } from "../../Domain/Entities/LoanRecord";
import { CosmosClientFactory } from "../Config/CosmosClientFactory";

export class CosmosLoanRepository implements ILoanRepository {
  private container: Container;

  constructor() {
    const dbName = process.env.COSMOS_DB_DATABASE_NAME || "DeviceLoanDB";
    const containerName = process.env.COSMOS_DB_CONTAINER_NAME || "Loans";

    this.container = CosmosClientFactory.getContainer(dbName, containerName);
  }

  async create(loan: LoanRecord): Promise<void> {
    await this.container.items.create(loan);
  }

  async update(loan: LoanRecord): Promise<void> {
    await this.container.item(loan.id, loan.userId).replace(loan);
  }

  async getById(loanId: string): Promise<LoanRecord | null> {
    const query = {
      query: "SELECT * FROM c WHERE c.id = @id",
      parameters: [{ name: "@id", value: loanId }],
    };

    const { resources } = await this.container.items.query<LoanRecord>(query).fetchAll();
    return resources[0] || null;
  }

  async listByUser(userId: string): Promise<LoanRecord[]> {
    const query = {
      query: "SELECT * FROM c WHERE c.userId = @userId ORDER BY c.createdAt DESC",
      parameters: [{ name: "@userId", value: userId }],
    };

    const { resources } = await this.container.items.query<LoanRecord>(query).fetchAll();
    return resources;
  }

  async getByReservation(reservationId: string): Promise<LoanRecord | null> {
    const query = {
      query: "SELECT * FROM c WHERE c.reservationId = @resId",
      parameters: [{ name: "@resId", value: reservationId }],
    };

    const { resources } = await this.container.items.query<LoanRecord>(query).fetchAll();
    return resources[0] || null;
  }
}
