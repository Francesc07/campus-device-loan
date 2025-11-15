import { randomUUID } from "crypto";
import { ILoanRepository } from "../Interfaces/ILoanRepository";
import { ILoanEventPublisher } from "../Interfaces/ILoanEventPublisher";
import { CreateLoanDto } from "../Dtos/CreateLoanDto";
import { LoanRecord } from "../../Domain/Entities/LoanRecord";
import { LoanStatus } from "../../Domain/Enums/LoanStatus";
import { DeviceSnapshotRepository } from "../../Infrastructure/Persistence/DeviceSnapshotRepository";

export class CreateLoanUseCase {
  constructor(
    private readonly repo: ILoanRepository,
    private readonly publisher: ILoanEventPublisher
  ) {}

  async execute(dto: CreateLoanDto): Promise<LoanRecord> {
    // Validate device availability from local snapshot (resilience pattern)
    const deviceRepo = new DeviceSnapshotRepository();
    const device = await deviceRepo.findById(dto.deviceId);

    if (!device) {
      throw new Error(`Device ${dto.deviceId} not found in catalog snapshot. Please sync device catalog.`);
    }

    if (device.availableCount <= 0) {
      throw new Error(`Device ${device.model} is not available. Available count: ${device.availableCount}`);
    }

    const now = new Date().toISOString();

    const loan: LoanRecord = {
      id: randomUUID(),
      userId: dto.userId,
      reservationId: "",        // Filled after Reservation.Confirmed
      deviceId: dto.deviceId,
      startDate: "",            // Set by Reservation.Confirmed
      dueDate: "",              // Set by Reservation.Confirmed
      status: LoanStatus.Pending,
      createdAt: now,
      updatedAt: now,
      notes: dto.notes,
    };

    const saved = await this.repo.create(loan);

    await this.publisher.publishLoanCreated(saved);

    return saved;
  }
}
