// src/Infrastructure/Persistence/CosmosLoanRepository.ts
import { Container } from "@azure/cosmos";
import { ILoanRepository } from "../../Application/Interfaces/ILoanRepository";
import { LoanRecord } from "../../Domain/Entities/LoanRecord";
import { CosmosClientFactory } from "../Config/CosmosClientFactory";

/**
 * Cosmos DB implementation of the loan repository.
 * 
 * Manages CRUD operations for loan records in Azure Cosmos DB.
 * Uses /userId as partition key for efficient query performance.
 * Includes automatic retry logic for transient failures.
 */
export class CosmosLoanRepository implements ILoanRepository {
  private container: Container;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY_MS = 1000;

  constructor() {
    const dbName = process.env.COSMOS_DB_DATABASE_NAME;
    const containerName = process.env.COSMOS_DB_CONTAINER_NAME ;

    this.container = CosmosClientFactory.getContainer(dbName, containerName);
  }

  /**
   * Executes a database operation with automatic retry logic for transient failures.
   * @param operation - The database operation to execute
   * @param operationName - Name of the operation for logging
   * @returns The result of the operation
   */
  private async withRetry<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        console.log(`🔄 [${operationName}] Attempt ${attempt}/${this.MAX_RETRIES}`);
        const result = await operation();
        
        if (attempt > 1) {
          console.log(`✅ [${operationName}] Succeeded after ${attempt} attempts`);
        }
        
        return result;
      } catch (error: any) {
        lastError = error;
        const isTransient = this.isTransientError(error);
        
        console.error(`❌ [${operationName}] Attempt ${attempt}/${this.MAX_RETRIES} failed:`, {
          error: error.message,
          code: error.code,
          statusCode: error.statusCode,
          isTransient,
          willRetry: isTransient && attempt < this.MAX_RETRIES
        });

        // Don't retry on non-transient errors (404, 400, etc.)
        if (!isTransient) {
          throw new Error(`Database operation failed: ${error.message}`);
        }

        // Don't wait after the last attempt
        if (attempt < this.MAX_RETRIES) {
          const delay = this.RETRY_DELAY_MS * Math.pow(2, attempt - 1); // Exponential backoff
          console.log(`⏳ [${operationName}] Waiting ${delay}ms before retry...`);
          await this.sleep(delay);
        }
      }
    }

    throw new Error(
      `Database operation failed after ${this.MAX_RETRIES} attempts: ${lastError?.message}`
    );
  }

  /**
   * Determines if an error is transient and should be retried.
   */
  private isTransientError(error: any): boolean {
    // Cosmos DB throttling (429), timeout, or connection errors
    const transientStatusCodes = [408, 429, 500, 503];
    const transientErrorCodes = ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND'];
    
    return (
      transientStatusCodes.includes(error.statusCode) ||
      transientErrorCodes.includes(error.code) ||
      error.message?.includes('timeout') ||
      error.message?.includes('throttled')
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Creates a new loan record in the database.
   * @param loan - The loan record to create
   */
  async create(loan: LoanRecord): Promise<void> {
    await this.withRetry(
      async () => {
        await this.container.items.create(loan);
      },
      `CREATE loan ${loan.id}`
    );
  }

  /**
   * Updates an existing loan record.
   * @param loan - The loan record with updated values
   */
  async update(loan: LoanRecord): Promise<void> {
    await this.withRetry(
      async () => {
        // Partition key is /id, so use loan.id for both id + partitionKey
        await this.container.item(loan.id, loan.id).replace(loan);
      },
      `UPDATE loan ${loan.id}`
    );
  }

  /**
   * Retrieves a loan by its ID.
   * @param loanId - The unique loan identifier
   * @returns The loan record or null if not found
   */
  async getById(loanId: string): Promise<LoanRecord | null> {
    return await this.withRetry(
      async () => {
        const query = {
          query: "SELECT * FROM c WHERE c.id = @id",
          parameters: [{ name: "@id", value: loanId }],
        };

        const { resources } = await this.container.items.query<LoanRecord>(query).fetchAll();
        return resources[0] || null;
      },
      `GET loan ${loanId}`
    );
  }

  async listByUser(userId: string): Promise<LoanRecord[]> {
    return await this.withRetry(
      async () => {
        const query = {
          query: "SELECT * FROM c WHERE c.userId = @userId ORDER BY c.createdAt DESC",
          parameters: [{ name: "@userId", value: userId }],
        };

        const { resources } = await this.container.items.query<LoanRecord>(query).fetchAll();
        
        // Sort in memory to prioritize Waitlisted loans, then by date
        return resources.sort((a, b) => {
          if (a.status === 'Waitlisted' && b.status !== 'Waitlisted') return -1;
          if (a.status !== 'Waitlisted' && b.status === 'Waitlisted') return 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
      },
      `LIST loans for user ${userId}`
    );
  }

  async getByReservation(reservationId: string): Promise<LoanRecord | null> {
    return await this.withRetry(
      async () => {
        const query = {
          query: "SELECT * FROM c WHERE c.reservationId = @resId",
          parameters: [{ name: "@resId", value: reservationId }],
        };

        const { resources } = await this.container.items.query<LoanRecord>(query).fetchAll();
        return resources[0] || null;
      },
      `GET loan by reservation ${reservationId}`
    );
  }

  async listByStatus(status: string): Promise<LoanRecord[]> {
    return await this.withRetry(
      async () => {
        const query = {
          query: "SELECT * FROM c WHERE c.status = @status ORDER BY c.createdAt ASC",
          parameters: [{ name: "@status", value: status }],
        };

        const { resources } = await this.container.items.query<LoanRecord>(query).fetchAll();
        return resources;
      },
      `LIST loans by status ${status}`
    );
  }

  async getByDeviceAndStatus(deviceId: string, status: string): Promise<LoanRecord[]> {
    return await this.withRetry(
      async () => {
        const query = {
          query: "SELECT * FROM c WHERE c.deviceId = @deviceId AND c.status = @status ORDER BY c.createdAt ASC",
          parameters: [
            { name: "@deviceId", value: deviceId },
            { name: "@status", value: status }
          ],
        };

        const { resources } = await this.container.items.query<LoanRecord>(query).fetchAll();
        return resources;
      },
      `GET device ${deviceId} loans with status ${status}`
    );
  }
}
