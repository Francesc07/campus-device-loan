// tests/mocks/MockEmailService.ts
import { EmailService } from "../../src/Infrastructure/Notifications/EmailService";

/**
 * Mock EmailService for testing
 * Prevents actual email sending during tests
 */
export class MockEmailService {
  public sentEmails: Array<{
    type: 'waitlist' | 'created';
    params: any;
  }> = [];

  async sendWaitlistProcessedEmail(params: {
    userEmail: string;
    userName: string;
    deviceBrand: string;
    deviceModel: string;
    deviceImageUrl?: string;
    loanId: string;
  }): Promise<void> {
    this.sentEmails.push({
      type: 'waitlist',
      params,
    });
  }

  async sendLoanCreatedEmail(params: {
    userEmail: string;
    userName: string;
    deviceBrand: string;
    deviceModel: string;
    isWaitlisted: boolean;
    loanId: string;
  }): Promise<void> {
    this.sentEmails.push({
      type: 'created',
      params,
    });
  }

  clear(): void {
    this.sentEmails = [];
  }

  getLastEmail() {
    return this.sentEmails[this.sentEmails.length - 1];
  }

  getEmailCount(): number {
    return this.sentEmails.length;
  }
}
