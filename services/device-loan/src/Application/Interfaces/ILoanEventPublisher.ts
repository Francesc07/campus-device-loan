// src/Application/Interfaces/ILoanEventPublisher.ts
import { LoanRecord } from "../../Domain/Entities/LoanRecord";

export interface ILoanEventPublisher {
  /**
   * Loan Service emits:
   *  - "Loan.Created"
   *  - "Loan.Cancelled"
   *  - "Loan.Waitlisted"
   *  - "Loan.WaitlistProcessed"
   */
  publish(eventType: "Loan.Created" | "Loan.Cancelled" | "Loan.Waitlisted" | "Loan.WaitlistProcessed", data: any): Promise<void>;
}
