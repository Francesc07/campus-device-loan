import { ILoanRepository } from "../Interfaces/ILoanRepository";
import { IDeviceSnapshotRepository } from "../Interfaces/IDeviceSnapshotRepository";
import { ILoanEventPublisher } from "../Interfaces/ILoanEventPublisher";
import { CreateLoanDto } from "../Dtos/CreateLoanDto";
import { LoanRecord } from "../../Domain/Entities/LoanRecord";
import { LoanStatus } from "../../Domain/Enums/LoanStatus";
import { v4 as uuidv4 } from "uuid";
import { IUserService } from "../Interfaces/IUserService";
import { EmailService } from "../../Infrastructure/Notifications/EmailService";

/**
 * Use case for creating a new device loan.
 * 
 * Handles loan creation with device availability checks, waitlist support,
 * and event publishing to notify downstream services.
 */
export class CreateLoanUseCase {
  constructor(
    private loanRepo: ILoanRepository,
    private snapshotRepo: IDeviceSnapshotRepository,
    private eventPublisher: ILoanEventPublisher,
    private userService: IUserService,
    private emailService: EmailService
  ) {}

  /**
   * Creates a new loan for the specified user and device.
   * 
   * @param dto - Loan creation data (userId, deviceId, optional reservationId)
   * @param accessToken - Optional Auth0 access token for fetching user email
   * @returns Created loan record with status (Pending if available, Waitlisted if not)
   * @throws Error if device is not found or loan creation fails
   */
  async execute(dto: CreateLoanDto, accessToken?: string): Promise<LoanRecord> {
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

    // Fetch user email from user service using accessToken
    let userEmail: string | undefined = undefined;
    try {
      userEmail = (await this.userService.getUserEmail(dto.userId, accessToken)) || undefined;
    } catch (err) {
      userEmail = undefined;
    }

    const loan: LoanRecord = {
      id: uuidv4(),
      userId: dto.userId,
      reservationId: dto.reservationId,
      deviceId: dto.deviceId,
      deviceBrand: device.brand,
      deviceModel: device.model,
      userEmail,
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

    // Send email notification to user
    if (userEmail) {
      await this.emailService.sendLoanCreatedEmail({
        userEmail: userEmail,
        userName: userEmail, // Can be enhanced with actual user name
        deviceBrand: device.brand,
        deviceModel: device.model,
        isWaitlisted: !isAvailable,
        loanId: loan.id
      });
    }

    return loan;
  }
}
