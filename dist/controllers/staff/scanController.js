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
exports.updatePlayerName = exports.skipCurrentQueue = exports.logGoals = exports.searchPlayerByName = exports.processQRScan = void 0;
const Player_1 = __importDefault(require("../../models/Player"));
const GameStat_1 = __importDefault(require("../../models/GameStat"));
const QueueTicket_1 = __importDefault(require("../../models/QueueTicket"));
const db_1 = require("../../config/db");
// Process QR code scan
const processQRScan = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // Authentication is already handled by isStaff middleware
        // No need for additional checks here
        const { qrData } = req.body;
        if (!qrData) {
            res.status(400).json({ success: false, message: "QR data is required" });
            return;
        }
        // Parse QR data
        let parsedData;
        try {
            parsedData = JSON.parse(qrData);
        }
        catch (error) {
            res
                .status(400)
                .json({ success: false, message: "Invalid QR code format" });
            return;
        }
        // Find player by QR hash or ID
        let player;
        if (parsedData.hash) {
            player = yield Player_1.default.findByQRHash(parsedData.hash);
        }
        else if (parsedData.playerId) {
            player = yield Player_1.default.findById(parsedData.playerId);
        }
        if (!player) {
            res.status(404).json({ success: false, message: "Player not found" });
            return;
        }
        // Get active queue tickets
        const activeTickets = yield QueueTicket_1.default.findActiveByPlayerId(player.id);
        // Get today's kicks count
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const kicksResult = yield Player_1.default.query(`SELECT SUM(gs.goals) as total_kicks
       FROM game_stats gs
       WHERE gs.player_id = $1 AND gs.timestamp >= $2`, [player.id, today]);
        const todayKicks = parseInt(((_a = kicksResult.rows[0]) === null || _a === void 0 ? void 0 : _a.total_kicks) || "0");
        // Get today's first five kicks status
        const firstFiveQuery = `
      SELECT COUNT(*) as count
      FROM game_stats
      WHERE player_id = $1 
      AND timestamp >= $2
      AND first_five_kicks = true
    `;
        const firstFiveResult = yield db_1.pool.query(firstFiveQuery, [
            player.id,
            today,
        ]);
        const hasFirstFiveToday = parseInt(firstFiveResult.rows[0].count) > 0;
        res.json({
            success: true,
            player: {
                id: player.id,
                name: player.name,
                // phone: REMOVED for security
                // email: REMOVED for security
                residence: player.residence,
                city_village: player.city_village,
                gender: player.gender || "unknown",
                age_group: player.age_group,
                photo_path: player.photo_path,
                kicks_balance: player.kicks_balance || 0,
                name_locked: player.name_locked || false,
                name_change_count: player.name_change_count || 0,
                is_child_account: player.is_child_account || false,
                // parent_phone: REMOVED for security
            },
            activeTickets,
            todayKicks,
            hasFirstFiveToday,
        });
    }
    catch (error) {
        console.error("QR scan error:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while processing QR code",
        });
    }
});
exports.processQRScan = processQRScan;
// Search player by name
const searchPlayerByName = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Authentication is already handled by isStaff middleware
        // No need for additional checks here
        const { name } = req.query;
        if (!name || typeof name !== "string") {
            res.status(400).json({ success: false, message: "Name is required" });
            return;
        }
        // Find players by name
        const players = yield Player_1.default.search(name);
        if (players.length === 0) {
            res
                .status(404)
                .json({ success: false, message: "No players found with that name" });
            return;
        }
        res.json({
            success: true,
            players,
        });
    }
    catch (error) {
        console.error("Player search error:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while searching for player",
        });
    }
});
exports.searchPlayerByName = searchPlayerByName;
// Log goals
const logGoals = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Authentication is already handled by isStaff middleware
        // No need for additional checks here
        const { playerId, ticketId, goals, location, competitionType, consecutiveKicks, } = req.body;
        // Validate input
        if (!playerId ||
            !ticketId ||
            goals === undefined ||
            goals < 0 ||
            goals > 5) {
            res.status(400).json({
                success: false,
                message: "Player ID, ticket ID, and valid goals count (0-5) are required",
            });
            return;
        }
        // Validate consecutive kicks
        if (consecutiveKicks !== undefined && consecutiveKicks !== null) {
            const consKicks = parseInt(consecutiveKicks.toString());
            if (consKicks < 3) {
                res.status(400).json({
                    success: false,
                    message: "Consecutive kicks must be at least 3",
                });
                return;
            }
        }
        // Find player
        const player = yield Player_1.default.findById(parseInt(playerId));
        if (!player) {
            res.status(404).json({ success: false, message: "Player not found" });
            return;
        }
        // Find ticket
        const ticket = yield QueueTicket_1.default.findById(parseInt(ticketId));
        if (!ticket) {
            res
                .status(404)
                .json({ success: false, message: "Queue ticket not found" });
            return;
        }
        if (ticket.status !== "in-queue") {
            res
                .status(400)
                .json({ success: false, message: "Queue ticket is not active" });
            return;
        }
        // Get current queue position to validate order
        const expectedQueuePosition = yield QueueTicket_1.default.getCurrentQueuePosition();
        // Check if this ticket is the next one to be served
        if (expectedQueuePosition &&
            ticket.ticket_number !== expectedQueuePosition) {
            res.status(400).json({
                success: false,
                message: `Queue order violation: Ticket #${expectedQueuePosition} should be served first. Please either log goals for ticket #${expectedQueuePosition} or use "Skip Queue" to skip to ticket #${ticket.ticket_number}.`,
                currentTicket: expectedQueuePosition,
                requestedTicket: ticket.ticket_number,
            });
            return;
        }
        // Mark ticket as played
        const updatedTicket = yield QueueTicket_1.default.updateStatus(ticket.id, "played");
        if (!updatedTicket) {
            res
                .status(500)
                .json({ success: false, message: "Failed to update ticket status" });
            return;
        }
        // Check if this is the first five kicks today
        let isFirstFive = false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const firstFiveQuery = `
      SELECT COUNT(*) as count
      FROM game_stats
      WHERE player_id = $1 
      AND timestamp >= $2
      AND first_five_kicks = true
    `;
        const firstFiveResult = yield db_1.pool.query(firstFiveQuery, [
            player.id,
            today,
        ]);
        isFirstFive = parseInt(firstFiveResult.rows[0].count) === 0;
        // Create game stat for individual play
        // Determine if this is a competition or practice type
        // Extract from request body or ticket competition_type
        const isPracticeTicket = req.body.isCompetition === false ||
            req.body.competition_type === "practice" ||
            req.body.competition_type === "Practice" ||
            req.body.competition_type === "no-competition" ||
            req.body.kickType === "practice" ||
            ticket.competition_type === "practice" ||
            ticket.competition_type === "Practice" ||
            ticket.competition_type === "no-competition";
        // Log detailed information for debugging
        console.log("Goal logging type info:", {
            "req.body.isCompetition": req.body.isCompetition,
            "req.body.competition_type": req.body.competition_type,
            "req.body.kickType": req.body.kickType,
            "ticket.competition_type": ticket.competition_type,
            "computed isPracticeTicket": isPracticeTicket,
        });
        // For practice tickets, goals should not count towards leaderboard
        const effectiveCompetitionType = isPracticeTicket
            ? "practice"
            : "for-competition";
        // CRITICAL: Set queue ticket's 'official' flag to false for practice goals
        // This will ensure they don't show up in the leaderboard
        if (isPracticeTicket) {
            console.log("Setting ticket.official = false for practice goals");
            yield db_1.pool.query("UPDATE queue_tickets SET official = false WHERE id = $1", [ticket.id]);
        }
        const gameStat = yield GameStat_1.default.create({
            player_id: player.id,
            goals: parseInt(goals.toString()),
            staff_id: parseInt(req.session.user.id),
            location: location || "Unknown",
            competition_type: effectiveCompetitionType, // Use our computed type
            queue_ticket_id: ticket.id,
            requeued: false,
            first_five_kicks: isPracticeTicket ? false : isFirstFive, // Only count first five kicks for competition, not practice
            player_gender: player.gender,
            player_age_bracket: player.age_group,
            consecutive_kicks: consecutiveKicks && parseInt(consecutiveKicks.toString()) >= 3
                ? parseInt(consecutiveKicks.toString())
                : null,
        });
        if (!gameStat) {
            res.status(500).json({ success: false, message: "Failed to log goals" });
            return;
        }
        // Get current queue position
        const currentQueuePosition = yield QueueTicket_1.default.getCurrentQueuePosition();
        // Include the activity ID (game stat ID) in the response for better client synchronization
        const activityId = gameStat.id;
        // Individual play response
        res.json({
            activityId, // Include the activity ID
            success: true,
            gameStat,
            currentQueuePosition,
            isFirstFive,
        });
    }
    catch (error) {
        console.error("Log goals error:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while logging goals",
        });
    }
});
exports.logGoals = logGoals;
// Skip current queue position
const skipCurrentQueue = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        // Find ticket with current queue position
        const ticketQuery = `
      SELECT * FROM queue_tickets
      WHERE ticket_number = $1 AND status = 'in-queue'
      LIMIT 1
    `;
        const ticketResult = yield db_1.pool.query(ticketQuery, [currentQueuePosition]);
        if (ticketResult.rows.length === 0) {
            res
                .status(404)
                .json({ success: false, message: "Current queue ticket not found" });
            return;
        }
        const ticket = ticketResult.rows[0];
        // Mark ticket as expired
        const updatedTicket = yield QueueTicket_1.default.updateStatus(ticket.id, "expired");
        if (!updatedTicket) {
            res
                .status(500)
                .json({ success: false, message: "Failed to update ticket status" });
            return;
        }
        // Get new queue position
        const newQueuePosition = yield QueueTicket_1.default.getCurrentQueuePosition();
        res.json({
            success: true,
            message: `Skipped ticket #${currentQueuePosition}`,
            previousQueuePosition: currentQueuePosition,
            currentQueuePosition: newQueuePosition,
        });
    }
    catch (error) {
        console.error("Skip queue error:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while skipping queue position",
        });
    }
});
exports.skipCurrentQueue = skipCurrentQueue;
// Update player name (referee only, up to 2 times per player)
const updatePlayerName = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Authentication is already handled by isStaff middleware
        // No need for additional checks here
        const { playerId, name } = req.body;
        // Validate input
        if (!playerId || !name) {
            res
                .status(400)
                .json({ success: false, message: "Player ID and name are required" });
            return;
        }
        // Find player
        const player = yield Player_1.default.findById(parseInt(playerId));
        if (!player) {
            res.status(404).json({ success: false, message: "Player not found" });
            return;
        }
        // Check if name change count is already at 2
        const nameChangeCount = player.name_change_count || 0;
        if (nameChangeCount >= 2) {
            res.status(400).json({
                success: false,
                message: "Player name has already been changed twice and cannot be changed again",
            });
            return;
        }
        // Update player name and increment change count
        const updatedPlayer = yield Player_1.default.update(player.id, {
            name,
            name_locked: nameChangeCount === 1, // Lock after second change
            name_change_count: nameChangeCount + 1,
        });
        if (!updatedPlayer) {
            res
                .status(500)
                .json({ success: false, message: "Failed to update player name" });
            return;
        }
        res.json({
            success: true,
            player: updatedPlayer,
            remainingChanges: 2 - (nameChangeCount + 1),
        });
    }
    catch (error) {
        console.error("Update player name error:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while updating player name",
        });
    }
});
exports.updatePlayerName = updatePlayerName;
