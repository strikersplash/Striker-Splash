"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInterface = void 0;
const Player_1 = __importDefault(require("../../models/Player"));
const QueueTicket_1 = __importDefault(require("../../models/QueueTicket"));
const db_1 = require("../../config/db");
// Display staff interface
const getInterface = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // Authentication is already handled by isStaff middleware
        // No need for additional checks here
        // Get competition types
        const competitionTypesResult = yield Player_1.default.query("SELECT * FROM competition_types WHERE active = TRUE", []);
        const competitionTypes = competitionTypesResult.rows;
        // Get current queue position
        const currentQueuePosition = yield QueueTicket_1.default.getCurrentQueuePosition();
        // Get next ticket number
        const nextTicketQuery = `
      SELECT value as next_ticket
      FROM global_counters
      WHERE id = 'next_queue_number'
    `;
        const nextTicketResult = yield db_1.pool.query(nextTicketQuery);
        const nextTicket = ((_a = nextTicketResult.rows[0]) === null || _a === void 0 ? void 0 : _a.next_ticket) || 1000;
        // Get ticket information for low ticket warning using same logic as ticket management
        let ticketInfo = {
            availableTickets: 0,
            ticketRange: "Not set",
            lowTicketWarning: true,
        };
        try {
            const ticketRangeQuery = `
        SELECT * FROM ticket_ranges
        ORDER BY created_at DESC
        LIMIT 1
      `;
            const rangeResult = yield db_1.pool.query(ticketRangeQuery);
            if (rangeResult.rows.length > 0) {
                const ticketRangeSettings = rangeResult.rows[0];
                const startTicket = ticketRangeSettings.start_ticket;
                const endTicket = ticketRangeSettings.end_ticket;
                // Calculate available tickets the same way as ticket management page
                ticketInfo.availableTickets = Math.max(0, endTicket - nextTicket + 1);
                ticketInfo.ticketRange = `${startTicket}-${endTicket}`;
                ticketInfo.lowTicketWarning = ticketInfo.availableTickets < 50;
            }
            else {
                ticketInfo.availableTickets = 0;
                ticketInfo.ticketRange = "No range set";
                ticketInfo.lowTicketWarning = true;
            }
        }
        catch (e) {
            console.error("Error getting ticket information:", e);
            ticketInfo.availableTickets = 0;
            ticketInfo.ticketRange = "Error";
            ticketInfo.lowTicketWarning = true;
        }
        res.render("staff/interface", {
            title: "Staff Interface",
            competitionTypes,
            currentQueuePosition,
            nextTicket,
            ticketInfo,
        });
    }
    catch (error) {
        console.error("Staff interface error:", error);
        req.flash("error_msg", "An error occurred while loading the staff interface");
        res.redirect("/");
    }
});
exports.getInterface = getInterface;
