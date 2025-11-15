// src/Domain/Loan.ts
/**
 * Represents a device loan created when a student borrows/reserves a device.
 * Triggers a 2-day timer for pickup/return.
 */
export interface Loan {
  id: string;                        // Cosmos DB document id (same as loanId for uniqueness)
  loanId: string;                    // Unique loan identifier
  userId: string;                    // Student who borrowed the device
  modelId: string;                   // Device reference
  createdAt: string;                 // ISO timestamp of loan creation
  dueAt: string;                     // 2-day return window (from creation)
  status: "pending" | "active" | "cancelled" | "returned" | "overdue";
  cancelledAt?: string;              // ISO timestamp (if cancelled before pickup)
  returnedAt?: string;               // ISO timestamp (if returned)
  notes?: string;                    // Optional notes
}

export class Loan implements Loan {
  id: string;
  loanId: string;
  userId: string;
  modelId: string;
  createdAt: string;
  dueAt: string;
  status: "pending" | "active" | "cancelled" | "returned" | "overdue";
  cancelledAt?: string;
  returnedAt?: string;
  notes?: string;

  constructor(loanId: string, userId: string, modelId: string, status: "pending" | "active" | "cancelled" | "returned" | "overdue" = "pending") {
    this.id = loanId;
    this.loanId = loanId;
    this.userId = userId;
    this.modelId = modelId;
    this.status = status;
    
    const now = new Date();
    this.createdAt = now.toISOString();
    
    // 2-day loan period
    const dueDate = new Date(now);
    dueDate.setDate(now.getDate() + 2);
    this.dueAt = dueDate.toISOString();
  }

  cancel(reason?: string): void {
    this.status = "cancelled";
    this.cancelledAt = new Date().toISOString();
    if (reason) {
      this.notes = reason;
    }
  }
}

