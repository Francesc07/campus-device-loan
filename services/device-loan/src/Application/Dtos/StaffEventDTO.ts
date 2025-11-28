export interface StaffEventDTO {
  eventType: "Staff.DeviceReturned";
  loanId: string;
  staffId?: string;
  // Add more fields as needed
}
