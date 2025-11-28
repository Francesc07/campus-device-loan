export interface ReservationEventDTO {
  eventType: "Reservation.Confirmed" | "Reservation.Cancelled";
  reservationId: string;
  deviceId: string;
  userId: string;
  reason?: string;

  // Only present in Reservation.Cancelled
  loanId?: string;
}
