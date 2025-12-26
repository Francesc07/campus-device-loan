// tests/integration/LoanWorkflow.integration.test.ts
import { CreateLoanUseCase } from "../../src/Application/UseCases/CreateLoanUseCase";
import { CancelLoanUseCase } from "../../src/Application/UseCases/CancelLoanUseCase";
import { ActivateLoanUseCase } from "../../src/Application/UseCases/ActivateLoanUseCase";
import { GetLoanByIdUseCase } from "../../src/Application/UseCases/GetLoanByIdUseCase";
import { ListLoansUseCase } from "../../src/Application/UseCases/ListLoansUseCase";
import { MockLoanRepository } from "../mocks/MockLoanRepository";
import { MockDeviceSnapshotRepository } from "../mocks/MockDeviceSnapshotRepository";
import { MockLoanEventPublisher } from "../mocks/MockLoanEventPublisher";
import { MockUserService } from "../mocks/MockUserService";
import { MockEmailService } from "../mocks/MockEmailService";
import { CreateLoanDto } from "../../src/Application/Dtos/CreateLoanDto";
import { CancelLoanDto } from "../../src/Application/Dtos/CancelLoanDto";
import { ReservationEventDTO } from "../../src/Application/Dtos/ReservationEventDTO";
import { ListLoansDto } from "../../src/Application/Dtos/ListLoansDto";
import { LoanStatus } from "../../src/Domain/Enums/LoanStatus";
import { createDeviceSnapshot } from "../fixtures/deviceFixtures";

describe('Loan Workflow Integration Tests', () => {
  let mockLoanRepo: MockLoanRepository;
  let mockSnapshotRepo: MockDeviceSnapshotRepository;
  let mockEventPublisher: MockLoanEventPublisher;
  let mockUserService: MockUserService;
  let mockEmailService: MockEmailService;
  
  let createLoanUseCase: CreateLoanUseCase;
  let cancelLoanUseCase: CancelLoanUseCase;
  let activateLoanUseCase: ActivateLoanUseCase;
  let getLoanUseCase: GetLoanByIdUseCase;
  let listLoansUseCase: ListLoansUseCase;

  beforeEach(() => {
    mockLoanRepo = new MockLoanRepository();
    mockSnapshotRepo = new MockDeviceSnapshotRepository();
    mockEventPublisher = new MockLoanEventPublisher();
    mockUserService = new MockUserService();
    mockEmailService = new MockEmailService();

    createLoanUseCase = new CreateLoanUseCase(mockLoanRepo, mockSnapshotRepo, mockEventPublisher, mockUserService, mockEmailService as any);
    cancelLoanUseCase = new CancelLoanUseCase(mockLoanRepo, mockEventPublisher);
    activateLoanUseCase = new ActivateLoanUseCase(mockLoanRepo, mockEventPublisher);
    getLoanUseCase = new GetLoanByIdUseCase(mockLoanRepo);
    listLoansUseCase = new ListLoansUseCase(mockLoanRepo);
  });

  afterEach(() => {
    mockLoanRepo.clear();
    mockSnapshotRepo.clear();
    mockEventPublisher.clear();
  });

  describe('Complete Loan Lifecycle', () => {
    it('should complete full loan lifecycle: create -> activate -> cancel', async () => {
      // Setup
      const device = createDeviceSnapshot({
        id: 'device-lifecycle',
        availableCount: 5
      });
      mockSnapshotRepo.addSnapshot(device);

      // Step 1: Create loan with reservation
      const createDto: CreateLoanDto = {
        userId: 'lifecycle-user',
        deviceId: device.id,
        reservationId: 'res-lifecycle'
      };

      const createdLoan = await createLoanUseCase.execute(createDto);
      expect(createdLoan.status).toBe(LoanStatus.Pending);
      expect(createdLoan.reservationId).toBe('res-lifecycle');

      // Verify events
      const createEvents = mockEventPublisher.getEventsByType('Loan.Created');
      expect(createEvents).toHaveLength(1);

      // Step 2: Retrieve loan by ID
      const retrievedLoan = await getLoanUseCase.execute(createdLoan.id);
      expect(retrievedLoan).not.toBeNull();
      expect(retrievedLoan!.id).toBe(createdLoan.id);
      expect(retrievedLoan!.status).toBe(LoanStatus.Pending);

      // Step 3: Activate loan via reservation confirmation
      const activateEvent: ReservationEventDTO = {
        reservationId: 'res-lifecycle',
        userId: createdLoan.userId,
        deviceId: device.id,
        eventType: 'Reservation.Confirmed'
      };

      const activatedLoan = await activateLoanUseCase.execute(activateEvent);
      expect(activatedLoan).not.toBeNull();
      expect(activatedLoan!.status).toBe(LoanStatus.Active);

      // Step 4: Verify activation persisted
      const activeLoan = await getLoanUseCase.execute(createdLoan.id);
      expect(activeLoan!.status).toBe(LoanStatus.Active);

      // Step 5: Cancel loan
      const cancelDto: CancelLoanDto = {
        loanId: createdLoan.id,
        userId: createdLoan.userId
      };

      const cancelledLoan = await cancelLoanUseCase.execute(cancelDto);
      expect(cancelledLoan.status).toBe(LoanStatus.Cancelled);
      expect(cancelledLoan.cancelledAt).toBeDefined();

      // Step 6: Verify final state
      const finalLoan = await getLoanUseCase.execute(createdLoan.id);
      expect(finalLoan!.status).toBe(LoanStatus.Cancelled);
    });

    it('should handle waitlist workflow for unavailable device', async () => {
      const device = createDeviceSnapshot({
        id: 'device-waitlist',
        availableCount: 0,
        maxDeviceCount: 5
      });
      mockSnapshotRepo.addSnapshot(device);

      // Create loan for unavailable device
      const createDto: CreateLoanDto = {
        userId: 'waitlist-user',
        deviceId: device.id
      };

      const loan = await createLoanUseCase.execute(createDto);
      expect(loan.status).toBe(LoanStatus.Waitlisted);

      // Verify waitlist event published
      const waitlistEvents = mockEventPublisher.getEventsByType('Loan.Waitlisted');
      expect(waitlistEvents).toHaveLength(1);
      expect(waitlistEvents[0].data.message).toContain('unavailable');

      // Verify loan is retrievable
      const retrieved = await getLoanUseCase.execute(loan.id);
      expect(retrieved!.status).toBe(LoanStatus.Waitlisted);
    });
  });

  describe('Multi-User Scenarios', () => {
    it('should handle multiple users requesting same device', async () => {
      const device = createDeviceSnapshot({
        id: 'device-popular',
        availableCount: 2
      });
      mockSnapshotRepo.addSnapshot(device);

      const users = ['user-1', 'user-2', 'user-3'];
      const loans = [];

      for (const userId of users) {
        const dto: CreateLoanDto = {
          userId,
          deviceId: device.id
        };
        const loan = await createLoanUseCase.execute(dto);
        loans.push(loan);
      }

      // All loans created
      expect(loans).toHaveLength(3);

      // Each user can retrieve their loans
      for (const userId of users) {
        const dto: ListLoansDto = { userId };
        const userLoans = await listLoansUseCase.execute(dto);
        expect(userLoans).toHaveLength(1);
        expect(userLoans[0].userId).toBe(userId);
      }
    });

    it('should prevent user from canceling another users loan', async () => {
      const device = createDeviceSnapshot({
        id: 'device-auth',
        availableCount: 5
      });
      mockSnapshotRepo.addSnapshot(device);

      // User 1 creates loan
      const createDto: CreateLoanDto = {
        userId: 'user-owner',
        deviceId: device.id
      };
      const loan = await createLoanUseCase.execute(createDto);

      // User 2 attempts to cancel User 1's loan
      const cancelDto: CancelLoanDto = {
        loanId: loan.id,
        userId: 'user-unauthorized'
      };

      await expect(cancelLoanUseCase.execute(cancelDto)).rejects.toThrow('Unauthorized');
    });

    it('should list loans correctly for user with multiple loans', async () => {
      const device1 = createDeviceSnapshot({
        id: 'device-multi-1',
        availableCount: 5
      });
      const device2 = createDeviceSnapshot({
        id: 'device-multi-2',
        availableCount: 3
      });
      mockSnapshotRepo.addSnapshot(device1);
      mockSnapshotRepo.addSnapshot(device2);

      const userId = 'multi-loan-user';

      // Create multiple loans
      const loan1 = await createLoanUseCase.execute({
        userId,
        deviceId: device1.id
      });
      const loan2 = await createLoanUseCase.execute({
        userId,
        deviceId: device2.id
      });

      // List all loans for user
      const dto: ListLoansDto = { userId };
      const loans = await listLoansUseCase.execute(dto);

      expect(loans).toHaveLength(2);
      const loanIds = loans.map(l => l.id);
      expect(loanIds).toContain(loan1.id);
      expect(loanIds).toContain(loan2.id);
    });
  });

  describe('Event-Driven Workflows', () => {
    it('should publish events in correct order', async () => {
      const device = createDeviceSnapshot({
        id: 'device-events',
        availableCount: 3
      });
      mockSnapshotRepo.addSnapshot(device);

      // Create loan
      const createDto: CreateLoanDto = {
        userId: 'event-user',
        deviceId: device.id,
        reservationId: 'res-events'
      };
      await createLoanUseCase.execute(createDto);

      const allEvents = mockEventPublisher.getPublishedEvents();
      expect(allEvents).toHaveLength(1);
      expect(allEvents[0].eventType).toBe('Loan.Created');
      expect(allEvents[0].timestamp).toBeInstanceOf(Date);
    });

    it('should handle activation without prior loan creation gracefully', async () => {
      const event: ReservationEventDTO = {
        reservationId: 'res-orphaned',
        userId: 'orphan-user',
        deviceId: 'device-orphan',
        eventType: 'Reservation.Confirmed'
      };

      const result = await activateLoanUseCase.execute(event);
      expect(result).toBeNull();
    });
  });

  describe('Data Consistency', () => {
    it('should maintain referential integrity across operations', async () => {
      const device = createDeviceSnapshot({
        id: 'device-integrity',
        availableCount: 5
      });
      mockSnapshotRepo.addSnapshot(device);

      const createDto: CreateLoanDto = {
        userId: 'integrity-user',
        deviceId: device.id
      };

      const loan = await createLoanUseCase.execute(createDto);
      const originalUpdatedAt = loan.updatedAt;

      // Multiple retrievals should return consistent data
      const retrieval1 = await getLoanUseCase.execute(loan.id);
      const retrieval2 = await getLoanUseCase.execute(loan.id);

      expect(retrieval1).toEqual(retrieval2);
      expect(retrieval1!.updatedAt).toBe(originalUpdatedAt);
    });

    it('should track all state transitions correctly', async () => {
      const device = createDeviceSnapshot({
        id: 'device-transitions',
        availableCount: 5
      });
      mockSnapshotRepo.addSnapshot(device);

      const createDto: CreateLoanDto = {
        userId: 'transition-user',
        deviceId: device.id,
        reservationId: 'res-transition'
      };

      // Create (Pending)
      const created = await createLoanUseCase.execute(createDto);
      expect(created.status).toBe(LoanStatus.Pending);
      const createdAt = new Date(created.createdAt);

      // Activate (Active)
      const activateEvent: ReservationEventDTO = {
        reservationId: 'res-transition',
        userId: created.userId,
        deviceId: device.id,
        eventType: 'Reservation.Confirmed'
      };
      const activated = await activateLoanUseCase.execute(activateEvent);
      expect(activated!.status).toBe(LoanStatus.Active);
      const activatedAt = new Date(activated!.updatedAt);
      expect(activatedAt.getTime()).toBeGreaterThan(createdAt.getTime());

      // Cancel (Cancelled)
      const cancelDto: CancelLoanDto = {
        loanId: created.id,
        userId: created.userId
      };
      const cancelled = await cancelLoanUseCase.execute(cancelDto);
      expect(cancelled.status).toBe(LoanStatus.Cancelled);
      const cancelledAt = new Date(cancelled.updatedAt);
      expect(cancelledAt.getTime()).toBeGreaterThan(activatedAt.getTime());
    });
  });

  describe('Error Recovery', () => {
    it('should recover from partial failures', async () => {
      const device = createDeviceSnapshot({
        id: 'device-recovery',
        availableCount: 3
      });
      mockSnapshotRepo.addSnapshot(device);

      // Create loan successfully
      const createDto: CreateLoanDto = {
        userId: 'recovery-user',
        deviceId: device.id
      };
      const loan = await createLoanUseCase.execute(createDto);

      // Simulate event publishing failure on next operation
      mockEventPublisher.setShouldFail(true);

      // Attempt another operation that would fail
      const createDto2: CreateLoanDto = {
        userId: 'recovery-user-2',
        deviceId: device.id
      };
      await expect(createLoanUseCase.execute(createDto2)).rejects.toThrow();

      // Original loan should still be accessible
      const retrieved = await getLoanUseCase.execute(loan.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved!.id).toBe(loan.id);
    });
  });

  describe('Performance Characteristics', () => {
    it('should handle batch loan creation efficiently', async () => {
      const device = createDeviceSnapshot({
        id: 'device-batch',
        availableCount: 50
      });
      mockSnapshotRepo.addSnapshot(device);

      const batchSize = 25;
      const startTime = Date.now();

      const loans = [];
      for (let i = 0; i < batchSize; i++) {
        const dto: CreateLoanDto = {
          userId: `batch-user-${i}`,
          deviceId: device.id
        };
        const loan = await createLoanUseCase.execute(dto);
        loans.push(loan);
      }

      const duration = Date.now() - startTime;

      expect(loans).toHaveLength(batchSize);
      console.log(`Batch creation of ${batchSize} loans completed in ${duration}ms`);
      
      // Verify all loans are retrievable
      for (const loan of loans) {
        const retrieved = await getLoanUseCase.execute(loan.id);
        expect(retrieved).not.toBeNull();
      }
    });
  });
});
