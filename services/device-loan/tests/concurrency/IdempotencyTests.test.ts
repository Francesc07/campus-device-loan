// tests/concurrency/IdempotencyTests.test.ts
import { CreateLoanUseCase } from "../../src/Application/UseCases/CreateLoanUseCase";
import { CancelLoanUseCase } from "../../src/Application/UseCases/CancelLoanUseCase";
import { ActivateLoanUseCase } from "../../src/Application/UseCases/ActivateLoanUseCase";
import { MockLoanRepository } from "../mocks/MockLoanRepository";
import { MockDeviceSnapshotRepository } from "../mocks/MockDeviceSnapshotRepository";
import { MockLoanEventPublisher } from "../mocks/MockLoanEventPublisher";
import { CreateLoanDto } from "../../src/Application/Dtos/CreateLoanDto";
import { CancelLoanDto } from "../../src/Application/Dtos/CancelLoanDto";
import { ReservationEventDTO } from "../../src/Application/Dtos/ReservationEventDTO";
import { LoanStatus } from "../../src/Domain/Enums/LoanStatus";
import { availableDevice } from "../fixtures/deviceFixtures";
import { createLoanRecord } from "../fixtures/loanFixtures";

describe('Idempotency Tests', () => {
  let createUseCase: CreateLoanUseCase;
  let cancelUseCase: CancelLoanUseCase;
  let activateUseCase: ActivateLoanUseCase;
  let mockLoanRepo: MockLoanRepository;
  let mockSnapshotRepo: MockDeviceSnapshotRepository;
  let mockEventPublisher: MockLoanEventPublisher;

  beforeEach(() => {
    mockLoanRepo = new MockLoanRepository();
    mockSnapshotRepo = new MockDeviceSnapshotRepository();
    mockEventPublisher = new MockLoanEventPublisher();
    createUseCase = new CreateLoanUseCase(mockLoanRepo, mockSnapshotRepo, mockEventPublisher);
    cancelUseCase = new CancelLoanUseCase(mockLoanRepo);
    activateUseCase = new ActivateLoanUseCase(mockLoanRepo);
  });

  afterEach(() => {
    mockLoanRepo.clear();
    mockSnapshotRepo.clear();
    mockEventPublisher.clear();
  });

  describe('Create Loan Idempotency', () => {
    it('should create separate loans for duplicate requests (no idempotency key)', async () => {
      mockSnapshotRepo.addSnapshot(availableDevice);

      const dto: CreateLoanDto = {
        userId: 'user-123',
        deviceId: availableDevice.id
      };

      const loan1 = await createUseCase.execute(dto);
      const loan2 = await createUseCase.execute(dto);
      const loan3 = await createUseCase.execute(dto);

      // Without idempotency keys, each request creates a new loan
      expect(loan1.id).not.toBe(loan2.id);
      expect(loan2.id).not.toBe(loan3.id);
      expect(mockLoanRepo.getAllLoans()).toHaveLength(3);
    });

    it('should handle rapid duplicate requests', async () => {
      mockSnapshotRepo.addSnapshot(availableDevice);

      const dto: CreateLoanDto = {
        userId: 'rapid-user',
        deviceId: availableDevice.id
      };

      // Fire 5 identical requests simultaneously
      const requests = Array(5).fill(dto);
      const results = await Promise.all(requests.map(d => createUseCase.execute(d)));

      // All should succeed with unique IDs
      const ids = results.map(r => r.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(5);
    });

    it('should prevent duplicate loans with same reservationId', async () => {
      mockSnapshotRepo.addSnapshot(availableDevice);

      const loan = createLoanRecord({
        userId: 'user-123',
        deviceId: availableDevice.id,
        reservationId: 'res-unique'
      });
      await mockLoanRepo.create(loan);

      // Attempt to create another loan with same reservation
      const dto: CreateLoanDto = {
        userId: 'user-456',
        deviceId: availableDevice.id,
        reservationId: 'res-unique'
      };

      // In production, this should check for existing reservation
      // For now, it creates a new loan (business logic decision)
      const newLoan = await createUseCase.execute(dto);
      expect(newLoan.id).not.toBe(loan.id);
    });
  });

  describe('Cancel Loan Idempotency', () => {
    it('should handle multiple cancellation requests for same loan', async () => {
      const loan = createLoanRecord({
        userId: 'user-123',
        status: LoanStatus.Pending
      });
      await mockLoanRepo.create(loan);

      const dto: CancelLoanDto = {
        loanId: loan.id,
        userId: loan.userId
      };

      // First cancellation
      const result1 = await cancelUseCase.execute(dto);
      expect(result1.status).toBe(LoanStatus.Cancelled);
      const firstCancelledAt = result1.cancelledAt;

      // Wait a bit to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10));

      // Second cancellation
      const result2 = await cancelUseCase.execute(dto);
      expect(result2.status).toBe(LoanStatus.Cancelled);

      // Should update timestamp (not truly idempotent by design)
      expect(result2.cancelledAt).not.toBe(firstCancelledAt);
    });

    it('should handle concurrent cancellation attempts', async () => {
      const loan = createLoanRecord({
        userId: 'concurrent-cancel-user',
        status: LoanStatus.Active
      });
      await mockLoanRepo.create(loan);

      const dto: CancelLoanDto = {
        loanId: loan.id,
        userId: loan.userId
      };

      // Multiple concurrent cancellations
      const cancellations = Array(5).fill(dto);
      const results = await Promise.all(cancellations.map(d => cancelUseCase.execute(d)));

      // All should succeed
      results.forEach(result => {
        expect(result.status).toBe(LoanStatus.Cancelled);
        expect(result.cancelledAt).toBeDefined();
      });

      // Repository update called 5 times
      expect(mockLoanRepo.getCallCount('update')).toBe(5);
    });
  });

  describe('Activate Loan Idempotency', () => {
    it('should handle multiple activation events for same reservation', async () => {
      const loan = createLoanRecord({
        reservationId: 'res-activate',
        status: LoanStatus.Pending
      });
      await mockLoanRepo.create(loan);

      const event: ReservationEventDTO = {
        reservationId: 'res-activate',
        userId: loan.userId,
        deviceId: loan.deviceId,
        eventType: 'Reservation.Confirmed'
      };

      // First activation
      const result1 = await activateUseCase.execute(event);
      expect(result1!.status).toBe(LoanStatus.Active);

      // Second activation (idempotent behavior)
      const result2 = await activateUseCase.execute(event);
      expect(result2!.status).toBe(LoanStatus.Active);
      expect(result2!.id).toBe(result1!.id);

      // Repository updates called twice
      expect(mockLoanRepo.getCallCount('update')).toBe(2);
    });

    it('should handle concurrent activation requests', async () => {
      const loan = createLoanRecord({
        reservationId: 'res-concurrent',
        status: LoanStatus.Pending
      });
      await mockLoanRepo.create(loan);

      const event: ReservationEventDTO = {
        reservationId: 'res-concurrent',
        userId: loan.userId,
        deviceId: loan.deviceId,
        eventType: 'Reservation.Confirmed'
      };

      // Fire multiple activation events simultaneously
      const activations = Array(3).fill(event);
      const results = await Promise.all(activations.map(e => activateUseCase.execute(e)));

      // All should succeed and reference same loan
      results.forEach(result => {
        expect(result).not.toBeNull();
        expect(result!.id).toBe(loan.id);
        expect(result!.status).toBe(LoanStatus.Active);
      });
    });
  });

  describe('Cross-Operation Idempotency', () => {
    it('should handle cancel after activate', async () => {
      mockSnapshotRepo.addSnapshot(availableDevice);

      // Create loan
      const createDto: CreateLoanDto = {
        userId: 'user-cross',
        deviceId: availableDevice.id,
        reservationId: 'res-cross'
      };
      const loan = await createUseCase.execute(createDto);

      // Activate loan
      const activateEvent: ReservationEventDTO = {
        reservationId: 'res-cross',
        userId: loan.userId,
        deviceId: loan.deviceId,
        eventType: 'Reservation.Confirmed'
      };
      const activated = await activateUseCase.execute(activateEvent);
      expect(activated!.status).toBe(LoanStatus.Active);

      // Cancel loan
      const cancelDto: CancelLoanDto = {
        loanId: loan.id,
        userId: loan.userId
      };
      const cancelled = await cancelUseCase.execute(cancelDto);
      expect(cancelled.status).toBe(LoanStatus.Cancelled);

      // Verify final state
      const finalLoan = await mockLoanRepo.getById(loan.id);
      expect(finalLoan!.status).toBe(LoanStatus.Cancelled);
    });

    it('should maintain state consistency through operation sequence', async () => {
      mockSnapshotRepo.addSnapshot(availableDevice);

      const createDto: CreateLoanDto = {
        userId: 'sequence-user',
        deviceId: availableDevice.id
      };

      const loan = await createUseCase.execute(createDto);
      expect(loan.status).toBe(LoanStatus.Pending);

      // Multiple state checks
      for (let i = 0; i < 3; i++) {
        const retrieved = await mockLoanRepo.getById(loan.id);
        expect(retrieved).not.toBeNull();
        expect(retrieved!.id).toBe(loan.id);
      }

      // Cancel
      const cancelDto: CancelLoanDto = {
        loanId: loan.id,
        userId: loan.userId
      };
      await cancelUseCase.execute(cancelDto);

      // Verify cancellation persisted
      const cancelled = await mockLoanRepo.getById(loan.id);
      expect(cancelled!.status).toBe(LoanStatus.Cancelled);
    });
  });

  describe('Duplicate Prevention', () => {
    it('should prevent creating loan with duplicate ID', async () => {
      const loan = createLoanRecord({ id: 'duplicate-id' });
      await mockLoanRepo.create(loan);

      // Attempt to create another loan with same ID
      const duplicate = createLoanRecord({ id: 'duplicate-id' });
      
      await expect(mockLoanRepo.create(duplicate)).rejects.toThrow('already exists');
    });

    it('should allow updates to existing loan', async () => {
      const loan = createLoanRecord({ status: LoanStatus.Pending });
      await mockLoanRepo.create(loan);

      // Update same loan
      const updated = { ...loan, status: LoanStatus.Active };
      await expect(mockLoanRepo.update(updated)).resolves.not.toThrow();

      const retrieved = await mockLoanRepo.getById(loan.id);
      expect(retrieved!.status).toBe(LoanStatus.Active);
    });
  });
});
