import { LoanStatus } from "../Enums/LoanStatus";

export interface LoanRecord {
  id: string;               // UUID for loan
  userId: string;
  reservationId?: string;
  deviceId: string;

  startDate: string;
  dueDate: string;

  status: LoanStatus;

  createdAt: string;
  updatedAt: string;

  returnedAt?: string;
  cancelledAt?: string;
  notes?: string;
}
