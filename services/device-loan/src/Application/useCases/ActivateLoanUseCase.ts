import { ILoanRepository } from "../Interfaces/ILoanRepository";
import { ReservationConfirmedEventDTO } from "../Dtos/ReservationEventDTO";
import { LoanStatus } from "../../Domain/Enums/LoanStatus";

export class ActivateLoanUseCase {
  constructor(private readonly repo: ILoanRepository) {}

  async execute(event: ReservationConfirmedEventDTO) {
    const loan = await this.repo.findByReservationId(event.reservationId);

    if (!loan) {
      throw new Error("Loan not found for reservation");
    }

    loan.status = LoanStatus.Active;
    loan.startDate = event.startDate;
    loan.dueDate = event.dueDate;
    loan.updatedAt = new Date().toISOString();

    return await this.repo.update(loan);
  }
}
