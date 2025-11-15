import { CosmosClient } from "@azure/cosmos";
import { LoanRecord } from "../Domain/Entities/LoanRecord";

export class CosmosLoanRepository {
  private container;

  constructor() {
    const endpoint = process.env.COSMOS_DB_ENDPOINT!;
    const key = process.env.COSMOS_DB_KEY!;
    const database = process.env.COSMOS_DB_DATABASE || "DeviceLoanDB";
    const containerName = process.env.COSMOS_DB_CONTAINER || "Loans";

    const client = new CosmosClient({ endpoint, key });
    const db = client.database(database);
    this.container = db.container(containerName);
  }

  async create(loan: LoanRecord): Promise<LoanRecord> {
    const { resource } = await this.container.items.create(loan);
    return resource as LoanRecord;
  }

  async update(loan: LoanRecord): Promise<LoanRecord> {
    const { resource } = await this.container.items.upsert(loan);
    return resource as LoanRecord;
  }

  async findById(loanId: string): Promise<LoanRecord | null> {
    const query = `SELECT * FROM c WHERE c.loanId = @loanId`;
    const { resources } = await this.container.items.query({
      query,
      parameters: [{ name: "@loanId", value: loanId }]
    }).fetchAll();

    return resources[0] || null;
  }

  async findByUser(userId: string): Promise<LoanRecord[]> {
    const query = `SELECT * FROM c WHERE c.userId = @userId ORDER BY c.createdAt DESC`;
    const { resources } = await this.container.items.query({
      query,
      parameters: [{ name: "@userId", value: userId }]
    }).fetchAll();

    return resources;
  }

  async findByReservationId(reservationId: string): Promise<LoanRecord | null> {
    const query = `SELECT * FROM c WHERE c.reservationId = @reservationId`;
    const { resources } = await this.container.items.query({
      query,
      parameters: [{ name: "@reservationId", value: reservationId }]
    }).fetchAll();

    return resources[0] || null;
  }

  async findByStatus(status: string): Promise<LoanRecord[]> {
    const query = `SELECT * FROM c WHERE c.status = @status ORDER BY c.createdAt DESC`;
    const { resources } = await this.container.items.query({
      query,
      parameters: [{ name: "@status", value: status }]
    }).fetchAll();

    return resources;
  }

  async findAll(): Promise<LoanRecord[]> {
    const query = `SELECT * FROM c ORDER BY c.createdAt DESC`;
    const { resources } = await this.container.items.query(query).fetchAll();

    return resources;
  }
}
