// tests/mocks/MockUserService.ts
import { IUserService } from "../../src/Application/Interfaces/IUserService";

export class MockUserService implements IUserService {
  private users: Map<string, string> = new Map();
  private callCounts: { [key: string]: number } = {};

  async getUserEmail(userId: string, accessToken?: string): Promise<string | null> {
    this.incrementCallCount('getUserEmail');
    return this.users.get(userId) || null;
  }

  // Test utilities
  setUserEmail(userId: string, email: string): void {
    this.users.set(userId, email);
  }

  clear(): void {
    this.users.clear();
    this.callCounts = {};
  }

  getCallCount(method: string): number {
    return this.callCounts[method] || 0;
  }

  private incrementCallCount(method: string): void {
    this.callCounts[method] = (this.callCounts[method] || 0) + 1;
  }
}
