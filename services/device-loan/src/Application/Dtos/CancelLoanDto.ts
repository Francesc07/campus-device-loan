export interface CancelLoanDto {
  loanId: string;
  userId: string;        // Ensure student is owner
  reason?: string
}
