// tests/concurrency/DatabaseConcurrency.test.ts
import { MockLoanRepository } from "../mocks/MockLoanRepository";
import { MockDeviceSnapshotRepository } from "../mocks/MockDeviceSnapshotRepository";
import { createLoanRecord } from "../fixtures/loanFixtures";
import { createDeviceSnapshot } from "../fixtures/deviceFixtures";
import { LoanStatus } from "../../src/Domain/Enums/LoanStatus";

describe('Database Concurrency and Idempotency', () => {
  describe('MockLoanRepository Concurrency', () => {
    let repository: MockLoanRepository;

    beforeEach(() => {
      repository = new MockLoanRepository();
    });

    afterEach(() => {
      repository.clear();
    });

    it('should handle concurrent writes to different loans', async () => {
      const loans = Array.from({ length: 10 }, (_, i) => 
        createLoanRecord({ id: `loan-${i}`, userId: `user-${i}` })
      );

      // Create all loans concurrently
      await Promise.all(loans.map(loan => repository.create(loan)));

      // Verify all were created
      const allLoans = repository.getAllLoans();
      expect(allLoans).toHaveLength(10);
    });

    it('should prevent duplicate loan creation with same ID', async () => {
      const loan = createLoanRecord({ id: 'duplicate-test' });

      // Attempt to create same loan multiple times concurrently
      const results = await Promise.allSettled([
        repository.create(loan),
        repository.create(loan),
        repository.create(loan)
      ]);

      // Only one should succeed
      const successful = results.filter(r => r.status === 'fulfilled');
      const failed = results.filter(r => r.status === 'rejected');

      expect(successful).toHaveLength(1);
      expect(failed).toHaveLength(2);
      expect(repository.getAllLoans()).toHaveLength(1);
    });

    it('should handle concurrent updates to same loan', async () => {
      const loan = createLoanRecord({ 
        id: 'concurrent-update',
        status: LoanStatus.Pending 
      });
      await repository.create(loan);

      // Concurrent updates with different statuses
      const updates = [
        { ...loan, status: LoanStatus.Active },
        { ...loan, status: LoanStatus.Cancelled },
        { ...loan, status: LoanStatus.Returned }
      ];

      await Promise.all(updates.map(update => repository.update(update)));

      // Last write wins (due to concurrency)
      const final = await repository.getById(loan.id);
      expect(final).not.toBeNull();
      expect([LoanStatus.Active, LoanStatus.Cancelled, LoanStatus.Returned])
        .toContain(final!.status);
    });

    it('should maintain consistency during high concurrency', async () => {
      const loanId = 'high-concurrency-loan';
      const loan = createLoanRecord({ 
        id: loanId,
        status: LoanStatus.Pending 
      });
      await repository.create(loan);

      // 50 concurrent reads
      const reads = Array(50).fill(null).map(() => 
        repository.getById(loanId)
      );

      const results = await Promise.all(reads);

      // All reads should return the same loan
      results.forEach(result => {
        expect(result).not.toBeNull();
        expect(result!.id).toBe(loanId);
      });
    });

    it('should handle mixed concurrent operations', async () => {
      const loans = Array.from({ length: 5 }, (_, i) => 
        createLoanRecord({ id: `mixed-${i}`, userId: 'test-user' })
      );

      // Create loans
      await Promise.all(loans.map(loan => repository.create(loan)));

      // Mix of operations
      const operations = [
        ...loans.slice(0, 2).map(loan => 
          repository.update({ ...loan, status: LoanStatus.Active })
        ),
        repository.listByUser('test-user'),
        repository.getById(loans[0].id),
        repository.getById(loans[1].id),
        ...loans.slice(2, 4).map(loan => 
          repository.update({ ...loan, status: LoanStatus.Cancelled })
        ),
      ];

      await Promise.all(operations);

      // Verify final state
      const allLoans = repository.getAllLoans();
      expect(allLoans).toHaveLength(5);
    });

    it('should enforce atomicity of create operation', async () => {
      const loan = createLoanRecord({ id: 'atomic-test' });

      // Start multiple creates simultaneously
      const createPromises = Array(5).fill(null).map(() => 
        repository.create(loan).catch(e => e)
      );

      const results = await Promise.all(createPromises);

      // Count successes vs errors
      const successes = results.filter(r => !(r instanceof Error));
      const errors = results.filter(r => r instanceof Error);

      expect(successes).toHaveLength(1);
      expect(errors).toHaveLength(4);
    });

    it('should handle rapid sequential updates correctly', async () => {
      const loan = createLoanRecord({ id: 'sequential-test' });
      await repository.create(loan);

      // Rapid sequential updates
      for (let i = 0; i < 10; i++) {
        await repository.update({ 
          ...loan, 
          status: LoanStatus.Active,
          updatedAt: new Date(Date.now() + i).toISOString()
        });
      }

      const final = await repository.getById(loan.id);
      expect(final).not.toBeNull();
      expect(final!.status).toBe(LoanStatus.Active);
    });
  });

  describe('MockDeviceSnapshotRepository Concurrency', () => {
    let repository: MockDeviceSnapshotRepository;

    beforeEach(() => {
      repository = new MockDeviceSnapshotRepository();
    });

    afterEach(() => {
      repository.clear();
    });

    it('should handle concurrent snapshot updates', async () => {
      const deviceId = 'device-concurrent';
      const snapshot = createDeviceSnapshot({ 
        id: deviceId,
        availableCount: 10 
      });

      repository.addSnapshot(snapshot);

      // Concurrent updates decreasing availability
      const updates = Array.from({ length: 5 }, (_, i) => ({
        ...snapshot,
        availableCount: 10 - i - 1
      }));

      await Promise.all(updates.map(s => repository.saveSnapshot(s)));

      const final = await repository.getSnapshot(deviceId);
      expect(final).not.toBeNull();
      expect(final!.availableCount).toBeGreaterThanOrEqual(5);
      expect(final!.availableCount).toBeLessThan(10);
    });

    it('should handle upsert idempotency', async () => {
      const snapshot = createDeviceSnapshot({ id: 'upsert-test' });

      // Multiple saves of same snapshot
      await Promise.all([
        repository.saveSnapshot(snapshot),
        repository.saveSnapshot(snapshot),
        repository.saveSnapshot(snapshot)
      ]);

      const devices = await repository.listDevices();
      expect(devices).toHaveLength(1);
      expect(devices[0].id).toBe('upsert-test');
    });

    it('should maintain consistency with concurrent reads and writes', async () => {
      const deviceId = 'rw-consistency';
      const snapshot = createDeviceSnapshot({ 
        id: deviceId,
        availableCount: 5 
      });

      repository.addSnapshot(snapshot);

      // Mix reads and writes
      const operations = [
        repository.getSnapshot(deviceId),
        repository.saveSnapshot({ ...snapshot, availableCount: 4 }),
        repository.getSnapshot(deviceId),
        repository.saveSnapshot({ ...snapshot, availableCount: 3 }),
        repository.getSnapshot(deviceId),
      ];

      const results = await Promise.all(operations);

      // All reads should return valid snapshots
      const reads = results.filter(r => r !== undefined);
      reads.forEach(snapshot => {
        if (snapshot) {
          expect(snapshot.id).toBe(deviceId);
          expect(snapshot.availableCount).toBeDefined();
        }
      });
    });

    it('should handle concurrent deletes gracefully', async () => {
      const deviceId = 'delete-test';
      const snapshot = createDeviceSnapshot({ id: deviceId });
      repository.addSnapshot(snapshot);

      // Multiple concurrent deletes
      await Promise.allSettled([
        repository.deleteSnapshot(deviceId),
        repository.deleteSnapshot(deviceId),
        repository.deleteSnapshot(deviceId)
      ]);

      const result = await repository.getSnapshot(deviceId);
      expect(result).toBeNull();
    });
  });

  describe('Cross-Repository Consistency', () => {
    let loanRepo: MockLoanRepository;
    let deviceRepo: MockDeviceSnapshotRepository;

    beforeEach(() => {
      loanRepo = new MockLoanRepository();
      deviceRepo = new MockDeviceSnapshotRepository();
    });

    afterEach(() => {
      loanRepo.clear();
      deviceRepo.clear();
    });

    it('should maintain consistency across repositories during concurrent operations', async () => {
      const device = createDeviceSnapshot({ 
        id: 'device-multi',
        availableCount: 3 
      });
      deviceRepo.addSnapshot(device);

      const loans = Array.from({ length: 5 }, (_, i) => 
        createLoanRecord({ 
          id: `loan-${i}`,
          deviceId: device.id,
          userId: `user-${i}`
        })
      );

      // Concurrent operations across both repositories
      const operations = [
        ...loans.map(loan => loanRepo.create(loan)),
        deviceRepo.getSnapshot(device.id),
        deviceRepo.saveSnapshot({ ...device, availableCount: 2 }),
        loanRepo.listByUser('user-0'),
        deviceRepo.getSnapshot(device.id),
      ];

      await Promise.all(operations);

      // Verify state
      const allLoans = loanRepo.getAllLoans();
      const finalDevice = await deviceRepo.getSnapshot(device.id);

      expect(allLoans).toHaveLength(5);
      expect(finalDevice).not.toBeNull();
      expect(finalDevice!.availableCount).toBe(2);
    });
  });
});
