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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPublicEvents = void 0;
const db_1 = require("../../config/db");
// Get all upcoming events for public viewing (no authentication required)
const getPublicEvents = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Manually calculate Belize time (UTC-6)
        const now = new Date();
        const belizeTime = new Date(now.getTime() - 6 * 60 * 60 * 1000);
        const today = belizeTime.toISOString().split("T")[0];
        // Get all upcoming events (where end_date >= today)
        const eventsQuery = `
      SELECT * FROM event_locations 
      WHERE end_date >= $1
      ORDER BY start_date ASC
    `;
        const eventsResult = yield db_1.pool.query(eventsQuery, [today]);
        const events = eventsResult.rows;
        res.json({
            success: true,
            events,
        });
    }
    catch (error) {
        console.error("Error fetching public events:", error);
        res.status(500).json({
            success: false,
            message: "Failed to load events",
        });
    }
});
exports.getPublicEvents = getPublicEvents;
