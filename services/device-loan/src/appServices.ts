import { CosmosLoanRepository } from "./Infrastructure/Persistence/CosmosLoanRepository";
import { LoanEventPublisher } from "./Infrastructure/EventGrid/LoanEventPublisher";

// UseCases
import { CreateLoanUseCase } from "./Application/UseCases/CreateLoanUseCase";
import { CancelLoanUseCase } from "./Application/UseCases/CancelLoanUseCase";
import { ActivateLoanUseCase } from "./Application/UseCases/ActivateLoanUseCase";
import { MarkLoanReturnedUseCase } from "./Application/UseCases/MarkLoanReturnedUseCase";
import { ListLoansUseCase } from "./Application/UseCases/ListLoansUseCase";

// Handlers
import { CreateLoanHandler } from "./Application/Handlers/CreateLoanHandler";
import { CancelLoanHandler } from "./Application/Handlers/CancelLoanHandler";
import { ActivateLoanHandler } from "./Application/Handlers/ActivateLoanHandler";
import { MarkLoanReturnedHandler } from "./Application/Handlers/MarkLoanReturnedHandler";
import { ListLoansHandler } from "./Application/Handlers/ListLoansHandler";

// Event Processors
import { ReservationEventsProcessor } from "./Infrastructure/EventGrid/ReservationEventsProcessor";
import { StaffEventsProcessor } from "./Infrastructure/EventGrid/StaffEventsProcessor";


// -----------------------------------------------------------
//  Infrastructure instances (repositories + publisher)
// -----------------------------------------------------------
const loanRepo = new CosmosLoanRepository();
const eventPublisher = new LoanEventPublisher();


// -----------------------------------------------------------
//  UseCase instances
// -----------------------------------------------------------
const createLoanUseCase = new CreateLoanUseCase(loanRepo, eventPublisher);
const cancelLoanUseCase = new CancelLoanUseCase(loanRepo, eventPublisher);
const activateLoanUseCase = new ActivateLoanUseCase(loanRepo);
const markLoanReturnedUseCase = new MarkLoanReturnedUseCase(loanRepo, eventPublisher);
const listLoansUseCase = new ListLoansUseCase(loanRepo);


// -----------------------------------------------------------
//  Handler instances
// -----------------------------------------------------------
const createLoanHandler = new CreateLoanHandler(createLoanUseCase);
const cancelLoanHandler = new CancelLoanHandler(cancelLoanUseCase);
const activateLoanHandler = new ActivateLoanHandler(activateLoanUseCase);
const markLoanReturnedHandler = new MarkLoanReturnedHandler(markLoanReturnedUseCase);
const listLoansHandler = new ListLoansHandler(listLoansUseCase);


// -----------------------------------------------------------
//  Event Processors (Reservation + Staff → Loan)
// -----------------------------------------------------------
const reservationEventsProcessor = new ReservationEventsProcessor(
  activateLoanHandler,
  cancelLoanHandler
);

const staffEventsProcessor = new StaffEventsProcessor(
  markLoanReturnedHandler
);


// -----------------------------------------------------------
//  Export all ready-to-use services
// -----------------------------------------------------------
export const appServices = {
  // HTTP handlers
  createLoanHandler,
  cancelLoanHandler,
  listLoansHandler,

  // Event processors (EventGrid inbound)
  reservationEventsProcessor,
  staffEventsProcessor
};
