import { LoanStatus } from "../../Domain/Enums/LoanStatus";

export interface ListLoansDto {
  loanId?: string;
  userId?: string;
  status?: LoanStatus;      // Pending, Active, Cancelled, Returned, Overdue
}
