import { LoanRecord } from "../../Domain/Entities/LoanRecord";
import { LoanStatus } from "../../Domain/Enums/LoanStatus";

export interface ILoanRepository {
  create(loan: LoanRecord): Promise<LoanRecord>;

  update(loan: LoanRecord): Promise<LoanRecord>;

  findById(id: string): Promise<LoanRecord | null>;

  findByReservationId(reservationId: string): Promise<LoanRecord | null>;

  findByUserId(userId: string): Promise<LoanRecord[]>;

  listAll(): Promise<LoanRecord[]>;

  listByStatus(status: LoanStatus): Promise<LoanRecord[]>;
}
