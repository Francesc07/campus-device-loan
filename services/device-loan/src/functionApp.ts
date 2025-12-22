// src/functionApp.ts
import { app } from "@azure/functions";
import "./API/functions/create-loan-http";
import "./API/functions/cancel-loan-http";
import "./API/functions/list-loans-http";
import "./API/functions/get-loan-by-id-http";

import "./API/functions/list-device-snapshots-http";
import "./API/functions/get-device-snapshot-http";
import "./API/functions/device-sync-event-grid";
import "./API/functions/sync-devices-http";
import "./API/functions/sync-devices-timer";
import "./API/functions/reservation-events-http";
import "./API/functions/confirmation-events-http";
import "./API/functions/check-overdue-loans-timer";


export default { app };
