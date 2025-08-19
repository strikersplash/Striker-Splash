"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../config/db");
class QueueTicket {
    // Get next ticket number without incrementing
    static async getNextTicketNumber() {
        try {
            const result = await db_1.pool.query("SELECT value FROM global_counters WHERE id = $1", ["next_queue_number"]);
            return result.rows[0].value;
        }
        catch (error) {
            console.error("Error getting next ticket number:", error);
            throw error;
        }
    }
    // Increment and get next ticket number
    static async incrementTicketNumber() {
        try {
            const result = await db_1.pool.query("UPDATE global_counters SET value = value + 1 WHERE id = $1 RETURNING value", ["next_queue_number"]);
            return result.rows[0].value;
        }
        catch (error) {
            console.error("Error incrementing ticket number:", error);
            throw error;
        }
    }
    // Add player to queue
    static async addToQueue(playerId, officialEntry = false, teamPlay = false) {
        try {
            const competitionType = teamPlay ? "team" : "individual";
            // Increment and get next ticket number
            const ticketNumber = await QueueTicket.incrementTicketNumber();
            // Create queue ticket
            await db_1.pool.query("INSERT INTO queue_tickets (ticket_number, player_id, status, competition_type, official, team_play) VALUES ($1, $2, $3, $4, $5, $6)", [
                ticketNumber,
                playerId,
                "in-queue",
                competitionType,
                officialEntry,
                teamPlay,
            ]);
            return ticketNumber;
        }
        catch (error) {
            console.error("Error adding to queue:", error);
            throw error;
        }
    }
    // Create new queue ticket
    static async create(data) {
        try {
            const { player_id, competition_type, official = true, team_play = false, } = data;
            // Increment and get next ticket number
            const ticketNumber = await QueueTicket.incrementTicketNumber();
            const result = await db_1.pool.query("INSERT INTO queue_tickets (ticket_number, player_id, status, competition_type, official, team_play) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *", [
                ticketNumber,
                player_id,
                "in-queue",
                competition_type || "accuracy",
                official,
                team_play,
            ]);
            return result.rows[0];
        }
        catch (error) {
            console.error("Error creating queue ticket:", error);
            return null;
        }
    }
    // Find ticket by ID
    static async findById(id) {
        try {
            const result = await db_1.pool.query("SELECT * FROM queue_tickets WHERE id = $1", [id]);
            return result.rows[0] || null;
        }
        catch (error) {
            console.error("Error finding queue ticket by ID:", error);
            return null;
        }
    }
    // Find active tickets for player
    static async findActiveByPlayerId(playerId) {
        try {
            const result = await db_1.pool.query("SELECT * FROM queue_tickets WHERE player_id = $1 AND status = $2 ORDER BY created_at ASC", [playerId, "in-queue"]);
            return result.rows;
        }
        catch (error) {
            console.error("Error finding active tickets for player:", error);
            return [];
        }
    }
    // Update ticket status
    static async updateStatus(id, status) {
        try {
            let query = "";
            if (status === "played") {
                query =
                    "UPDATE queue_tickets SET status = $1, played_at = NOW() WHERE id = $2 RETURNING *";
            }
            else if (status === "expired") {
                query =
                    "UPDATE queue_tickets SET status = $1, expired_at = NOW() WHERE id = $2 RETURNING *";
            }
            else {
                query =
                    "UPDATE queue_tickets SET status = $1 WHERE id = $2 RETURNING *";
            }
            const result = await db_1.pool.query(query, [status, id]);
            return result.rows[0] || null;
        }
        catch (error) {
            console.error("Error updating queue ticket status:", error);
            return null;
        }
    }
    // Get current queue position
    static async getCurrentQueuePosition() {
        try {
            const result = await db_1.pool.query("SELECT MIN(ticket_number) as current_number FROM queue_tickets WHERE status = $1", ["in-queue"]);
            return result.rows[0]?.current_number || 0;
        }
        catch (error) {
            console.error("Error getting current queue position:", error);
            return 0;
        }
    }
    // Expire all tickets at end of day
    static async expireEndOfDay() {
        try {
            // Get all in-queue tickets
            const tickets = await db_1.pool.query("SELECT * FROM queue_tickets WHERE status = $1", ["in-queue"]);
            // Update status to expired
            const result = await db_1.pool.query("UPDATE queue_tickets SET status = $1, expired_at = NOW() WHERE status = $2 RETURNING *", ["expired", "in-queue"]);
            // Return kicks to players
            for (const ticket of result.rows) {
                await db_1.pool.query("UPDATE players SET kicks_balance = kicks_balance + 5 WHERE id = $1", [ticket.player_id]);
            }
            return result.rowCount;
        }
        catch (error) {
            console.error("Error expiring tickets:", error);
            return 0;
        }
    }
}
exports.default = QueueTicket;
