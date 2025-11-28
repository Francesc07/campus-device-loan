export interface ListLoansDto {
  loanId?: string;
  userId?: string;
  status?: string;      // Pending, Active, Cancelled, Returned, Overdue
}
