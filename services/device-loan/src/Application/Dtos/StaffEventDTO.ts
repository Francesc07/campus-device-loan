export interface StaffReturnConfirmedEventDTO {
  reservationId: string;
  returnedAt: string;
  staffId: string;      // For audit
}
