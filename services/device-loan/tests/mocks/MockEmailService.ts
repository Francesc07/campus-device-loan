// tests/mocks/MockEmailService.ts
import { EmailService } from "../../src/Infrastructure/Notifications/EmailService";

/**
 * Mock EmailService for testing
 * Prevents actual email sending during tests
 */
export class MockEmailService {
  public sentEmails: Array<{
    type: 'waitlist' | 'created' | 'activated' | 'cancelled' | 'returned';
    params: any;
  }> = [];

  public sendWaitlistProcessedEmail = jest.fn().mockImplementation(async (params: {
    userEmail: string;
    userName: string;
    deviceBrand: string;
    deviceModel: string;
    deviceImageUrl?: string;
    loanId: string;
  }): Promise<void> => {
    this.sentEmails.push({
      type: 'waitlist',
      params,
    });
  });

  public sendLoanCreatedEmail = jest.fn().mockImplementation(async (params: {
    userEmail: string;
    userName: string;
    deviceBrand: string;
    deviceModel: string;
    isWaitlisted: boolean;
    loanId: string;
  }): Promise<void> => {
    this.sentEmails.push({
      type: 'created',
      params,
    });
  });

  public sendLoanActivatedEmail = jest.fn().mockImplementation(async (params: {
    userEmail: string;
    userName: string;
    deviceBrand: string;
    deviceModel: string;
    dueDate: string;
    loanId: string;
  }): Promise<void> => {
    this.sentEmails.push({
      type: 'activated',
      params,
    });
  });

  public sendLoanCancelledEmail = jest.fn().mockImplementation(async (params: {
    userEmail: string;
    userName: string;
    deviceBrand: string;
    deviceModel: string;
    loanId: string;
  }): Promise<void> => {
    this.sentEmails.push({
      type: 'cancelled',
      params,
    });
  });

  public sendLoanReturnedEmail = jest.fn().mockImplementation(async (params: {
    userEmail: string;
    userName: string;
    deviceBrand: string;
    deviceModel: string;
    returnDate: string;
    wasLate: boolean;
    loanId: string;
  }): Promise<void> => {
    this.sentEmails.push({
      type: 'returned',
      params,
    });
  });

  clear(): void {
    this.sentEmails = [];
    this.sendWaitlistProcessedEmail.mockClear();
    this.sendLoanCreatedEmail.mockClear();
    this.sendLoanActivatedEmail.mockClear();
    this.sendLoanCancelledEmail.mockClear();
    this.sendLoanReturnedEmail.mockClear();
  }

  getLastEmail() {
    return this.sentEmails[this.sentEmails.length - 1];
  }

  getEmailCount(): number {
    return this.sentEmails.length;
  }
}
