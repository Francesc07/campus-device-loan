// src/Application/Interfaces/ILoanEventPublisher.ts
import { LoanRecord } from "../../Domain/Entities/LoanRecord";

export interface ILoanEventPublisher {
  /**
   * Loan Service only emits:
   *  - "Loan.Created"
   *  - "Loan.Cancelled"
   */
  publish(eventType: "Loan.Created" | "Loan.Cancelled", data: LoanRecord): Promise<void>;
}
