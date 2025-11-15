import { ILoanRepository } from "../Interfaces/ILoanRepository";
import { ILoanEventPublisher } from "../Interfaces/ILoanEventPublisher";
import { StaffReturnConfirmedEventDTO } from "../Dtos/StaffEventDTO";
import { LoanStatus } from "../../Domain/Enums/LoanStatus";

export class MarkLoanReturnedUseCase {
  constructor(
    private readonly repo: ILoanRepository,
    private readonly publisher: ILoanEventPublisher
  ) {}

  async execute(event: StaffReturnConfirmedEventDTO) {
    const loan = await this.repo.findByReservationId(event.reservationId);
    if (!loan) throw new Error("Loan not found for reservation");

    loan.status = LoanStatus.Returned;
    loan.returnedAt = event.returnedAt;
    loan.updatedAt = event.returnedAt;

    const updated = await this.repo.update(loan);

    await this.publisher.publishLoanReturned(updated);

    return updated;
  }
}
