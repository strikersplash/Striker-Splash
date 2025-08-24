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
const express_1 = __importDefault(require("express"));
const competitionController_1 = require("../controllers/api/competitionController");
const activityController_1 = require("../controllers/api/activityController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Test route to verify API is working
router.get("/test", (req, res) => {
    res.json({ message: "API is working", timestamp: new Date().toISOString() });
});
// Competition endpoints
router.post("/competitions", competitionController_1.createCompetition);
router.get("/competitions", competitionController_1.getCompetitions);
// Queue endpoints (require staff authentication)
router.get("/queue/current", auth_1.isStaff, activityController_1.getCurrentQueuePosition);
router.get("/queue/list", auth_1.isStaff, activityController_1.getQueueList);
// Activity endpoints
router.get("/activity/today", activityController_1.getTodaysActivity);
// Temporary diagnostic route to validate date filtering vs timezone
router.get("/activity/today-adjusted", activityController_1.getTodaysActivityAdjusted);
// Public events endpoint for About Us page
router.get("/public/events", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Request received at:", new Date().toISOString());
    try {
        // Import pool here to avoid circular dependencies
        const { pool } = require("../config/db");
        // Get upcoming events (current and future events only)
        // Manually calculate Belize time (UTC-6)
        const now = new Date();
        const belizeTime = new Date(now.getTime() - 6 * 60 * 60 * 1000); // Subtract 6 hours for UTC-6
        const todayString = belizeTime.toISOString().split("T")[0];
        console.log("UTC time:", now.toISOString());
        console.log("Belize time (UTC-6):", belizeTime.toISOString());
        console.log("Belize date for filtering:", todayString);
        const eventsQuery = `
      SELECT * FROM event_locations 
      WHERE end_date >= $1
      ORDER BY start_date ASC
    `;
        console.log("With parameter:", todayString);
        const eventsResult = yield pool.query(eventsQuery, [todayString]);
        if (eventsResult.rows.length > 0) {
            console.log("Events found:");
            eventsResult.rows.forEach((event, index) => {
                console.log(`${index + 1}. ${event.name} (${event.start_date} to ${event.end_date})`);
            });
        }
        else {
            console.log("No events found matching criteria");
        }
        const response = {
            success: true,
            events: eventsResult.rows,
        };
        res.json(response);
    }
    catch (error) {
        console.error("Error fetching public events:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch events",
            events: [],
        });
    }
}));
// Events endpoint for logged-in users (supports player registrations)
router.get("/events/upcoming", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log("Events/upcoming route hit!");
    try {
        // Import pool here to avoid circular dependencies
        const { pool } = require("../config/db");
        // Get upcoming events (current and future events only)
        const today = new Date().toISOString().split("T")[0];
        const eventsQuery = `
      SELECT * FROM event_locations 
      WHERE end_date >= $1
      ORDER BY start_date ASC
    `;
        const eventsResult = yield pool.query(eventsQuery, [today]);
        // Get player information if logged in
        let availableKicks = 0;
        let registrations = [];
        // Check if user is logged in and is a player
        const session = req.session;
        if (((_a = session === null || session === void 0 ? void 0 : session.user) === null || _a === void 0 ? void 0 : _a.role) === "player") {
            const playerId = session.user.id;
            // Get player's kick balance (exclude deleted players)
            try {
                const playerQuery = `
          SELECT kicks_balance FROM players WHERE id = $1 AND deleted_at IS NULL
        `;
                const playerResult = yield pool.query(playerQuery, [playerId]);
                if (playerResult.rows.length > 0) {
                    availableKicks = playerResult.rows[0].kicks_balance || 0;
                }
                else {
                }
            }
            catch (error) {
                console.error("Error fetching player kick balance:", error);
            }
            // Get player's event registrations
            try {
                const registrationsQuery = `
          SELECT er.*, el.name as event_name 
          FROM event_registrations er
          JOIN event_locations el ON er.event_id = el.id
          WHERE er.player_id = $1
        `;
                const registrationsResult = yield pool.query(registrationsQuery, [
                    playerId,
                ]);
                registrations = registrationsResult.rows;
            }
            catch (error) {
                console.error("Error fetching player registrations:", error);
            }
        }
        else {
        }
        res.json({
            success: true,
            events: eventsResult.rows,
            availableKicks: availableKicks,
            registrations: registrations,
        });
    }
    catch (error) {
        console.error("Error fetching events for logged-in user:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch events",
            events: [],
            availableKicks: 0,
            registrations: [],
        });
    }
}));
// Event registration endpoint
router.post("/events/register", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log("Request body:", req.body);
    try {
        // Import pool here to avoid circular dependencies
        const { pool } = require("../config/db");
        // Check if user is logged in and is a player
        const session = req.session;
        if (!((_a = session === null || session === void 0 ? void 0 : session.user) === null || _a === void 0 ? void 0 : _a.role) || session.user.role !== "player") {
            return res.status(401).json({
                success: false,
                error: "You must be logged in as a player to register for events",
            });
        }
        const playerId = session.user.id;
        const { eventId, kicksRequested, isCompetition } = req.body;
        console.log(`Kicks requested: ${kicksRequested}, Is competition: ${isCompetition}`);
        // Validate input
        if (!eventId || !kicksRequested || kicksRequested < 1) {
            return res.status(400).json({
                success: false,
                error: "Invalid registration data",
            });
        }
        const client = yield pool.connect();
        try {
            yield client.query("BEGIN");
            // Get event details and check if registration is open
            const eventQuery = `
        SELECT * FROM event_locations WHERE id = $1
      `;
            const eventResult = yield client.query(eventQuery, [eventId]);
            if (eventResult.rows.length === 0) {
                yield client.query("ROLLBACK");
                return res.status(404).json({
                    success: false,
                    error: "Event not found",
                });
            }
            const event = eventResult.rows[0];
            console.log(`Event found: ${event.name}`);
            // Check if registration is closed
            if (event.registration_closed) {
                yield client.query("ROLLBACK");
                return res.status(400).json({
                    success: false,
                    error: "Registration for this event has been closed by staff",
                });
            }
            // Get player's current kick balance (exclude deleted players)
            const playerQuery = `
        SELECT kicks_balance FROM players WHERE id = $1 AND deleted_at IS NULL
      `;
            const playerResult = yield client.query(playerQuery, [playerId]);
            if (playerResult.rows.length === 0) {
                yield client.query("ROLLBACK");
                return res.status(404).json({
                    success: false,
                    error: "Player not found or account inactive",
                });
            }
            const currentKicks = playerResult.rows[0].kicks_balance || 0;
            // Calculate tickets needed (based on event's tickets_required and kicks_requested)
            const ticketsPerKick = event.tickets_required || 1;
            const totalTicketsNeeded = kicksRequested * ticketsPerKick;
            console.log(`Tickets needed: ${totalTicketsNeeded} (${kicksRequested} kicks × ${ticketsPerKick} tickets/kick)`);
            // Check if player has enough kicks
            if (currentKicks < kicksRequested) {
                yield client.query("ROLLBACK");
                return res.status(400).json({
                    success: false,
                    error: `Insufficient kicks. You have ${currentKicks} kicks but need ${kicksRequested}`,
                });
            }
            // Check if player is already registered for this event
            const existingRegistrationQuery = `
        SELECT id FROM event_registrations 
        WHERE player_id = $1 AND event_id = $2
      `;
            const existingResult = yield client.query(existingRegistrationQuery, [
                playerId,
                eventId,
            ]);
            if (existingResult.rows.length > 0) {
                yield client.query("ROLLBACK");
                return res.status(400).json({
                    success: false,
                    error: "You are already registered for this event",
                });
            }
            // Get next registration number for this event
            const registrationNumberQuery = `
        SELECT COALESCE(MAX(registration_number), 0) + 1 as next_number
        FROM event_registrations 
        WHERE event_id = $1
      `;
            const regNumberResult = yield client.query(registrationNumberQuery, [
                eventId,
            ]);
            const registrationNumber = regNumberResult.rows[0].next_number;
            // Create the registration
            const insertRegistrationQuery = `
        INSERT INTO event_registrations 
        (event_id, player_id, kicks_requested, is_competition, tickets_used, registration_number)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `;
            const registrationResult = yield client.query(insertRegistrationQuery, [
                eventId,
                playerId,
                kicksRequested,
                isCompetition,
                totalTicketsNeeded,
                registrationNumber,
            ]);
            const registrationId = registrationResult.rows[0].id;
            console.log(`Registration created with ID: ${registrationId}`);
            // Deduct kicks from player's balance
            const updatePlayerQuery = `
        UPDATE players 
        SET kicks_balance = kicks_balance - $1 
        WHERE id = $2
        RETURNING kicks_balance
      `;
            const updatedPlayerResult = yield client.query(updatePlayerQuery, [
                kicksRequested,
                playerId,
            ]);
            const remainingKicks = updatedPlayerResult.rows[0].kicks_balance;
            // Add notification for the player
            const notificationQuery = `
        INSERT INTO notifications
        (player_id, title, message, type, created_at, is_read)
        VALUES ($1, $2, $3, $4, NOW() - INTERVAL '6 hours', false)
      `;
            yield client.query(notificationQuery, [
                playerId,
                `Event Registration Confirmed`,
                `You have successfully registered for "${event.name}" using ${kicksRequested} kicks.`,
                "event_registration",
            ]);
            yield client.query("COMMIT");
            console.log("Registration completed successfully");
            res.json({
                success: true,
                message: "Successfully registered for event",
                kicksUsed: kicksRequested,
                remainingKicks: remainingKicks,
                registrationId: registrationId,
                registrationNumber: registrationNumber,
            });
        }
        catch (error) {
            yield client.query("ROLLBACK");
            throw error;
        }
        finally {
            client.release();
        }
    }
    catch (error) {
        console.error("Error registering for event:", error);
        res.status(500).json({
            success: false,
            error: "Registration failed",
        });
    }
}));
// Get player's event registrations
router.get("/events/registrations", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // Import pool here to avoid circular dependencies
        const { pool } = require("../config/db");
        // Check if user is logged in and is a player
        const session = req.session;
        if (!((_a = session === null || session === void 0 ? void 0 : session.user) === null || _a === void 0 ? void 0 : _a.role) || session.user.role !== "player") {
            return res.status(401).json({
                success: false,
                error: "You must be logged in as a player to view registrations",
                registrations: [],
            });
        }
        const playerId = session.user.id;
        // Get player's event registrations with event details
        const registrationsQuery = `
      SELECT 
        er.id,
        er.event_id,
        er.kicks_requested,
        er.is_competition,
        er.tickets_used,
        er.registration_date,
        er.registration_number,
        er.queue_ticket_id,
        el.name as event_name,
        el.address as event_address,
        el.start_date,
        el.end_date,
        el.event_type,
        el.description
      FROM event_registrations er
      JOIN event_locations el ON er.event_id = el.id
      WHERE er.player_id = $1
      ORDER BY er.registration_date DESC
    `;
        const registrationsResult = yield pool.query(registrationsQuery, [
            playerId,
        ]);
        res.json({
            success: true,
            registrations: registrationsResult.rows,
        });
    }
    catch (error) {
        console.error("Error fetching registrations:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch registrations",
            registrations: [],
        });
    }
}));
// Delete event registration
router.delete("/events/registrations/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // Import pool here to avoid circular dependencies
        const { pool } = require("../config/db");
        // Check if user is logged in and is a player
        const session = req.session;
        if (!((_a = session === null || session === void 0 ? void 0 : session.user) === null || _a === void 0 ? void 0 : _a.role) || session.user.role !== "player") {
            return res.status(401).json({
                success: false,
                error: "You must be logged in as a player to delete registrations",
            });
        }
        const playerId = session.user.id;
        const registrationId = req.params.id;
        const client = yield pool.connect();
        try {
            yield client.query("BEGIN");
            // Get registration details and verify ownership
            const registrationQuery = `
        SELECT er.*, el.name as event_name
        FROM event_registrations er
        JOIN event_locations el ON er.event_id = el.id
        WHERE er.id = $1 AND er.player_id = $2
      `;
            const registrationResult = yield client.query(registrationQuery, [
                registrationId,
                playerId,
            ]);
            if (registrationResult.rows.length === 0) {
                yield client.query("ROLLBACK");
                return res.status(404).json({
                    success: false,
                    error: "Registration not found or you don't have permission to delete it",
                });
            }
            const registration = registrationResult.rows[0];
            console.log(`Found registration for event: ${registration.event_name}`);
            // Refund kicks to player
            const refundQuery = `
        UPDATE players 
        SET kicks_balance = kicks_balance + $1 
        WHERE id = $2
        RETURNING kicks_balance
      `;
            const refundResult = yield client.query(refundQuery, [
                registration.kicks_requested,
                playerId,
            ]);
            const newBalance = refundResult.rows[0].kicks_balance;
            // Delete the registration
            const deleteQuery = `
        DELETE FROM event_registrations 
        WHERE id = $1 AND player_id = $2
      `;
            yield client.query(deleteQuery, [registrationId, playerId]);
            // Add notification for the player
            const notificationQuery = `
        INSERT INTO notifications
        (player_id, title, message, type, created_at, is_read)
        VALUES ($1, $2, $3, $4, NOW() - INTERVAL '6 hours', false)
      `;
            yield client.query(notificationQuery, [
                playerId,
                `Event Registration Cancelled`,
                `Your registration for "${registration.event_name}" has been cancelled and ${registration.kicks_requested} kicks have been refunded.`,
                "event_cancellation",
            ]);
            yield client.query("COMMIT");
            console.log("Registration deleted successfully");
            res.json({
                success: true,
                message: "Registration deleted successfully",
                refundedKicks: registration.kicks_requested,
                newBalance: newBalance,
            });
        }
        catch (error) {
            yield client.query("ROLLBACK");
            throw error;
        }
        finally {
            client.release();
        }
    }
    catch (error) {
        console.error("Error deleting registration:", error);
        res.status(500).json({
            success: false,
            error: "Failed to delete registration",
        });
    }
}));
// Simple activity route that returns today's activities only
router.get("/activity/today", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Import pool here to avoid circular dependencies
        const { pool } = require("../config/db");
        // Get today's date in local timezone
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");
        const todayString = `${year}-${month}-${day}`;
        // Get today's game stats with player names - simplified query
        const query = `
      SELECT 
        gs.id,
        gs.player_id,
        p.name as "playerName",
        gs.goals,
        gs.staff_id,
        s.name as "staffName",
        gs.location,
        gs.competition_type,
        gs.requeued,
        gs.timestamp
      FROM 
        game_stats gs
      JOIN 
        players p ON gs.player_id = p.id
      JOIN 
        staff s ON gs.staff_id = s.id
      WHERE 
        DATE(gs.timestamp) = $1
      ORDER BY 
        gs.timestamp DESC
    `;
        const result = yield pool.query(query, [todayString]);
        res.json(result.rows);
    }
    catch (error) {
        console.error("Error getting today's activity:", error);
        res.status(500).json({ error: "Failed to get today's activity" });
    }
}));
// Raffle win notification endpoint
router.post("/notifications/raffle-win", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log("Request body:", req.body);
    try {
        // Import pool here to avoid circular dependencies
        const { pool } = require("../config/db");
        // Check if user is logged in and is admin
        const session = req.session;
        if (!((_a = session === null || session === void 0 ? void 0 : session.user) === null || _a === void 0 ? void 0 : _a.role) || session.user.role !== "admin") {
            return res.status(401).json({
                success: false,
                error: "You must be logged in as an admin to send notifications",
            });
        }
        const { playerId, ticketNumber, raffleDate, customPrize, drawNumber } = req.body;
        // Validate input
        if (!playerId || !ticketNumber || !raffleDate) {
            return res.status(400).json({
                success: false,
                error: "Missing required fields: playerId, ticketNumber, raffleDate",
            });
        }
        // Get player information (exclude deleted players)
        const playerQuery = `
      SELECT name, phone FROM players WHERE id = $1 AND deleted_at IS NULL
    `;
        const playerResult = yield pool.query(playerQuery, [playerId]);
        if (playerResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: "Player not found or account inactive",
            });
        }
        const player = playerResult.rows[0];
        // Create notifications table if it doesn't exist
        yield pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        player_id INTEGER NOT NULL,
        title VARCHAR(100) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) NOT NULL,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
      )
    `);
        // Format the raffle date for display
        const formattedDate = new Date(raffleDate).toLocaleDateString();
        // Use the draw number passed from frontend, or default to 1
        const raffleDrawNumber = drawNumber || 1;
        // Insert the notification
        const notificationQuery = `
      INSERT INTO notifications (player_id, title, message, type, is_read, created_at)
      VALUES ($1, $2, $3, $4, false, NOW() - INTERVAL '6 hours')
      RETURNING id
    `;
        const title = "🎉 Congratulations! You Won the Daily Raffle!";
        let message;
        if (customPrize && customPrize.trim()) {
            message = `Great news ${player.name}! Your ticket #${ticketNumber} won daily raffle #${raffleDrawNumber} drawn on ${formattedDate}. You won: ${customPrize.trim()}! Please contact staff to claim your prize!`;
        }
        else {
            message = `Great news ${player.name}! Your ticket #${ticketNumber} won daily raffle #${raffleDrawNumber} drawn on ${formattedDate}. Please contact staff to claim your prize!`;
        }
        const insertResult = yield pool.query(notificationQuery, [
            playerId,
            title,
            message,
            "raffle_win",
        ]);
        const notificationId = insertResult.rows[0].id;
        console.log(`Notification created with ID: ${notificationId}`);
        console.log("Raffle win notification sent successfully");
        res.json({
            success: true,
            message: "Raffle win notification sent successfully",
            notificationId: notificationId,
            playerName: player.name,
            customPrize: customPrize || null,
            drawNumber: raffleDrawNumber,
        });
    }
    catch (error) {
        console.error("Error sending raffle win notification:", error);
        res.status(500).json({
            success: false,
            error: "Failed to send notification",
        });
    }
}));
// Staff endpoints for event registration management
router.post("/staff/events/:eventId/close-registration", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { pool } = require("../config/db");
        const eventId = parseInt(req.params.eventId);
        const session = req.session;
        // Check if user is logged in as staff
        if (!(session === null || session === void 0 ? void 0 : session.user) || session.user.role !== "staff") {
            return res.status(401).json({
                success: false,
                error: "Unauthorized - Staff access required",
            });
        }
        const staffId = session.user.id;
        // Update the event to close registration
        const updateQuery = `
      UPDATE event_locations 
      SET registration_closed = true,
          registration_closed_at = now(),
          registration_closed_by = $1,
          updated_at = now()
      WHERE id = $2
      RETURNING *
    `;
        const result = yield pool.query(updateQuery, [staffId, eventId]);
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: "Event not found",
            });
        }
        res.json({
            success: true,
            message: "Event registration closed successfully",
            event: result.rows[0],
        });
    }
    catch (error) {
        console.error("Error closing event registration:", error);
        res.status(500).json({
            success: false,
            error: "Failed to close registration",
        });
    }
}));
router.post("/staff/events/:eventId/open-registration", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { pool } = require("../config/db");
        const eventId = parseInt(req.params.eventId);
        const session = req.session;
        // Check if user is logged in as staff
        if (!(session === null || session === void 0 ? void 0 : session.user) || session.user.role !== "staff") {
            return res.status(401).json({
                success: false,
                error: "Unauthorized - Staff access required",
            });
        }
        // Update the event to open registration
        const updateQuery = `
      UPDATE event_locations 
      SET registration_closed = false,
          registration_closed_at = null,
          registration_closed_by = null,
          updated_at = now()
      WHERE id = $1
      RETURNING *
    `;
        const result = yield pool.query(updateQuery, [eventId]);
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: "Event not found",
            });
        }
        res.json({
            success: true,
            message: "Event registration opened successfully",
            event: result.rows[0],
        });
    }
    catch (error) {
        console.error("Error opening event registration:", error);
        res.status(500).json({
            success: false,
            error: "Failed to open registration",
        });
    }
}));
router.get("/staff/events", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { pool } = require("../config/db");
        const session = req.session;
        // Check if user is logged in as staff
        if (!(session === null || session === void 0 ? void 0 : session.user) || session.user.role !== "staff") {
            return res.status(401).json({
                success: false,
                error: "Unauthorized - Staff access required",
            });
        }
        // Get all events with registration status and staff info
        const eventsQuery = `
      SELECT 
        el.*,
        s.name as closed_by_staff_name,
        COUNT(er.id) as total_registrations
      FROM event_locations el
      LEFT JOIN staff s ON el.registration_closed_by = s.id
      LEFT JOIN event_registrations er ON el.id = er.event_id
      WHERE el.end_date >= CURRENT_DATE
      GROUP BY el.id, s.name
      ORDER BY el.start_date ASC
    `;
        const result = yield pool.query(eventsQuery);
        res.json({
            success: true,
            events: result.rows,
        });
    }
    catch (error) {
        console.error("Error fetching events for staff:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch events",
        });
    }
}));
exports.default = router;
