import { LoanRecord } from "../../Domain/Entities/LoanRecord";
import { LoanStatus } from "../../Domain/Enums/LoanStatus";

export interface ILoanRepository {
  create(loan: LoanRecord): Promise<void>;
  update(loan: LoanRecord): Promise<void>;
  getById(loanId: string): Promise<LoanRecord | null>;
  listByUser(userId: string): Promise<LoanRecord[]>;
  getByReservation(reservationId: string): Promise<LoanRecord | null>;
  getByDeviceAndStatus(deviceId: string, status: LoanStatus): Promise<LoanRecord[]>;
}
