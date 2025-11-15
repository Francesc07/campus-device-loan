export interface CreateLoanDto {
  userId: string;     // Student ID (from identity provider)
  deviceId: string;   // Device being requested
  notes?: string;     // Optional student notes
}
