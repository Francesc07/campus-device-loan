// tests/fixtures/loanFixtures.ts
import { LoanRecord } from "../../src/Domain/Entities/LoanRecord";
import { LoanStatus } from "../../src/Domain/Enums/LoanStatus";

// Simple UUID generator for tests
const generateTestId = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const createLoanRecord = (overrides: Partial<LoanRecord> = {}): LoanRecord => {
  const now = new Date();
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 2);

  return {
    id: generateTestId(),
    userId: "user-123",
    deviceId: "device-123",
    startDate: now.toISOString(),
    dueDate: dueDate.toISOString(),
    status: LoanStatus.Pending,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    ...overrides
  };
};

export const pendingLoan: LoanRecord = createLoanRecord({
  id: "loan-pending",
  status: LoanStatus.Pending
});

export const activeLoan: LoanRecord = createLoanRecord({
  id: "loan-active",
  status: LoanStatus.Active
});

export const waitlistedLoan: LoanRecord = createLoanRecord({
  id: "loan-waitlisted",
  status: LoanStatus.Waitlisted
});

export const cancelledLoan: LoanRecord = createLoanRecord({
  id: "loan-cancelled",
  status: LoanStatus.Cancelled,
  cancelledAt: new Date().toISOString()
});

export const returnedLoan: LoanRecord = createLoanRecord({
  id: "loan-returned",
  status: LoanStatus.Returned,
  returnedAt: new Date().toISOString()
});
