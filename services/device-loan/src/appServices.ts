// src/appServices.ts

// -----------------------------------------------------------
//  IMPORTS
// -----------------------------------------------------------
import { CosmosLoanRepository } from "./Infrastructure/Persistence/CosmosLoanRepository";
import { DeviceSnapshotRepository } from "./Infrastructure/Persistence/DeviceSnapshotRepository";
import { LoanEventPublisher } from "./Infrastructure/EventGrid/LoanEventPublisher";
import { Auth0UserService } from "./Infrastructure/Users/Auth0UserService";
import { EmailService } from "./Infrastructure/Notifications/EmailService";

// UseCases
import {CreateLoanUseCase} from "./Application/UseCases/CreateLoanUseCase";
import { CancelLoanUseCase } from "./Application/UseCases/CancelLoanUseCase";
import { ActivateLoanUseCase } from "./Application/UseCases/ActivateLoanUseCase";
import { LinkReservationUseCase } from "./Application/UseCases/LinkReservationUseCase";
import { ListLoansUseCase } from "./Application/UseCases/ListLoansUseCase";
import { GetDeviceSnapshotUseCase } from "./Application/UseCases/GetDeviceSnapshotUseCase";
import { ListDeviceSnapshotsUseCase } from "./Application/UseCases/ListDeviceSnapshotsUseCase";
import { GetLoanByIdUseCase } from "./Application/UseCases/GetLoanByIdUseCase";
import { ProcessWaitlistUseCase } from "./Application/UseCases/ProcessWaitlistUseCase";
import { SyncAllDevicesUseCase } from "./Application/UseCases/SyncAllDevicesUseCase";



// Handlers
import {CreateLoanHandler} from "./Application/Handlers/CreateLoanHandler";
import { CancelLoanHandler } from "./Application/Handlers/CancelLoanHandler";
import { ActivateLoanHandler } from "./Application/Handlers/ActivateLoanHandler";
import { ListLoansHandler } from "./Application/Handlers/ListLoansHandler";
import { GetDeviceSnapshotHandler } from "./Application/Handlers/GetDeviceSnapshotHandler";
import { ListDeviceSnapshotsHandler } from "./Application/Handlers/ListDeviceSnapshotsHandler";
import { GetLoanByIdHandler } from "./Application/Handlers/GetLoanByIdHandler";
import { ProcessWaitlistHandler } from "./Application/Handlers/ProcessWaitlistHandler";

// Event Processors
import { ReservationEventsProcessor } from "./Infrastructure/EventGrid/ReservationEventsProcessor";
import { StaffEventsProcessor } from "./Infrastructure/EventGrid/StaffEventsProcessor";

// -----------------------------------------------------------
//  INFRASTRUCTURE SINGLETONS
// -----------------------------------------------------------

const loanRepo = new CosmosLoanRepository();
const snapshotRepo = new DeviceSnapshotRepository();
const eventPublisher = new LoanEventPublisher();  
const emailService = new EmailService();

// Auth0 config from environment
const auth0Domain = process.env.AUTH0_DOMAIN || "";
const auth0Token = process.env.AUTH0_MGMT_API_TOKEN || "";
const userService = new Auth0UserService(auth0Domain, auth0Token);

// -----------------------------------------------------------
//  USE CASES
// -----------------------------------------------------------

const createLoanUseCase = new CreateLoanUseCase(
  loanRepo,
  snapshotRepo,
  eventPublisher,
  userService, // inject user service
  emailService // inject email service
);

const cancelLoanUseCase = new CancelLoanUseCase(loanRepo, eventPublisher);
const activateLoanUseCase = new ActivateLoanUseCase(loanRepo, eventPublisher);
const linkReservationUseCase = new LinkReservationUseCase(loanRepo);
const listLoansUseCase = new ListLoansUseCase(loanRepo);

const getDeviceSnapshotUseCase = new GetDeviceSnapshotUseCase(snapshotRepo);
const listDeviceSnapshotsUseCase = new ListDeviceSnapshotsUseCase(snapshotRepo);

const getLoanByIdUseCase = new GetLoanByIdUseCase(loanRepo);
const processWaitlistUseCase = new ProcessWaitlistUseCase(
  loanRepo,
  snapshotRepo,
  eventPublisher,
  emailService
);

const catalogServiceUrl = process.env.CATALOG_SERVICE_URL || "https://devicecatalog-dev-ab07-func.azurewebsites.net";
const syncAllDevicesUseCase = new SyncAllDevicesUseCase(snapshotRepo, catalogServiceUrl);

// -----------------------------------------------------------
//  HANDLERS
// -----------------------------------------------------------

const createLoanHandler = new CreateLoanHandler(createLoanUseCase);
const cancelLoanHandler = new CancelLoanHandler(cancelLoanUseCase);
const activateLoanHandler = new ActivateLoanHandler(activateLoanUseCase);
const listLoansHandler = new ListLoansHandler(listLoansUseCase);

const getDeviceSnapshotHandler = new GetDeviceSnapshotHandler(
  getDeviceSnapshotUseCase
);
const listDeviceSnapshotsHandler = new ListDeviceSnapshotsHandler(
  listDeviceSnapshotsUseCase
);

const getLoanByIdHandler = new GetLoanByIdHandler(getLoanByIdUseCase);
const processWaitlistHandler = new ProcessWaitlistHandler(processWaitlistUseCase);

// -----------------------------------------------------------
//  EVENT PROCESSORS
// -----------------------------------------------------------

const reservationEventsProcessor = new ReservationEventsProcessor(
  activateLoanUseCase
);

const staffEventsProcessor = new StaffEventsProcessor(loanRepo);

// -----------------------------------------------------------
//  EXPORT PUBLIC SERVICE REGISTRY
// -----------------------------------------------------------

export const appServices = {
  // HTTP handlers
  createLoanHandler,
  cancelLoanHandler,
  listLoansHandler,
  activateLoanHandler,
  linkReservationUseCase,

  getDeviceSnapshotHandler,
  listDeviceSnapshotsHandler,
  getLoanByIdHandler,
  processWaitlistHandler,

  // EventGrid processors
  reservationEventsProcessor,
  staffEventsProcessor,

  // Device sync use case
  syncAllDevicesUseCase,

  // Repositories if needed
  loanRepo,
  snapshotRepo,

  // Auth0 User Service
  userService,

  // Email Service
  emailService,
};
