import { CosmosClient } from "@azure/cosmos";
import { Loan } from "../Domain/Entities/Loan";

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

  async create(loan: Loan): Promise<Loan> {
    const { resource } = await this.container.items.create(loan);
    return resource as Loan;
  }

  async update(loan: Loan): Promise<Loan> {
    const { resource } = await this.container.items.upsert(loan);
    return resource as Loan;
  }

  async findById(loanId: string): Promise<Loan | null> {
    const query = `SELECT * FROM c WHERE c.loanId = @loanId`;
    const { resources } = await this.container.items.query({
      query,
      parameters: [{ name: "@loanId", value: loanId }]
    }).fetchAll();

    return resources[0] || null;
  }

  async findByUser(userId: string): Promise<Loan[]> {
    const query = `SELECT * FROM c WHERE c.userId = @userId ORDER BY c.createdAt DESC`;
    const { resources } = await this.container.items.query({
      query,
      parameters: [{ name: "@userId", value: userId }]
    }).fetchAll();

    return resources;
  }
}
