// tests/unit/useCases/CreateLoanUseCase.test.ts
import { CreateLoanUseCase } from "../../../src/Application/UseCases/CreateLoanUseCase";
import { MockLoanRepository } from "../../mocks/MockLoanRepository";
import { MockDeviceSnapshotRepository } from "../../mocks/MockDeviceSnapshotRepository";
import { MockLoanEventPublisher } from "../../mocks/MockLoanEventPublisher";
import { MockUserService } from "../../mocks/MockUserService";
import { MockEmailService } from "../../mocks/MockEmailService";
import { CreateLoanDto } from "../../../src/Application/Dtos/CreateLoanDto";
import { LoanStatus } from "../../../src/Domain/Enums/LoanStatus";
import { availableDevice, unavailableDevice, singleAvailableDevice } from "../../fixtures/deviceFixtures";

describe('CreateLoanUseCase', () => {
  let useCase: CreateLoanUseCase;
  let mockLoanRepo: MockLoanRepository;
  let mockSnapshotRepo: MockDeviceSnapshotRepository;
  let mockEventPublisher: MockLoanEventPublisher;
  let mockUserService: MockUserService;
  let mockEmailService: MockEmailService;

  beforeEach(() => {
    mockLoanRepo = new MockLoanRepository();
    mockSnapshotRepo = new MockDeviceSnapshotRepository();
    mockEventPublisher = new MockLoanEventPublisher();
    mockUserService = new MockUserService();
    mockEmailService = new MockEmailService();
    useCase = new CreateLoanUseCase(mockLoanRepo, mockSnapshotRepo, mockEventPublisher, mockUserService, mockEmailService as any);
  });

  afterEach(() => {
    mockLoanRepo.clear();
    mockSnapshotRepo.clear();
    mockEventPublisher.clear();
  });

  describe('Successful Loan Creation', () => {
    it('should create pending loan when device is available', async () => {
      mockSnapshotRepo.addSnapshot(availableDevice);

      const dto: CreateLoanDto = {
        userId: 'user-123',
        deviceId: availableDevice.id
      };

      const result = await useCase.execute(dto);

      expect(result.userId).toBe(dto.userId);
      expect(result.deviceId).toBe(dto.deviceId);
      expect(result.status).toBe(LoanStatus.Pending);
      expect(result.id).toBeDefined();
      expect(mockLoanRepo.getCallCount('create')).toBe(1);
    });

    it('should create waitlisted loan when device is unavailable', async () => {
      mockSnapshotRepo.addSnapshot(unavailableDevice);

      const dto: CreateLoanDto = {
        userId: 'user-456',
        deviceId: unavailableDevice.id
      };

      const result = await useCase.execute(dto);

      expect(result.status).toBe(LoanStatus.Waitlisted);
      expect(result.deviceId).toBe(dto.deviceId);
    });

    it('should set due date 2 days from start date', async () => {
      mockSnapshotRepo.addSnapshot(availableDevice);

      const dto: CreateLoanDto = {
        userId: 'user-789',
        deviceId: availableDevice.id
      };

      const result = await useCase.execute(dto);
      const startDate = new Date(result.startDate);
      const dueDate = new Date(result.dueDate);
      const diffInDays = (dueDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);

      expect(diffInDays).toBeCloseTo(2, 1);
    });

    it('should include reservationId when provided', async () => {
      mockSnapshotRepo.addSnapshot(availableDevice);

      const dto: CreateLoanDto = {
        userId: 'user-123',
        deviceId: availableDevice.id,
        reservationId: 'res-456'
      };

      const result = await useCase.execute(dto);

      expect(result.reservationId).toBe('res-456');
    });
  });

  describe('Event Publishing', () => {
    it('should publish Loan.Created event for available device', async () => {
      mockSnapshotRepo.addSnapshot(availableDevice);

      const dto: CreateLoanDto = {
        userId: 'user-123',
        deviceId: availableDevice.id
      };

      await useCase.execute(dto);

      const events = mockEventPublisher.getEventsByType('Loan.Created');
      expect(events).toHaveLength(1);
      expect(events[0].data.userId).toBe(dto.userId);
      expect(events[0].data.status).toBe(LoanStatus.Pending);
    });

    it('should publish Loan.Waitlisted event for unavailable device', async () => {
      mockSnapshotRepo.addSnapshot(unavailableDevice);

      const dto: CreateLoanDto = {
        userId: 'user-456',
        deviceId: unavailableDevice.id
      };

      await useCase.execute(dto);

      const events = mockEventPublisher.getEventsByType('Loan.Waitlisted');
      expect(events).toHaveLength(1);
      expect(events[0].data.status).toBe(LoanStatus.Waitlisted);
      expect(events[0].data.message).toContain('unavailable');
    });

    it('should include device details in waitlist message', async () => {
      mockSnapshotRepo.addSnapshot(unavailableDevice);

      const dto: CreateLoanDto = {
        userId: 'user-123',
        deviceId: unavailableDevice.id
      };

      await useCase.execute(dto);

      const events = mockEventPublisher.getEventsByType('Loan.Waitlisted');
      expect(events[0].data.message).toContain(unavailableDevice.brand);
      expect(events[0].data.message).toContain(unavailableDevice.model);
    });
  });

  describe('Error Handling', () => {
    it('should throw error when device does not exist', async () => {
      const dto: CreateLoanDto = {
        userId: 'user-123',
        deviceId: 'non-existent-device'
      };

      await expect(useCase.execute(dto)).rejects.toThrow('Device not found');
      expect(mockLoanRepo.getCallCount('create')).toBe(0);
    });

    it('should not publish events when device not found', async () => {
      const dto: CreateLoanDto = {
        userId: 'user-123',
        deviceId: 'non-existent-device'
      };

      await expect(useCase.execute(dto)).rejects.toThrow();
      expect(mockEventPublisher.getPublishedEvents()).toHaveLength(0);
    });
  });

  describe('Idempotency', () => {
    it('should create unique loans for same user and device', async () => {
      mockSnapshotRepo.addSnapshot(availableDevice);

      const dto: CreateLoanDto = {
        userId: 'user-123',
        deviceId: availableDevice.id
      };

      const loan1 = await useCase.execute(dto);
      const loan2 = await useCase.execute(dto);

      expect(loan1.id).not.toBe(loan2.id);
      expect(mockLoanRepo.getAllLoans()).toHaveLength(2);
    });
  });

  describe('Repository Interactions', () => {
    it('should call snapshot repository before creating loan', async () => {
      mockSnapshotRepo.addSnapshot(availableDevice);

      const dto: CreateLoanDto = {
        userId: 'user-123',
        deviceId: availableDevice.id
      };

      await useCase.execute(dto);

      expect(mockSnapshotRepo.getCallCount('getSnapshot')).toBe(1);
      expect(mockLoanRepo.getCallCount('create')).toBe(1);
    });
  });
});
