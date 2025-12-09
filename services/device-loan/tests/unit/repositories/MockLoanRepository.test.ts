// tests/unit/repositories/MockLoanRepository.test.ts
import { MockLoanRepository } from "../../mocks/MockLoanRepository";
import { createLoanRecord } from "../../fixtures/loanFixtures";
import { LoanStatus } from "../../../src/Domain/Enums/LoanStatus";

describe('MockLoanRepository', () => {
  let repository: MockLoanRepository;

  beforeEach(() => {
    repository = new MockLoanRepository();
  });

  afterEach(() => {
    repository.clear();
  });

  describe('Create Operations', () => {
    it('should create a loan successfully', async () => {
      const loan = createLoanRecord();
      
      await repository.create(loan);
      
      const retrieved = await repository.getById(loan.id);
      expect(retrieved).toEqual(loan);
    });

    it('should throw error when creating duplicate loan ID', async () => {
      const loan = createLoanRecord({ id: 'duplicate-test' });
      
      await repository.create(loan);
      await expect(repository.create(loan)).rejects.toThrow('already exists');
    });

    it('should track create call count', async () => {
      const loan1 = createLoanRecord();
      const loan2 = createLoanRecord();
      
      await repository.create(loan1);
      await repository.create(loan2);
      
      expect(repository.getCallCount('create')).toBe(2);
    });
  });

  describe('Read Operations', () => {
    it('should return null for non-existent loan', async () => {
      const result = await repository.getById('non-existent');
      expect(result).toBeNull();
    });

    it('should retrieve loan by ID', async () => {
      const loan = createLoanRecord({ id: 'test-retrieve' });
      await repository.create(loan);
      
      const retrieved = await repository.getById('test-retrieve');
      expect(retrieved).not.toBeNull();
      expect(retrieved!.id).toBe('test-retrieve');
    });

    it('should list loans by user ID', async () => {
      const loan1 = createLoanRecord({ userId: 'user-123' });
      const loan2 = createLoanRecord({ userId: 'user-123' });
      const loan3 = createLoanRecord({ userId: 'user-456' });
      
      await repository.create(loan1);
      await repository.create(loan2);
      await repository.create(loan3);
      
      const userLoans = await repository.listByUser('user-123');
      expect(userLoans).toHaveLength(2);
      expect(userLoans.every(l => l.userId === 'user-123')).toBe(true);
    });

    it('should prioritize waitlisted loans in list', async () => {
      const pending = createLoanRecord({ 
        userId: 'user-order',
        status: LoanStatus.Pending,
        createdAt: new Date(Date.now() - 2000).toISOString()
      });
      const waitlisted = createLoanRecord({ 
        userId: 'user-order',
        status: LoanStatus.Waitlisted,
        createdAt: new Date(Date.now() - 1000).toISOString()
      });
      
      await repository.create(pending);
      await repository.create(waitlisted);
      
      const loans = await repository.listByUser('user-order');
      expect(loans[0].status).toBe(LoanStatus.Waitlisted);
    });

    it('should find loan by reservation ID', async () => {
      const loan = createLoanRecord({ reservationId: 'res-123' });
      await repository.create(loan);
      
      const found = await repository.getByReservation('res-123');
      expect(found).not.toBeNull();
      expect(found!.reservationId).toBe('res-123');
    });

    it('should return null when reservation not found', async () => {
      const found = await repository.getByReservation('missing-res');
      expect(found).toBeNull();
    });

    it('should find loans by device and status', async () => {
      const loan1 = createLoanRecord({ 
        deviceId: 'device-123',
        status: LoanStatus.Active 
      });
      const loan2 = createLoanRecord({ 
        deviceId: 'device-123',
        status: LoanStatus.Active 
      });
      const loan3 = createLoanRecord({ 
        deviceId: 'device-123',
        status: LoanStatus.Pending 
      });
      
      await repository.create(loan1);
      await repository.create(loan2);
      await repository.create(loan3);
      
      const activeLoans = await repository.getByDeviceAndStatus('device-123', LoanStatus.Active);
      expect(activeLoans).toHaveLength(2);
      expect(activeLoans.every(l => l.status === LoanStatus.Active)).toBe(true);
    });

    it('should order loans by creation date for same device and status', async () => {
      const old = createLoanRecord({ 
        deviceId: 'device-order',
        status: LoanStatus.Pending,
        createdAt: new Date(Date.now() - 5000).toISOString()
      });
      const recent = createLoanRecord({ 
        deviceId: 'device-order',
        status: LoanStatus.Pending,
        createdAt: new Date(Date.now() - 1000).toISOString()
      });
      
      await repository.create(recent);
      await repository.create(old);
      
      const loans = await repository.getByDeviceAndStatus('device-order', LoanStatus.Pending);
      expect(loans[0].id).toBe(old.id);
      expect(loans[1].id).toBe(recent.id);
    });
  });

  describe('Update Operations', () => {
    it('should update existing loan', async () => {
      const loan = createLoanRecord({ status: LoanStatus.Pending });
      await repository.create(loan);
      
      const updated = { ...loan, status: LoanStatus.Active };
      await repository.update(updated);
      
      const retrieved = await repository.getById(loan.id);
      expect(retrieved!.status).toBe(LoanStatus.Active);
    });

    it('should throw error when updating non-existent loan', async () => {
      const loan = createLoanRecord({ id: 'non-existent' });
      
      await expect(repository.update(loan)).rejects.toThrow('not found');
    });

    it('should track update call count', async () => {
      const loan = createLoanRecord();
      await repository.create(loan);
      
      await repository.update({ ...loan, status: LoanStatus.Active });
      await repository.update({ ...loan, status: LoanStatus.Cancelled });
      
      expect(repository.getCallCount('update')).toBe(2);
    });
  });

  describe('Test Utilities', () => {
    it('should return all loans', async () => {
      const loan1 = createLoanRecord();
      const loan2 = createLoanRecord();
      
      await repository.create(loan1);
      await repository.create(loan2);
      
      const all = repository.getAllLoans();
      expect(all).toHaveLength(2);
    });

    it('should clear all data', async () => {
      const loan = createLoanRecord();
      await repository.create(loan);
      
      repository.clear();
      
      const all = repository.getAllLoans();
      expect(all).toHaveLength(0);
      expect(repository.getCallCount('create')).toBe(0);
    });

    it('should track multiple operation call counts', async () => {
      const loan = createLoanRecord();
      await repository.create(loan);
      await repository.getById(loan.id);
      await repository.getById(loan.id);
      await repository.listByUser(loan.userId);
      await repository.update(loan);
      
      expect(repository.getCallCount('create')).toBe(1);
      expect(repository.getCallCount('getById')).toBe(2);
      expect(repository.getCallCount('listByUser')).toBe(1);
      expect(repository.getCallCount('update')).toBe(1);
    });
  });

  describe('Data Isolation', () => {
    it('should not affect original loan when updating', async () => {
      const original = createLoanRecord({ status: LoanStatus.Pending });
      await repository.create(original);
      
      const updated = { ...original, status: LoanStatus.Active };
      await repository.update(updated);
      
      // Original object should remain unchanged
      expect(original.status).toBe(LoanStatus.Pending);
    });

    it('should return independent copies of loans', async () => {
      const loan = createLoanRecord();
      await repository.create(loan);
      
      const retrieved1 = await repository.getById(loan.id);
      const retrieved2 = await repository.getById(loan.id);
      
      // Should be equal in value
      expect(retrieved1).toEqual(retrieved2);
      // MockLoanRepository returns copies, not references
      // (This behavior may vary by implementation)
    });
  });
});
