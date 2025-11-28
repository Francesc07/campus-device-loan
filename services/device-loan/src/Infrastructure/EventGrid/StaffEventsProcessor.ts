import { ILoanRepository } from "../../Application/Interfaces/ILoanRepository";

export class StaffEventsProcessor {
  constructor(private loanRepository: ILoanRepository) {}


  async handleEvent(eventType: string, data: any): Promise<void> {
    switch (eventType) {
      case "Staff.DeviceReturned":
        await this.handleDeviceReturned(data.loanId);
        break;
      default:
        // No other staff events for loan service
        break;
    }
  }

  private async handleDeviceReturned(loanId: string) {
    const loan = await this.loanRepository.getById(loanId);
    if (!loan) return;

    // Use LoanStatus enum for type safety
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { LoanStatus } = require("../../Domain/Enums/LoanStatus");
    loan.status = LoanStatus.Returned;
    loan.returnedAt = new Date().toISOString();

    await this.loanRepository.update(loan);
  }
}
