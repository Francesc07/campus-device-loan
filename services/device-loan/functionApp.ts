import { app } from "@azure/functions";

// -------------------------------
// Loan HTTP API Endpoints
// -------------------------------
import "./src/API/functions/create-loan-http";
import "./src/API/functions/cancel-loan-http";
import "./src/API/functions/list-loans-http";
import "./src/API/functions/get-loan-by-id-http";

// -------------------------------
// Event Grid Triggers
// -------------------------------
import "./src/API/functions/device-sync-eventgrid";
import "./src/API/functions/device-sync-http";
import "./src/API/functions/reservationEventsHttp";
import "./src/API/functions/staffEventsHttp";

// Export the application
export default app;
