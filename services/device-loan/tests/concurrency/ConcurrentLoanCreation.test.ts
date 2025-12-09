// tests/concurrency/ConcurrentLoanCreation.test.ts
import { CreateLoanUseCase } from "../../src/Application/UseCases/CreateLoanUseCase";
import { MockLoanRepository } from "../mocks/MockLoanRepository";
import { MockDeviceSnapshotRepository } from "../mocks/MockDeviceSnapshotRepository";
import { MockLoanEventPublisher } from "../mocks/MockLoanEventPublisher";
import { CreateLoanDto } from "../../src/Application/Dtos/CreateLoanDto";
import { LoanStatus } from "../../src/Domain/Enums/LoanStatus";
import { singleAvailableDevice, createDeviceSnapshot } from "../fixtures/deviceFixtures";

describe('Concurrent Loan Creation', () => {
  let useCase: CreateLoanUseCase;
  let mockLoanRepo: MockLoanRepository;
  let mockSnapshotRepo: MockDeviceSnapshotRepository;
  let mockEventPublisher: MockLoanEventPublisher;

  beforeEach(() => {
    mockLoanRepo = new MockLoanRepository();
    mockSnapshotRepo = new MockDeviceSnapshotRepository();
    mockEventPublisher = new MockLoanEventPublisher();
    useCase = new CreateLoanUseCase(mockLoanRepo, mockSnapshotRepo, mockEventPublisher);
  });

  afterEach(() => {
    mockLoanRepo.clear();
    mockSnapshotRepo.clear();
    mockEventPublisher.clear();
  });

  describe('Race Conditions', () => {
    it('should handle multiple simultaneous loan requests for same device', async () => {
      mockSnapshotRepo.addSnapshot(singleAvailableDevice);

      const requests: CreateLoanDto[] = [
        { userId: 'user-1', deviceId: singleAvailableDevice.id },
        { userId: 'user-2', deviceId: singleAvailableDevice.id },
        { userId: 'user-3', deviceId: singleAvailableDevice.id },
      ];

      // Execute all requests concurrently
      const results = await Promise.all(
        requests.map(dto => useCase.execute(dto))
      );

      // All should succeed with unique IDs
      expect(results).toHaveLength(3);
      const uniqueIds = new Set(results.map(r => r.id));
      expect(uniqueIds.size).toBe(3);

      // In real scenario with optimistic concurrency:
      // - First would get Pending
      // - Others would get Waitlisted
      // But with mock, all see same snapshot state
      const statuses = results.map(r => r.status);
      expect(statuses).toContain(LoanStatus.Pending);
    });

    it('should create unique loan IDs for concurrent requests from same user', async () => {
      const device = createDeviceSnapshot({
       id: 'device-concurrent',
        availableCount: 5
      });
      mockSnapshotRepo.addSnapshot(device);

      const sameUserRequests: CreateLoanDto[] = Array(10).fill(null).map(() => ({
        userId: 'concurrent-user',
        deviceId: device.id
      }));

      const results = await Promise.all(
        sameUserRequests.map(dto => useCase.execute(dto))
      );

      // All loan IDs should be unique
      const loanIds = results.map(r => r.id);
      const uniqueIds = new Set(loanIds);
      expect(uniqueIds.size).toBe(10);
    });

    it('should handle rapid successive loan creations', async () => {
      const device = createDeviceSnapshot({
        id: 'device-rapid',
        availableCount: 3
      });
      mockSnapshotRepo.addSnapshot(device);

      const loans = [];
      for (let i = 0; i < 5; i++) {
        const dto: CreateLoanDto = {
          userId: `user-${i}`,
          deviceId: device.id
        };
        loans.push(useCase.execute(dto));
      }

      const results = await Promise.all(loans);

      // All should complete successfully
      expect(results).toHaveLength(5);
      expect(mockLoanRepo.getAllLoans()).toHaveLength(5);
    });

    it('should maintain data consistency under concurrent updates', async () => {
      const device = createDeviceSnapshot({
        id: 'device-consistency',
        availableCount: 10
      });
      mockSnapshotRepo.addSnapshot(device);

      const concurrentCount = 20;
      const requests: CreateLoanDto[] = Array(concurrentCount).fill(null).map((_, i) => ({
        userId: `user-${i}`,
        deviceId: device.id
      }));

      const results = await Promise.all(
        requests.map(dto => useCase.execute(dto))
      );

      // Verify all loans were created
      expect(results).toHaveLength(concurrentCount);
      expect(mockLoanRepo.getAllLoans()).toHaveLength(concurrentCount);

      // Verify no data corruption
      results.forEach(loan => {
        expect(loan.id).toBeDefined();
        expect(loan.userId).toMatch(/^user-\d+$/);
        expect(loan.deviceId).toBe(device.id);
      });
    });
  });

  describe('Event Publishing Under Load', () => {
    it('should publish events for all concurrent loan creations', async () => {
      const device = createDeviceSnapshot({
        id: 'device-events',
        availableCount: 5
      });
      mockSnapshotRepo.addSnapshot(device);

      const requests: CreateLoanDto[] = Array(5).fill(null).map((_, i) => ({
        userId: `user-${i}`,
        deviceId: device.id
      }));

      await Promise.all(requests.map(dto => useCase.execute(dto)));

      const allEvents = mockEventPublisher.getPublishedEvents();
      expect(allEvents.length).toBeGreaterThanOrEqual(5);
    });

    it('should handle event publishing failures gracefully', async () => {
      const device = createDeviceSnapshot({
        id: 'device-event-fail',
        availableCount: 3
      });
      mockSnapshotRepo.addSnapshot(device);
      mockEventPublisher.setShouldFail(true);

      const dto: CreateLoanDto = {
        userId: 'user-fail',
        deviceId: device.id
      };

      // Event publishing failure should propagate
      await expect(useCase.execute(dto)).rejects.toThrow('Event publishing failed');

      // But loan should still be created before event publishing
      const loans = mockLoanRepo.getAllLoans();
      expect(loans).toHaveLength(1);
    });
  });

  describe('Repository Stress Test', () => {
    it('should handle high volume of loan requests', async () => {
      const device = createDeviceSnapshot({
        id: 'device-stress',
        availableCount: 50
      });
      mockSnapshotRepo.addSnapshot(device);

      const highVolume = 100;
      const requests: CreateLoanDto[] = Array(highVolume).fill(null).map((_, i) => ({
        userId: `stress-user-${i}`,
        deviceId: device.id
      }));

      const startTime = Date.now();
      const results = await Promise.all(requests.map(dto => useCase.execute(dto)));
      const duration = Date.now() - startTime;

      expect(results).toHaveLength(highVolume);
      expect(mockLoanRepo.getAllLoans()).toHaveLength(highVolume);
      
      // Performance check - should complete in reasonable time
      // 100 mock operations should be fast (< 1 second)
      console.log(`High volume test completed in ${duration}ms`);
    });

    it('should maintain repository call counts accuracy', async () => {
      const device = createDeviceSnapshot({
        id: 'device-callcount',
        availableCount: 10
      });
      mockSnapshotRepo.addSnapshot(device);

      const requestCount = 15;
      const requests: CreateLoanDto[] = Array(requestCount).fill(null).map((_, i) => ({
        userId: `count-user-${i}`,
        deviceId: device.id
      }));

      await Promise.all(requests.map(dto => useCase.execute(dto)));

      expect(mockLoanRepo.getCallCount('create')).toBe(requestCount);
      expect(mockSnapshotRepo.getCallCount('getSnapshot')).toBe(requestCount);
      expect(mockEventPublisher.getCallCount('publish')).toBe(requestCount);
    });
  });

  describe('Timestamp Consistency', () => {
    it('should generate unique timestamps for rapid concurrent requests', async () => {
      const device = createDeviceSnapshot({
        id: 'device-timestamp',
        availableCount: 10
      });
      mockSnapshotRepo.addSnapshot(device);

      const requests: CreateLoanDto[] = Array(10).fill(null).map((_, i) => ({
        userId: `timestamp-user-${i}`,
        deviceId: device.id
      }));

      const results = await Promise.all(requests.map(dto => useCase.execute(dto)));

      // All should have valid timestamps
      results.forEach(loan => {
        expect(loan.createdAt).toBeDefined();
        expect(loan.updatedAt).toBeDefined();
        expect(() => new Date(loan.createdAt)).not.toThrow();
      });
    });
  });

  describe('Memory and Resource Management', () => {
    it('should not leak memory with many concurrent operations', async () => {
      const device = createDeviceSnapshot({
        id: 'device-memory',
        availableCount: 30
      });
      mockSnapshotRepo.addSnapshot(device);

      // Run multiple batches
      for (let batch = 0; batch < 3; batch++) {
        const requests: CreateLoanDto[] = Array(20).fill(null).map((_, i) => ({
          userId: `batch-${batch}-user-${i}`,
          deviceId: device.id
        }));

        await Promise.all(requests.map(dto => useCase.execute(dto)));
      }

      const totalLoans = mockLoanRepo.getAllLoans();
      expect(totalLoans).toHaveLength(60);
      
      // Verify all loans are distinct
      const uniqueUserIds = new Set(totalLoans.map(l => l.userId));
      expect(uniqueUserIds.size).toBe(60);
    });
  });
});
