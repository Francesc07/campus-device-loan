import { ILoanRepository } from "../Interfaces/ILoanRepository";
import { IDeviceSnapshotRepository } from "../Interfaces/IDeviceSnapshotRepository";
import { ILoanEventPublisher } from "../Interfaces/ILoanEventPublisher";
import { CreateLoanDto } from "../Dtos/CreateLoanDto";
import { LoanRecord } from "../../Domain/Entities/LoanRecord";
import { LoanStatus } from "../../Domain/Enums/LoanStatus";
import { v4 as uuidv4 } from "uuid";

export class CreateLoanUseCase {
  constructor(
    private loanRepo: ILoanRepository,
    private snapshotRepo: IDeviceSnapshotRepository,
    private eventPublisher: ILoanEventPublisher
  ) {}

  async execute(dto: CreateLoanDto): Promise<LoanRecord> {
    const device = await this.snapshotRepo.getSnapshot(dto.deviceId);

    if (!device) {
      throw new Error("Device not found.");
    }

    const now = new Date();
    const due = new Date();
    due.setDate(due.getDate() + 2); // standard 2-day loan

    // Check if device is available
    const isAvailable = device.availableCount > 0;
    const status = isAvailable ? LoanStatus.Pending : LoanStatus.Waitlisted;

    const loan: LoanRecord = {
      id: uuidv4(),
      userId: dto.userId,
      reservationId: dto.reservationId,
      deviceId: dto.deviceId,
      startDate: now.toISOString(),
      dueDate: due.toISOString(),
      status: status,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };

    await this.loanRepo.create(loan);

    // Publish appropriate event based on status
    if (isAvailable) {
      await this.eventPublisher.publish("Loan.Created", loan);
    } else {
      await this.eventPublisher.publish("Loan.Waitlisted", {
        ...loan,
        message: `Device ${device.brand} ${device.model} is currently unavailable. Request added to waitlist.`
      });
    }

    return loan;
  }
}
