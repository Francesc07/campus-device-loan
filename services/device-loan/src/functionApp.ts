// src/functionApp.ts
import { app } from "@azure/functions";
import "./API/functions/create-loan-http";
import "./API/functions/cancel-loan-http";
import "./API/functions/list-loans-http";
import "./API/functions/get-loan-by-id-http";

import "./API/functions/list-device-snapshots-http";
import "./API/functions/get-device-snapshot-http";
import "./API/functions/device-sync-http";
import "./API/functions/device-sync-event-grid";
import "./API/functions/reservation-events-http";
import "./API/functions/confirmation-events-http";


export default { app };
