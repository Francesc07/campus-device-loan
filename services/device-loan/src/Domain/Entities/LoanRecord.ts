import { LoanStatus } from "../Enums/LoanStatus";


export interface LoanRecord {
  id: string;               // UUID for loan
  userId: string;
  reservationId?: string;
  deviceId: string;

  // Metadata for frontend display
  deviceBrand?: string;     // e.g., "Apple", "Dell"
  deviceModel?: string;     // e.g., "MacBook Pro 16", "iPad Air"
  userEmail?: string;       // e.g., "user@email.com"

  startDate: string;
  dueDate: string;

  status: LoanStatus;

  createdAt: string;
  updatedAt: string;

  returnedAt?: string;
  cancelledAt?: string;
  notes?: string;
}
