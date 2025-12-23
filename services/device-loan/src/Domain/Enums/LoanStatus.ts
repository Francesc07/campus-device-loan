/**
 * Loan lifecycle status enumeration.
 * 
 * Defines all possible states a loan can be in during its lifecycle.
 * Status transitions are managed by use cases and triggered by events.
 */
export enum LoanStatus {
  /** Initial state when loan is created and awaiting confirmation */
  Pending = "Pending",
  
  /** Device has been collected and loan is active */
  Active = "Active",
  
  /** Loan was cancelled before device collection */
  Cancelled = "Cancelled",
  
  /** Device has been returned */
  Returned = "Returned",
  
  /** Loan is past due date and device not returned */
  Overdue = "Overdue",
  
  /** Device unavailable, loan added to waitlist */
  Waitlisted = "Waitlisted"
}
