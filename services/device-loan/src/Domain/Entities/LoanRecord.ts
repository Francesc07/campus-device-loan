import { LoanStatus } from "../Enums/LoanStatus";

/**
 * Domain entity representing a device loan.
 * 
 * Core business object that tracks the complete lifecycle of a device loan,
 * from creation through activation, return, or cancellation.
 * 
 * Includes rich metadata (device brand/model, user email) to minimize
 * API calls from downstream services like Confirmation Service.
 */
export interface LoanRecord {
  /** Unique loan identifier (UUID) */
  id: string;
  
  /** User/student identifier from Auth0 */
  userId: string;
  
  /** Optional reservation reference from Reservation Service */
  reservationId?: string;
  
  /** Device identifier from Catalog Service */
  deviceId: string;

  /** Device brand for display (e.g., "Apple", "Dell") */
  deviceBrand?: string;
  
  /** Device model for display (e.g., "MacBook Pro 16", "iPad Air") */
  deviceModel?: string;
  
  /** User email address from Auth0 for notifications */
  userEmail?: string;

  /** Loan start timestamp (ISO 8601) */
  startDate: string;
  
  /** Loan due date timestamp (ISO 8601) */
  dueDate: string;

  /** Current loan status */
  status: LoanStatus;

  /** Record creation timestamp (ISO 8601) */
  createdAt: string;
  
  /** Last update timestamp (ISO 8601) */
  updatedAt: string;

  /** Return timestamp if returned (ISO 8601) */
  returnedAt?: string;
  
  /** Cancellation timestamp if cancelled (ISO 8601) */
  cancelledAt?: string;
  
  /** Optional notes or comments */
  notes?: string;
}
