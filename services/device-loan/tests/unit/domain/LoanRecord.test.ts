// tests/unit/domain/LoanRecord.test.ts
import { LoanRecord } from "../../../src/Domain/Entities/LoanRecord";
import { LoanStatus } from "../../../src/Domain/Enums/LoanStatus";
import { createLoanRecord } from "../../fixtures/loanFixtures";

describe('LoanRecord Domain Entity', () => {
  describe('Loan Record Structure', () => {
    it('should create a valid loan record with all required fields', () => {
      const loan = createLoanRecord();

      expect(loan).toHaveProperty('id');
      expect(loan).toHaveProperty('userId');
      expect(loan).toHaveProperty('deviceId');
      expect(loan).toHaveProperty('startDate');
      expect(loan).toHaveProperty('dueDate');
      expect(loan).toHaveProperty('status');
      expect(loan).toHaveProperty('createdAt');
      expect(loan).toHaveProperty('updatedAt');
    });

    it('should have valid UUID format for id', () => {
      const loan = createLoanRecord();
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      
      expect(loan.id).toMatch(uuidRegex);
    });

    it('should have valid ISO date strings', () => {
      const loan = createLoanRecord();

      expect(() => new Date(loan.startDate)).not.toThrow();
      expect(() => new Date(loan.dueDate)).not.toThrow();
      expect(() => new Date(loan.createdAt)).not.toThrow();
      expect(() => new Date(loan.updatedAt)).not.toThrow();
    });

    it('should have dueDate after startDate', () => {
      const loan = createLoanRecord();
      const startDate = new Date(loan.startDate);
      const dueDate = new Date(loan.dueDate);

      expect(dueDate.getTime()).toBeGreaterThan(startDate.getTime());
    });
  });

  describe('Loan Status Transitions', () => {
    it('should support all valid loan statuses', () => {
      const statuses = [
        LoanStatus.Pending,
        LoanStatus.Active,
        LoanStatus.Cancelled,
        LoanStatus.Returned,
        LoanStatus.Overdue,
        LoanStatus.Waitlisted
      ];

      statuses.forEach(status => {
        const loan = createLoanRecord({ status });
        expect(loan.status).toBe(status);
      });
    });

    it('should track cancellation timestamp when cancelled', () => {
      const cancelledAt = new Date().toISOString();
      const loan = createLoanRecord({
        status: LoanStatus.Cancelled,
        cancelledAt
      });

      expect(loan.cancelledAt).toBe(cancelledAt);
      expect(loan.status).toBe(LoanStatus.Cancelled);
    });

    it('should track return timestamp when returned', () => {
      const returnedAt = new Date().toISOString();
      const loan = createLoanRecord({
        status: LoanStatus.Returned,
        returnedAt
      });

      expect(loan.returnedAt).toBe(returnedAt);
      expect(loan.status).toBe(LoanStatus.Returned);
    });
  });

  describe('Optional Fields', () => {
    it('should allow reservationId to be optional', () => {
      const loanWithoutReservation = createLoanRecord();
      const loanWithReservation = createLoanRecord({ reservationId: 'res-123' });

      expect(loanWithoutReservation.reservationId).toBeUndefined();
      expect(loanWithReservation.reservationId).toBe('res-123');
    });

    it('should allow notes to be optional', () => {
      const loanWithoutNotes = createLoanRecord();
      const loanWithNotes = createLoanRecord({ notes: 'Special handling required' });

      expect(loanWithoutNotes.notes).toBeUndefined();
      expect(loanWithNotes.notes).toBe('Special handling required');
    });
  });

  describe('Loan Lifecycle', () => {
    it('should preserve all data through updates', async () => {
      const original = createLoanRecord({
        id: 'loan-123',
        userId: 'user-456',
        deviceId: 'device-789',
        status: LoanStatus.Pending
      });

      // Wait a moment to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 5));

      const updated: LoanRecord = {
        ...original,
        status: LoanStatus.Active,
        updatedAt: new Date().toISOString()
      };

      expect(updated.id).toBe(original.id);
      expect(updated.userId).toBe(original.userId);
      expect(updated.deviceId).toBe(original.deviceId);
      expect(updated.status).toBe(LoanStatus.Active);
      expect(updated.updatedAt).not.toBe(original.updatedAt);
    });
  });
});
