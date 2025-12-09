// tests/unit/useCases/ActivateLoanUseCase.test.ts
import { ActivateLoanUseCase } from "../../../src/Application/UseCases/ActivateLoanUseCase";
import { MockLoanRepository } from "../../mocks/MockLoanRepository";
import { ReservationEventDTO } from "../../../src/Application/Dtos/ReservationEventDTO";
import { LoanStatus } from "../../../src/Domain/Enums/LoanStatus";
import { createLoanRecord } from "../../fixtures/loanFixtures";

describe('ActivateLoanUseCase', () => {
  let useCase: ActivateLoanUseCase;
  let mockLoanRepo: MockLoanRepository;

  beforeEach(() => {
    mockLoanRepo = new MockLoanRepository();
    useCase = new ActivateLoanUseCase(mockLoanRepo);
  });

  afterEach(() => {
    mockLoanRepo.clear();
  });

  describe('Successful Activation', () => {
    it('should activate a pending loan with reservation', async () => {
      const loan = createLoanRecord({
        userId: 'user-123',
        reservationId: 'res-456',
        status: LoanStatus.Pending
      });
      await mockLoanRepo.create(loan);

      const event: ReservationEventDTO = {
        reservationId: 'res-456',
        userId: 'user-123',
        deviceId: loan.deviceId,
        eventType: 'Reservation.Confirmed'
      };

      const result = await useCase.execute(event);

      expect(result).not.toBeNull();
      expect(result!.status).toBe(LoanStatus.Active);
      expect(result!.id).toBe(loan.id);
    });

    it('should update the updatedAt timestamp', async () => {
      const originalUpdatedAt = new Date(Date.now() - 5000).toISOString();
      const loan = createLoanRecord({
        reservationId: 'res-789',
        status: LoanStatus.Pending,
        updatedAt: originalUpdatedAt
      });
      await mockLoanRepo.create(loan);

      const event: ReservationEventDTO = {
        reservationId: 'res-789',
        userId: loan.userId,
        deviceId: loan.deviceId,
        eventType: 'Reservation.Confirmed'
      };

      const result = await useCase.execute(event);

      expect(result!.updatedAt).not.toBe(originalUpdatedAt);
      const updatedTime = new Date(result!.updatedAt);
      expect(updatedTime.getTime()).toBeGreaterThan(new Date(originalUpdatedAt).getTime());
    });

    it('should persist activation to repository', async () => {
      const loan = createLoanRecord({
        reservationId: 'res-123',
        status: LoanStatus.Pending
      });
      await mockLoanRepo.create(loan);

      const event: ReservationEventDTO = {
        reservationId: 'res-123',
        userId: loan.userId,
        deviceId: loan.deviceId,
        eventType: 'Reservation.Confirmed'
      };

      await useCase.execute(event);

      const updatedLoan = await mockLoanRepo.getById(loan.id);
      expect(updatedLoan!.status).toBe(LoanStatus.Active);
      expect(mockLoanRepo.getCallCount('update')).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    it('should return null when reservation not found', async () => {
      const event: ReservationEventDTO = {
        reservationId: 'non-existent-reservation',
        userId: 'user-123',
        deviceId: 'device-456',
        eventType: 'Reservation.Confirmed'
      };

      const result = await useCase.execute(event);

      expect(result).toBeNull();
      expect(mockLoanRepo.getCallCount('update')).toBe(0);
    });

    it('should handle activation of already active loan', async () => {
      const loan = createLoanRecord({
        reservationId: 'res-active',
        status: LoanStatus.Active
      });
      await mockLoanRepo.create(loan);

      const event: ReservationEventDTO = {
        reservationId: 'res-active',
        userId: loan.userId,
        deviceId: loan.deviceId,
        eventType: 'Reservation.Confirmed'
      };

      const result = await useCase.execute(event);

      expect(result!.status).toBe(LoanStatus.Active);
    });

    it('should not throw error for non-existent reservation', async () => {
      const event: ReservationEventDTO = {
        reservationId: 'missing-reservation',
        userId: 'user-999',
        deviceId: 'device-999',
        eventType: 'Reservation.Confirmed'
      };

      await expect(useCase.execute(event)).resolves.toBeNull();
    });
  });

  describe('Multiple Reservations', () => {
    it('should activate correct loan by reservationId', async () => {
      const loan1 = createLoanRecord({
        id: 'loan-1',
        reservationId: 'res-1',
        status: LoanStatus.Pending
      });
      const loan2 = createLoanRecord({
        id: 'loan-2',
        reservationId: 'res-2',
        status: LoanStatus.Pending
      });
      await mockLoanRepo.create(loan1);
      await mockLoanRepo.create(loan2);

      const event: ReservationEventDTO = {
        reservationId: 'res-2',
        userId: loan2.userId,
        deviceId: loan2.deviceId,
        eventType: 'Reservation.Confirmed'
      };

      const result = await useCase.execute(event);

      expect(result!.id).toBe(loan2.id);
      expect(result!.status).toBe(LoanStatus.Active);

      // Verify loan1 is still pending
      const unchangedLoan = await mockLoanRepo.getById(loan1.id);
      expect(unchangedLoan!.status).toBe(LoanStatus.Pending);
    });
  });

  describe('Repository Interactions', () => {
    it('should call getByReservation before update', async () => {
      const loan = createLoanRecord({
        reservationId: 'res-test',
        status: LoanStatus.Pending
      });
      await mockLoanRepo.create(loan);

      const event: ReservationEventDTO = {
        reservationId: 'res-test',
        userId: loan.userId,
        deviceId: loan.deviceId,
        eventType: 'Reservation.Confirmed'
      };

      await useCase.execute(event);

      expect(mockLoanRepo.getCallCount('getByReservation')).toBe(1);
      expect(mockLoanRepo.getCallCount('update')).toBe(1);
    });
  });
});
