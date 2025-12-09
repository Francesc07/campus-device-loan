"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoanEventPublisher = void 0;
const crypto_1 = __importDefault(require("crypto"));
// Use global fetch available in Node.js v18+
class LoanEventPublisher {
    constructor() {
        this.mode = (process.env.ENVIRONMENT === "dev-cloud" ||
            process.env.ENVIRONMENT === "test-cloud" ||
            process.env.ENVIRONMENT === "prod-cloud")
            ? "azure"
            : "local";
        this.topicEndpoint = process.env.EVENTGRID_TOPIC_ENDPOINT || "";
        this.topicKey = process.env.EVENTGRID_TOPIC_KEY || "";
        if (this.mode === "azure" && (!this.topicEndpoint || !this.topicKey)) {
            throw new Error("❌ Missing Event Grid settings for Azure mode.");
        }
        console.log(`📡 LoanEventPublisher running in mode: ${this.mode}`);
    }
    /**
     * PUBLIC: Implements ILoanEventPublisher.publish.
     * This is the required method for dependency injection.
     */
    async publish(eventType, data) {
        if (this.mode === "azure") {
            return this.publishToEventGrid(eventType, data);
        }
        return this.publishLocal(eventType, data);
    }
    /** --- INTERNAL: Publish to Azure Event Grid --- */
    async publishToEventGrid(eventType, data) {
        const events = [
            {
                id: crypto_1.default.randomUUID(),
                eventType,
                subject: `loan/${eventType}`,
                eventTime: new Date().toISOString(),
                dataVersion: "1.0",
                data // The data is the LoanRecord object
            },
        ];
        const response = await fetch(this.topicEndpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "aeg-sas-key": this.topicKey,
            },
            body: JSON.stringify(events),
        });
        if (!response.ok) {
            const err = await response.text();
            console.error(`❌ Failed to publish ${eventType}:`, err);
            throw new Error(`Event Grid error: ${response.status}`);
        }
        console.log(`✅ Event published → ${eventType}`);
    }
    /** --- INTERNAL: Local development mode (no-op) --- */
    async publishLocal(eventType, data) {
        console.log(`🔄 LOCAL MODE → Event skipped: ${eventType}`);
        console.log(JSON.stringify(data, null, 2));
    }
}
exports.LoanEventPublisher = LoanEventPublisher;
//# sourceMappingURL=LoanEventPublisher.js.map