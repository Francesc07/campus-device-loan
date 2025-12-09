// tests/mocks/MockLoanEventPublisher.ts
import { ILoanEventPublisher } from "../../src/Application/Interfaces/ILoanEventPublisher";

export interface PublishedEvent {
  eventType: string;
  data: any;
  timestamp: Date;
}

export class MockLoanEventPublisher implements ILoanEventPublisher {
  private events: PublishedEvent[] = [];
  private callCounts: { [key: string]: number } = {};
  private shouldFail: boolean = false;

  async publish(eventType: string, data: any): Promise<void> {
    this.incrementCallCount('publish');
    
    if (this.shouldFail) {
      throw new Error('Event publishing failed');
    }

    this.events.push({
      eventType,
      data: JSON.parse(JSON.stringify(data)), // Deep clone
      timestamp: new Date()
    });
  }

  // Test utilities
  getPublishedEvents(): PublishedEvent[] {
    return [...this.events];
  }

  getEventsByType(eventType: string): PublishedEvent[] {
    return this.events.filter(e => e.eventType === eventType);
  }

  clear(): void {
    this.events = [];
    this.callCounts = {};
    this.shouldFail = false;
  }

  setShouldFail(shouldFail: boolean): void {
    this.shouldFail = shouldFail;
  }

  getCallCount(method: string): number {
    return this.callCounts[method] || 0;
  }

  private incrementCallCount(method: string): void {
    this.callCounts[method] = (this.callCounts[method] || 0) + 1;
  }
}
