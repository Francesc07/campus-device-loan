import { LoanRecord } from "../../Domain/Entities/LoanRecord";

export interface ILoanEventPublisher {
  publishLoanCreated(loan: LoanRecord): Promise<void>;
  publishLoanCancelled(loan: LoanRecord): Promise<void>;
  publishLoanReturned(loan: LoanRecord): Promise<void>;
}
