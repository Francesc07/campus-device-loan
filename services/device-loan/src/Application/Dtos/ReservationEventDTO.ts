export interface ReservationConfirmedEventDTO {
  reservationId: string;
  userId: string;
  deviceId: string;
  startDate: string;     // Provided by ReservationService
  dueDate: string;       // Provided by ReservationService
}

export interface ReservationCancelledEventDTO {
  reservationId: string;
  cancelledAt: string;
}
