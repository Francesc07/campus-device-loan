export interface ReservationConfirmedEvent {
  reservationId: string;
  userId: string;
  deviceId: string;
  startDate: string;
  dueDate: string;
}

export interface ReservationCancelledEvent {
  reservationId: string;
  cancelledAt: string;
}

export interface IReservationEventConsumer {
  processReservationConfirmed(event: ReservationConfirmedEvent): Promise<void>;
  processReservationCancelled(event: ReservationCancelledEvent): Promise<void>;
}

