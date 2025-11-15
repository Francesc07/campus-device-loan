import { MarkLoanReturnedHandler } from "../../Application/Handlers/MarkLoanReturnedHandler";
import { StaffReturnConfirmedEventDTO } from "../../Application/Dtos/StaffEventDTO";

export class StaffEventsProcessor {
  constructor(private readonly returnHandler: MarkLoanReturnedHandler) {}

  async handleEvent(eventType: string, data: any) {
    if (eventType === "Staff.ReturnConfirmed") {
      return this.returnHandler.execute(data as StaffReturnConfirmedEventDTO);
    }
  }
}
