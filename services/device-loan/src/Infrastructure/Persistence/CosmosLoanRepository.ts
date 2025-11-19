import { ILoanRepository } from "../../Application/Interfaces/ILoanRepository";
import { LoanRecord } from "../../Domain/Entities/LoanRecord";
import { LoanStatus } from "../../Domain/Enums/LoanStatus";
import { CosmosClientFactory } from "../Config/CosmosClientFactory";

export class CosmosLoanRepository implements ILoanRepository {
  private container;

  constructor() {
    this.container = CosmosClientFactory.getContainer(
      process.env.COSMOS_DB_DATABASE ,
      process.env.COSMOS_DB_CONTAINER 
    );
  }

  async create(loan: LoanRecord): Promise<LoanRecord> {
    await this.container.items.create(loan);
    return loan;
  }

  async update(loan: LoanRecord): Promise<LoanRecord> {
    loan.updatedAt = new Date().toISOString();
    await this.container.items.upsert(loan);
    return loan;
  }

  async findById(id: string): Promise<LoanRecord | null> {
    try {
      const { resource } = await this.container.item(id, id).read();
      return resource as LoanRecord;
    } catch {
      return null;
    }
  }

  async findByReservationId(reservationId: string): Promise<LoanRecord | null> {
    const query = `
      SELECT * FROM c
      WHERE c.reservationId = @reservationId
      OFFSET 0 LIMIT 1
    `;

    const { resources } = await this.container.items.query({
      query,
      parameters: [{ name: "@reservationId", value: reservationId }],
    }).fetchAll();

    return resources[0] ?? null;
  }

  async findByUserId(userId: string): Promise<LoanRecord[]> {
    const query = `
      SELECT * FROM c
      WHERE c.userId = @userId
    `;

    const { resources } = await this.container.items.query({
      query,
      parameters: [{ name: "@userId", value: userId }],
    }).fetchAll();

    return resources as LoanRecord[];
  }

  async listAll(): Promise<LoanRecord[]> {
    const { resources } = await this.container.items.readAll().fetchAll();
    return resources as LoanRecord[];
  }

  async listByStatus(status: LoanStatus): Promise<LoanRecord[]> {
    const query = `
      SELECT * FROM c
      WHERE c.status = @status
    `;

    const { resources } = await this.container.items.query({
      query,
      parameters: [{ name: "@status", value: status }],
    }).fetchAll();

    return resources as LoanRecord[];
  }
}
