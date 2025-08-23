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
exports.skipQueue = exports.logGoal = exports.getRefereeInterface = void 0;
const db_1 = require("../../config/db");
const QueueTicket_1 = __importDefault(require("../../models/QueueTicket"));
// Display referee interface
const getRefereeInterface = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Authentication is already handled by isStaff middleware
        // No need for additional checks here
        // Get current queue position
        const currentQueuePosition = yield QueueTicket_1.default.getCurrentQueuePosition();
        res.render("referee/interface", {
            title: "Referee Interface",
            currentQueuePosition,
        });
    }
    catch (error) {
        console.error("Referee interface error:", error);
        req.flash("error_msg", "An error occurred while loading the referee interface");
        res.redirect("/staff/interface");
    }
});
exports.getRefereeInterface = getRefereeInterface;
// Log goal
const logGoal = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Authentication is already handled by isStaff middleware
        // No need for additional checks here
        const { playerId, ticketId, goals, location, teamPlay } = req.body;
        // Validate input
        if (!playerId || !ticketId || goals === undefined || !location) {
            res
                .status(400)
                .json({
                success: false,
                message: "Player ID, ticket ID, goals, and location are required",
            });
            return;
        }
        // Check if ticket is valid
        const ticketQuery = "SELECT * FROM queue_tickets WHERE id = $1";
        const ticketResult = yield db_1.pool.query(ticketQuery, [ticketId]);
        if (ticketResult.rows.length === 0) {
            res.status(404).json({ success: false, message: "Ticket not found" });
            return;
        }
        const ticket = ticketResult.rows[0];
        if (ticket.status !== "in-queue") {
            res
                .status(400)
                .json({ success: false, message: "Ticket is not in queue" });
            return;
        }
        if (parseInt(ticket.player_id) !== parseInt(playerId)) {
            res
                .status(400)
                .json({
                success: false,
                message: "Ticket does not belong to this player",
            });
            return;
        }
        // Insert game stats
        const insertQuery = `
      INSERT INTO game_stats (player_id, staff_id, goals, location, queue_ticket_id, team_play, session_date)
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE)
      RETURNING *
    `;
        const insertResult = yield db_1.pool.query(insertQuery, [
            playerId,
            req.session.user.id,
            goals,
            location,
            ticketId,
            teamPlay === "true" || teamPlay === true,
        ]);
        const gameStat = insertResult.rows[0];
        // Update ticket status
        const updateQuery = `
      UPDATE queue_tickets
      SET status = 'played', played_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
        yield db_1.pool.query(updateQuery, [ticketId]);
        // Get current queue position
        const currentQueuePosition = yield QueueTicket_1.default.getCurrentQueuePosition();
        res.json({
            success: true,
            gameStat,
            currentQueuePosition,
        });
    }
    catch (error) {
        console.error("Log goal error:", error);
        res
            .status(500)
            .json({
            success: false,
            message: "An error occurred while logging goal",
        });
    }
});
exports.logGoal = logGoal;
// Skip queue
const skipQueue = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Authentication is already handled by isStaff middleware
        // No need for additional checks here
        // Get current queue position
        const currentQueuePosition = yield QueueTicket_1.default.getCurrentQueuePosition();
        if (!currentQueuePosition) {
            res
                .status(400)
                .json({ success: false, message: "No active tickets in queue" });
            return;
        }
        // Get ticket ID
        const ticketQuery = `
      SELECT id
      FROM queue_tickets
      WHERE ticket_number = $1 AND status = 'in-queue'
    `;
        const ticketResult = yield db_1.pool.query(ticketQuery, [currentQueuePosition]);
        if (ticketResult.rows.length === 0) {
            res.status(404).json({ success: false, message: "Ticket not found" });
            return;
        }
        const ticketId = ticketResult.rows[0].id;
        // Update ticket status
        const updateQuery = `
      UPDATE queue_tickets
      SET status = 'skipped', played_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
        yield db_1.pool.query(updateQuery, [ticketId]);
        // Get new current queue position
        const newQueuePosition = yield QueueTicket_1.default.getCurrentQueuePosition();
        res.json({
            success: true,
            message: "Queue position skipped successfully",
            currentQueuePosition: newQueuePosition,
        });
    }
    catch (error) {
        console.error("Skip queue error:", error);
        res
            .status(500)
            .json({
            success: false,
            message: "An error occurred while skipping queue",
        });
    }
});
exports.skipQueue = skipQueue;
