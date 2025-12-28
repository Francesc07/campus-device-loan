// tests/mocks/MockUserService.ts
import { IUserService } from "../../src/Application/Interfaces/IUserService";

export class MockUserService implements IUserService {
  private users: Map<string, string> = new Map();
  private callCounts: { [key: string]: number } = {};
  private mockEmail: string | null = null;

  public getUserEmail = jest.fn().mockImplementation(async (userId: string, accessToken?: string): Promise<string | null> => {
    this.incrementCallCount('getUserEmail');
    if (this.mockEmail !== null) {
      return this.mockEmail;
    }
    return this.users.get(userId) || null;
  });

  // Test utilities
  setUserEmail(email: string | null): void {
    this.mockEmail = email;
  }

  addUser(userId: string, email: string): void {
    this.users.set(userId, email);
  }

  clear(): void {
    this.users.clear();
    this.callCounts = {};
    this.mockEmail = null;
    this.getUserEmail.mockClear();
  }

  getCallCount(method: string): number {
    return this.callCounts[method] || 0;
  }

  private incrementCallCount(method: string): void {
    this.callCounts[method] = (this.callCounts[method] || 0) + 1;
  }
}
