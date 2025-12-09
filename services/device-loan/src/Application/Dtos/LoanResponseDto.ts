
import { LoanStatus } from "../../Domain/Enums/LoanStatus";

export interface LoanResponseDto {
  id: string;
  userId: string;
  deviceId: string;
  reservationId?: string | null;

  startDate: string;
  dueDate: string;
  endDate?: string | null;

  status: LoanStatus;

  createdAt: string;
  updatedAt: string;
}
