import { app } from "@azure/functions";

// -------------------------------
// Loan HTTP API Endpoints
// -------------------------------
import "./API/Http/createLoanHttp";
import "./API/Http/cancelLoanHttp";
import "./API/Http/listLoansHttp";

// -------------------------------
// EventGrid Inbound Event Handlers
// -------------------------------
import "./API/Events/reservationEventsHttp";
import "./API/Events/staffEventsHttp";


// Export the application
export default app;
