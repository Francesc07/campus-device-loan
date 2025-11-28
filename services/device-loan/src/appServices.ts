// -----------------------------------------------------------
//  IMPORTS
// -----------------------------------------------------------
import { CosmosLoanRepository } from "./Infrastructure/Persistence/CosmosLoanRepository";
import { DeviceSnapshotRepository } from "./Infrastructure/Persistence/DeviceSnapshotRepository";
import { LoanEventPublisher } from "./Infrastructure/EventGrid/LoanEventPublisher";

// UseCases
import { CreateLoanUseCase } from "./Application/UseCases/CreateLoanUseCase";
import { CancelLoanUseCase } from "./Application/UseCases/CancelLoanUseCase";
import { ActivateLoanUseCase } from "./Application/UseCases/ActivateLoanUseCase";
import { ListLoansUseCase } from "./Application/UseCases/ListLoansUseCase";

// Handlers
import { CreateLoanHandler } from "./Application/Handlers/CreateLoanHandler";
import { CancelLoanHandler } from "./Application/Handlers/CancelLoanHandler";
import { ActivateLoanHandler } from "./Application/Handlers/ActivateLoanHandler";
import { ListLoansHandler } from "./Application/Handlers/ListLoansHandler";

// Event Processors
import { ReservationEventsProcessor } from "./Infrastructure/EventGrid/ReservationEventsProcessor";
import { StaffEventsProcessor } from "./Infrastructure/EventGrid/StaffEventsProcessor";


// -----------------------------------------------------------
//  INFRASTRUCTURE SINGLETONS
// -----------------------------------------------------------

// Loan storage
const loanRepo = new CosmosLoanRepository();

// Local device snapshot cache (synced from Catalog)
const snapshotRepo = new DeviceSnapshotRepository();

// Event publisher (EventGrid OR webhook depending on environment)
const eventPublisher = new LoanEventPublisher();


// -----------------------------------------------------------
//  USE CASES
// -----------------------------------------------------------

const createLoanUseCase = new CreateLoanUseCase(
  loanRepo,
  snapshotRepo,
  eventPublisher
);

const cancelLoanUseCase = new CancelLoanUseCase(loanRepo);

const activateLoanUseCase = new ActivateLoanUseCase(loanRepo);

const listLoansUseCase = new ListLoansUseCase(loanRepo);


// -----------------------------------------------------------
//  HANDLERS (used by HTTP endpoints & event processors)
// -----------------------------------------------------------

const createLoanHandler = new CreateLoanHandler(createLoanUseCase);
const cancelLoanHandler = new CancelLoanHandler(cancelLoanUseCase);
const activateLoanHandler = new ActivateLoanHandler(activateLoanUseCase);
const listLoansHandler = new ListLoansHandler(listLoansUseCase);


// -----------------------------------------------------------
//  EVENT PROCESSORS
// -----------------------------------------------------------
//
// Reservation Service publishes:
//   - Reservation.Confirmed  → creates loan (Pending → Active)
//   - Reservation.Cancelled  → cancels loan
//
// Staff Service publishes:
//   - Staff.DeviceReturned   → marks loan as Returned
//

const reservationEventsProcessor = new ReservationEventsProcessor(
  activateLoanUseCase,
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
  activateLoanHandler, // optional (if you expose ActivateLoan via API)

  // EventGrid -> Loan service
  reservationEventsProcessor,
  staffEventsProcessor,

  // Repositories (if needed elsewhere)
  loanRepo,
  snapshotRepo
};
