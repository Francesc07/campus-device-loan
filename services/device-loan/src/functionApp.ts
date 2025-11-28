import {app} from "@azure/functions";
// HTTP Endpoints 
import "./API/functions/create-loan-http";
import "./API/functions/cancel-loan-http";
import "./API/functions/list-loans-http";
import "./API/functions/get-loan-by-id-http";
import "./API/functions/device-sync-eventgrid";
import "./API/functions/reservation-events-http";
import "./API/functions/staff-events-http";

export default app;


