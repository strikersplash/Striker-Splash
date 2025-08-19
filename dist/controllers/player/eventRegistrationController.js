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
exports.cancelEventRegistration = exports.getPlayerEventRegistrations = exports.registerForEvent = exports.getUpcomingEvents = void 0;
const db_1 = require("../../config/db");
// Get all upcoming events
const getUpcomingEvents = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
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
        // Get player's available kicks from their balance
        const playerId = req.session.user.id;
        const kicksQuery = `
      SELECT kicks_balance
      FROM players
      WHERE id = $1
    `;
        const kicksResult = yield db_1.pool.query(kicksQuery, [playerId]);
        const availableKicks = parseInt(((_a = kicksResult.rows[0]) === null || _a === void 0 ? void 0 : _a.kicks_balance) || "0", 10);
        // Get player's existing registrations
        const registrationsQuery = `
      SELECT er.*, el.name, el.start_date, el.end_date, el.event_type
      FROM event_registrations er
      JOIN event_locations el ON er.event_id = el.id
      WHERE er.player_id = $1
    `;
        const registrationsResult = yield db_1.pool.query(registrationsQuery, [
            playerId,
        ]);
        const registrations = registrationsResult.rows;
        res.json({
            success: true,
            events,
            availableKicks,
            registrations,
        });
    }
    catch (error) {
        console.error("Error fetching upcoming events:", error);
        res.status(500).json({
            success: false,
            message: "Failed to load events",
        });
    }
});
exports.getUpcomingEvents = getUpcomingEvents;
// Register for an event
const registerForEvent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const playerId = req.session.user.id;
        const { eventId, kicksRequested, isCompetition } = req.body;
        // Validate input
        if (!eventId || !kicksRequested || kicksRequested < 1) {
            res.status(400).json({
                success: false,
                message: "Event ID and number of kicks are required",
            });
            return;
        }
        // Check if the event exists and is still available
        // Manually calculate Belize time (UTC-6)
        const now = new Date();
        const belizeTime = new Date(now.getTime() - 6 * 60 * 60 * 1000);
        const today = belizeTime.toISOString().split("T")[0];
        const eventQuery = `
      SELECT * FROM event_locations 
      WHERE id = $1 AND end_date >= $2
    `;
        const eventResult = yield db_1.pool.query(eventQuery, [eventId, today]);
        const event = eventResult.rows[0];
        if (!event) {
            res.status(404).json({
                success: false,
                message: "Event not found or has ended",
            });
            return;
        }
        // Check if kicks requested is within max allowed
        if (kicksRequested > event.max_kicks) {
            res.status(400).json({
                success: false,
                message: `Maximum ${event.max_kicks} kicks allowed for this event`,
            });
            return;
        }
        // Check if player is already registered
        const existingRegQuery = `
      SELECT * FROM event_registrations 
      WHERE event_id = $1 AND player_id = $2
    `;
        const existingRegResult = yield db_1.pool.query(existingRegQuery, [
            eventId,
            playerId,
        ]);
        if (existingRegResult.rows.length > 0) {
            res.status(400).json({
                success: false,
                message: "You are already registered for this event",
            });
            return;
        }
        // Calculate kicks required
        const kicksRequired = kicksRequested;
        // Check if player has enough kicks in their balance
        const playerQuery = `
      SELECT kicks_balance, name
      FROM players
      WHERE id = $1
    `;
        const playerResult = yield db_1.pool.query(playerQuery, [playerId]);
        const kicksBalance = parseInt(((_a = playerResult.rows[0]) === null || _a === void 0 ? void 0 : _a.kicks_balance) || "0", 10);
        const playerName = ((_b = playerResult.rows[0]) === null || _b === void 0 ? void 0 : _b.name) || "Player";
        if (kicksBalance < kicksRequired) {
            res.status(400).json({
                success: false,
                message: `Not enough kicks. You need ${kicksRequired} kicks but have only ${kicksBalance} in your balance`,
            });
            return;
        }
        // Begin transaction
        const client = yield db_1.pool.connect();
        try {
            yield client.query("BEGIN");
            // Deduct kicks from player's balance
            const updateKicksQuery = `
        UPDATE players
        SET kicks_balance = kicks_balance - $1
        WHERE id = $2
        RETURNING kicks_balance
      `;
            const kicksUpdateResult = yield client.query(updateKicksQuery, [
                kicksRequired,
                playerId,
            ]);
            if (!kicksUpdateResult.rows[0]) {
                throw new Error("Failed to update kicks balance");
            }
            const updatedKicksBalance = kicksUpdateResult.rows[0].kicks_balance;
            // Register for event and assign a registration number
            const registerQuery = `
        INSERT INTO event_registrations 
        (event_id, player_id, kicks_requested, is_competition, tickets_used, registration_number) 
        VALUES ($1, $2, $3, $4, $5, 
          (SELECT COALESCE(MAX(registration_number), 0) + 1 
           FROM event_registrations 
           WHERE event_id = $1))
        RETURNING id, registration_number
      `;
            const registerResult = yield client.query(registerQuery, [
                eventId,
                playerId,
                kicksRequested,
                isCompetition || false,
                kicksRequired, // Using kicks as tickets for compatibility
            ]);
            // Insert a notification for the player
            const notificationQuery = `
        INSERT INTO notifications
        (player_id, title, message, type, created_at, is_read)
        VALUES ($1, $2, $3, $4, NOW(), false)
      `;
            yield client.query(notificationQuery, [
                playerId,
                `Event Registration Confirmed`,
                `You have successfully registered for "${event.name}". Your registration number is #${registerResult.rows[0].registration_number}. Visit the event to get your queue ticket assigned by staff.`,
                "event_registration",
            ]);
            yield client.query("COMMIT");
            res.json({
                success: true,
                message: "Successfully registered for the event",
                registrationId: registerResult.rows[0].id,
                registrationNumber: registerResult.rows[0].registration_number,
                kicksUsed: kicksRequired,
                remainingKicks: updatedKicksBalance,
            });
        }
        catch (err) {
            yield client.query("ROLLBACK");
            throw err;
        }
        finally {
            client.release();
        }
    }
    catch (error) {
        console.error("Error registering for event:", error);
        res.status(500).json({
            success: false,
            message: "Failed to register for event",
        });
    }
});
exports.registerForEvent = registerForEvent;
// Get player event registrations
const getPlayerEventRegistrations = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const playerId = req.session.user.id;
        const registrationsQuery = `
      SELECT er.*, el.name, el.address, el.start_date, el.end_date, el.event_type, el.description
      FROM event_registrations er
      JOIN event_locations el ON er.event_id = el.id
      WHERE er.player_id = $1
      ORDER BY el.start_date ASC
    `;
        const registrationsResult = yield db_1.pool.query(registrationsQuery, [
            playerId,
        ]);
        const registrations = registrationsResult.rows;
        res.json({
            success: true,
            registrations,
        });
    }
    catch (error) {
        console.error("Error fetching player registrations:", error);
        res.status(500).json({
            success: false,
            message: "Failed to load your event registrations",
        });
    }
});
exports.getPlayerEventRegistrations = getPlayerEventRegistrations;
// Cancel event registration
const cancelEventRegistration = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const playerId = req.session.user.id;
        const { registrationId } = req.params;
        // Check if registration exists and belongs to player
        const regQuery = `
      SELECT * FROM event_registrations 
      WHERE id = $1 AND player_id = $2
    `;
        const regResult = yield db_1.pool.query(regQuery, [registrationId, playerId]);
        if (regResult.rows.length === 0) {
            res.status(404).json({
                success: false,
                message: "Registration not found",
            });
            return;
        }
        const registration = regResult.rows[0];
        // Check if event is in the future
        const eventQuery = `
      SELECT start_date FROM event_locations WHERE id = $1
    `;
        const eventResult = yield db_1.pool.query(eventQuery, [registration.event_id]);
        const eventStartDate = new Date(eventResult.rows[0].start_date);
        const today = new Date();
        if (eventStartDate <= today) {
            res.status(400).json({
                success: false,
                message: "Cannot cancel registration for an event that has started or ended",
            });
            return;
        }
        // Begin transaction
        const client = yield db_1.pool.connect();
        try {
            yield client.query("BEGIN");
            // Delete the registration
            yield client.query("DELETE FROM event_registrations WHERE id = $1", [
                registrationId,
            ]);
            // Return tickets to player
            yield client.query(`
        INSERT INTO queue_tickets (player_id, status)
        SELECT $1, 'available' FROM generate_series(1, $2)
      `, [playerId, registration.tickets_used]);
            yield client.query("COMMIT");
            res.json({
                success: true,
                message: "Registration cancelled and tickets refunded",
                ticketsRefunded: registration.tickets_used,
            });
        }
        catch (err) {
            yield client.query("ROLLBACK");
            throw err;
        }
        finally {
            client.release();
        }
    }
    catch (error) {
        console.error("Error cancelling registration:", error);
        res.status(500).json({
            success: false,
            message: "Failed to cancel registration",
        });
    }
});
exports.cancelEventRegistration = cancelEventRegistration;
