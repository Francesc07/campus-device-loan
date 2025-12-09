// tests/mocks/MockLoanRepository.ts
import { ILoanRepository } from "../../src/Application/Interfaces/ILoanRepository";
import { LoanRecord } from "../../src/Domain/Entities/LoanRecord";

interface LoanWithVersion extends LoanRecord {
  _version?: number;
}

export class MockLoanRepository implements ILoanRepository {
  private loans: Map<string, LoanWithVersion> = new Map();
  private callCounts: { [key: string]: number } = {};
  private operationLocks: Map<string, Promise<void>> = new Map();

  async create(loan: LoanRecord): Promise<void> {
    this.incrementCallCount('create');
    
    // Simulate database constraint check for duplicate IDs
    await this.withLock(loan.id, async () => {
      if (this.loans.has(loan.id)) {
        throw new Error(`Loan with id ${loan.id} already exists`);
      }
      
      // Add version tracking for optimistic concurrency
      const versionedLoan: LoanWithVersion = { ...loan, _version: 1 };
      this.loans.set(loan.id, versionedLoan);
    });
  }

  async update(loan: LoanRecord): Promise<void> {
    this.incrementCallCount('update');
    
    // Simulate optimistic concurrency control
    await this.withLock(loan.id, async () => {
      const existing = this.loans.get(loan.id);
      if (!existing) {
        throw new Error(`Loan with id ${loan.id} not found`);
      }
      
      // Simulate version check (like ETag in Cosmos DB)
      const existingVersion = (existing as LoanWithVersion)._version || 1;
      const versionedLoan: LoanWithVersion = { 
        ...loan, 
        _version: existingVersion + 1 
      };
      
      this.loans.set(loan.id, versionedLoan);
    });
  }

  async getById(loanId: string): Promise<LoanRecord | null> {
    this.incrementCallCount('getById');
    const loan = this.loans.get(loanId);
    // Return copy without internal version field
    return loan ? this.stripVersion(loan) : null;
  }

  async listByUser(userId: string): Promise<LoanRecord[]> {
    this.incrementCallCount('listByUser');
    
    // Simulate eventual consistency with small delay for concurrent operations
    await this.simulateNetworkLatency();
    
    return Array.from(this.loans.values())
      .map(loan => this.stripVersion(loan))
      .filter(loan => loan.userId === userId)
      .sort((a, b) => {
        if (a.status === 'Waitlisted' && b.status !== 'Waitlisted') return -1;
        if (a.status !== 'Waitlisted' && b.status === 'Waitlisted') return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }

  async getByReservation(reservationId: string): Promise<LoanRecord | null> {
    this.incrementCallCount('getByReservation');
    
    await this.simulateNetworkLatency();
    
    const loan = Array.from(this.loans.values())
      .find(loan => loan.reservationId === reservationId);
    return loan ? this.stripVersion(loan) : null;
  }

  async getByDeviceAndStatus(deviceId: string, status: string): Promise<LoanRecord[]> {
    this.incrementCallCount('getByDeviceAndStatus');
    
    await this.simulateNetworkLatency();
    
    return Array.from(this.loans.values())
      .map(loan => this.stripVersion(loan))
      .filter(loan => loan.deviceId === deviceId && loan.status === status)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  // Test utilities
  clear(): void {
    this.loans.clear();
    this.callCounts = {};
    this.operationLocks.clear();
  }

  getAllLoans(): LoanRecord[] {
    return Array.from(this.loans.values()).map(loan => this.stripVersion(loan));
  }

  getCallCount(method: string): number {
    return this.callCounts[method] || 0;
  }

  private incrementCallCount(method: string): void {
    this.callCounts[method] = (this.callCounts[method] || 0) + 1;
  }

  // Simulate database locking mechanism for write operations
  private async withLock<T>(key: string, operation: () => Promise<T>): Promise<T> {
    // Wait for any existing operation on this key
    while (this.operationLocks.has(key)) {
      await this.operationLocks.get(key);
      await new Promise(resolve => setImmediate(resolve));
    }

    // Create new lock
    let releaseLock: () => void;
    const lockPromise = new Promise<void>(resolve => {
      releaseLock = resolve;
    });
    this.operationLocks.set(key, lockPromise);

    try {
      // Simulate network/database latency
      await this.simulateNetworkLatency();
      
      // Execute the operation
      return await operation();
    } finally {
      // Release the lock
      this.operationLocks.delete(key);
      releaseLock!();
    }
  }

  // Simulate network latency (1-5ms)
  private async simulateNetworkLatency(): Promise<void> {
    const latency = Math.random() * 4 + 1;
    await new Promise(resolve => setTimeout(resolve, latency));
  }

  // Remove internal version field from returned loans
  private stripVersion(loan: LoanWithVersion): LoanRecord {
    const { _version, ...cleanLoan } = loan;
    return cleanLoan;
  }
}
