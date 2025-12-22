// tests/unit/useCases/CancelLoanUseCase.test.ts
import { CancelLoanUseCase } from "../../../src/Application/UseCases/CancelLoanUseCase";
import { MockLoanRepository } from "../../mocks/MockLoanRepository";
import { MockLoanEventPublisher } from "../../mocks/MockLoanEventPublisher";
import { CancelLoanDto } from "../../../src/Application/Dtos/CancelLoanDto";
import { LoanStatus } from "../../../src/Domain/Enums/LoanStatus";
import { createLoanRecord, pendingLoan, activeLoan } from "../../fixtures/loanFixtures";

describe('CancelLoanUseCase', () => {
  let useCase: CancelLoanUseCase;
  let mockLoanRepo: MockLoanRepository;
  let mockEventPublisher: MockLoanEventPublisher;

  beforeEach(() => {
    mockLoanRepo = new MockLoanRepository();
    mockEventPublisher = new MockLoanEventPublisher();
    useCase = new CancelLoanUseCase(mockLoanRepo, mockEventPublisher);
  });

  afterEach(() => {
    mockLoanRepo.clear();
  });

  describe('Successful Cancellation', () => {
    it('should cancel a pending loan', async () => {
      const loan = createLoanRecord({
        id: 'loan-123',
        userId: 'user-456',
        status: LoanStatus.Pending
      });
      await mockLoanRepo.create(loan);

      const dto: CancelLoanDto = {
        loanId: loan.id,
        userId: loan.userId
      };

      const result = await useCase.execute(dto);

      expect(result.status).toBe(LoanStatus.Cancelled);
      expect(result.cancelledAt).toBeDefined();
      expect(result.updatedAt).not.toBe(loan.updatedAt);
    });

    it('should cancel an active loan', async () => {
      const loan = createLoanRecord({
        id: 'loan-789',
        userId: 'user-123',
        status: LoanStatus.Active
      });
      await mockLoanRepo.create(loan);

      const dto: CancelLoanDto = {
        loanId: loan.id,
        userId: loan.userId
      };

      const result = await useCase.execute(dto);

      expect(result.status).toBe(LoanStatus.Cancelled);
    });

    it('should set cancelledAt timestamp', async () => {
      const loan = createLoanRecord({ userId: 'user-123' });
      await mockLoanRepo.create(loan);

      const beforeCancel = new Date();
      const dto: CancelLoanDto = {
        loanId: loan.id,
        userId: loan.userId
      };

      const result = await useCase.execute(dto);
      const cancelledAt = new Date(result.cancelledAt!);

      expect(cancelledAt.getTime()).toBeGreaterThanOrEqual(beforeCancel.getTime());
    });

    it('should update the loan in repository', async () => {
      const loan = createLoanRecord({ userId: 'user-123' });
      await mockLoanRepo.create(loan);

      const dto: CancelLoanDto = {
        loanId: loan.id,
        userId: loan.userId
      };

      await useCase.execute(dto);

      const updatedLoan = await mockLoanRepo.getById(loan.id);
      expect(updatedLoan!.status).toBe(LoanStatus.Cancelled);
      expect(mockLoanRepo.getCallCount('update')).toBe(1);
    });
  });

  describe('Authorization', () => {
    it('should throw error when user does not own the loan', async () => {
      const loan = createLoanRecord({ userId: 'user-123' });
      await mockLoanRepo.create(loan);

      const dto: CancelLoanDto = {
        loanId: loan.id,
        userId: 'different-user'
      };

      await expect(useCase.execute(dto)).rejects.toThrow('Unauthorized');
      expect(mockLoanRepo.getCallCount('update')).toBe(0);
    });

    it('should allow cancellation only by loan owner', async () => {
      const loan = createLoanRecord({ userId: 'correct-user' });
      await mockLoanRepo.create(loan);

      const dto: CancelLoanDto = {
        loanId: loan.id,
        userId: 'correct-user'
      };

      const result = await useCase.execute(dto);
      expect(result.status).toBe(LoanStatus.Cancelled);
    });
  });

  describe('Error Handling', () => {
    it('should throw error when loan does not exist', async () => {
      const dto: CancelLoanDto = {
        loanId: 'non-existent-loan',
        userId: 'user-123'
      };

      await expect(useCase.execute(dto)).rejects.toThrow('Loan not found');
    });

    it('should not update repository when loan not found', async () => {
      const dto: CancelLoanDto = {
        loanId: 'non-existent-loan',
        userId: 'user-123'
      };

      await expect(useCase.execute(dto)).rejects.toThrow();
      expect(mockLoanRepo.getCallCount('update')).toBe(0);
    });
  });

  describe('Idempotency', () => {
    it('should handle cancelling an already cancelled loan', async () => {
      const originalCancelledAt = new Date(Date.now() - 1000).toISOString();
      const loan = createLoanRecord({
        userId: 'user-123',
        status: LoanStatus.Cancelled,
        cancelledAt: originalCancelledAt
      });
      await mockLoanRepo.create(loan);

      const dto: CancelLoanDto = {
        loanId: loan.id,
        userId: loan.userId
      };

      const result = await useCase.execute(dto);

      // Should update cancelledAt to new timestamp
      expect(result.status).toBe(LoanStatus.Cancelled);
      expect(result.cancelledAt).not.toBe(originalCancelledAt);
    });
  });
});
