export interface CreateLoanDto {
  userId: string;     // Student ID (from identity provider)
  deviceId: string;   // Device being requested
  reservationId?: string;
  userEmail?: string; // User's email (from frontend ID token claims) - preferred over Auth0 API fetch
} 
