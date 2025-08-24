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
const db_1 = require("../../config/db");
const auth_1 = require("../../middleware/auth");
const QueueTicket_1 = __importDefault(require("../../models/QueueTicket"));
const transactionController_1 = require("../../controllers/cashier/transactionController");
const router = express_1.default.Router();
// API routes
router.get("/api/search", auth_1.isCashierAPI, transactionController_1.searchPlayer);
// Lightweight player contact info endpoint (alternate approach)
router.get("/api/player-contact/:id", auth_1.isCashierAPI, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ success: false, message: "Invalid id" });
        }
        const result = yield db_1.pool.query("SELECT id, name, phone, residence, city_village, parent_phone, email FROM players WHERE id=$1 AND deleted_at IS NULL", [id]);
        if (result.rows.length === 0) {
            return res
                .status(404)
                .json({ success: false, message: "Player not found" });
        }
        res.locals.skipSanitize = true;
        res.json({ success: true, player: result.rows[0] });
    }
    catch (e) {
        console.error("Player contact endpoint error", e);
        res.status(500).json({ success: false, message: "Server error" });
    }
}));
// Raw search debug endpoint (returns raw DB payload) - DO NOT enable in production without auth
router.get("/api/search-raw", auth_1.isCashierAPI, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { query } = req.query;
        if (!query || typeof query !== "string") {
            return res
                .status(400)
                .json({ success: false, message: "Search query is required" });
        }
        const { rows } = yield db_1.pool.query("SELECT id, name, phone, residence, city_village, parent_phone, email FROM players WHERE (name ILIKE $1 OR phone LIKE $1 OR email ILIKE $1) AND deleted_at IS NULL LIMIT 5", [`%${query}%`]);
        res.locals.skipSanitize = true;
        res.json({ success: true, rows });
    }
    catch (e) {
        console.error("search-raw error", e);
        res.status(500).json({ success: false, message: "Error" });
    }
}));
router.get("/api/search-teams", auth_1.isCashierAPI, transactionController_1.searchTeams);
router.post("/api/scan", auth_1.isCashierAPI, transactionController_1.processQRScan);
router.post("/api/purchase-kicks", auth_1.isCashierAPI, transactionController_1.processKicksPurchase);
router.post("/api/sell-kicks-team", auth_1.isCashierAPI, transactionController_1.processPurchaseKicksTeam);
router.post("/api/requeue", auth_1.isCashierAPI, transactionController_1.processReQueue);
router.post("/api/requeue-team", auth_1.isCashierAPI, transactionController_1.processRequeueTeam);
router.get("/api/queue-status", auth_1.isCashierAPI, transactionController_1.getQueueStatus);
router.get("/api/transactions/today", auth_1.isCashierAPI, transactionController_1.getTodaysTransactions);
// Debug endpoint to check transactions
router.get("/api/debug/transactions", auth_1.isCashierAPI, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = parseInt(req.session.user.id); // Convert string to integer
        const userRole = req.session.user.role;
        // Get today's date in Belize timezone (UTC-6) to match other queries
        const centralTimeQuery = `SELECT (NOW() - interval '6 hours')::date as today`;
        const centralTimeResult = yield db_1.pool.query(centralTimeQuery);
        const today = centralTimeResult.rows[0].today.toISOString().split("T")[0];
        // Get all today's transactions using Central timezone range converted to UTC
        const allTransactionsQuery = `
      SELECT t.id, t.player_id, t.staff_id, t.kicks, t.amount, t.created_at, 
             p.name as player_name, s.name as staff_name, s.role as staff_role
      FROM transactions t 
      LEFT JOIN players p ON t.player_id = p.id
      LEFT JOIN staff s ON t.staff_id = s.id
      WHERE t.created_at >= timezone('UTC', ($1::date)::timestamp)
        AND t.created_at < timezone('UTC', ($1::date + interval '1 day')::timestamp)
      ORDER BY t.created_at DESC
    `;
        const allTransactions = yield db_1.pool.query(allTransactionsQuery, [today]);
        // Get transactions for this user using Central timezone range converted to UTC
        const userTransactionsQuery = `
      SELECT t.id, t.player_id, t.staff_id, t.kicks, t.amount, t.created_at,
             p.name as player_name, s.name as staff_name, s.role as staff_role
      FROM transactions t 
      LEFT JOIN players p ON t.player_id = p.id
      LEFT JOIN staff s ON t.staff_id = s.id
      WHERE t.created_at >= timezone('UTC', ($1::date)::timestamp)
        AND t.created_at < timezone('UTC', ($1::date + interval '1 day')::timestamp)
        AND t.staff_id = $2
      ORDER BY t.created_at DESC
    `;
        const userTransactions = yield db_1.pool.query(userTransactionsQuery, [
            today,
            userId,
        ]);
        res.json({
            userId,
            userRole,
            today,
            allTransactionsCount: allTransactions.rows.length,
            userTransactionsCount: userTransactions.rows.length,
            allTransactions: allTransactions.rows,
            userTransactions: userTransactions.rows,
        });
    }
    catch (error) {
        console.error("Debug endpoint error:", error);
        res.status(500).json({
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
}));
// Root route for cashier - allow access for staff
router.get("/", (req, res) => {
    res.redirect("/cashier/interface");
});
// Cashier interface - allow access for staff and cashier
router.get("/interface", transactionController_1.getCashierInterface);
// Process kick sales
// Requeue player (using existing kicks balance)
router.post("/requeue", auth_1.isCashier, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const client = yield db_1.pool.connect();
    try {
        yield client.query("BEGIN");
        const { playerId, kicks, officialEntry, teamPlay } = req.body;
        // Validate input
        if (!playerId || !kicks) {
            return res.status(400).json({
                success: false,
                message: "Player ID and kicks are required",
            });
        }
        const kicksInt = parseInt(kicks);
        const playerIdInt = parseInt(playerId);
        if (kicksInt < 1) {
            return res.status(400).json({
                success: false,
                message: "Kicks must be at least 1",
            });
        }
        // Check if player exists and has enough kicks (exclude deleted players)
        const playerCheck = yield client.query("SELECT * FROM players WHERE id = $1 AND deleted_at IS NULL", [playerIdInt]);
        if (playerCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Player not found or account inactive",
            });
        }
        const player = playerCheck.rows[0];
        // Check kicks balance
        if (player.kicks_balance < kicksInt) {
            return res.status(400).json({
                success: false,
                message: `Player only has ${player.kicks_balance} kicks but trying to use ${kicksInt}.`,
            });
        }
        // Deduct kicks from player's balance
        yield client.query("UPDATE players SET kicks_balance = kicks_balance - $1 WHERE id = $2", [kicksInt, playerIdInt]);
        // Create queue ticket
        const ticketNumber = yield QueueTicket_1.default.addToQueue(playerIdInt, officialEntry === true, teamPlay === true);
        // Record transaction with zero amount using proper Belize timezone (UTC-6)
        yield client.query("INSERT INTO transactions (player_id, kicks, amount, team_play, created_at) VALUES ($1, $2, $3, $4, (NOW() - interval '6 hours')::timestamp AT TIME ZONE 'UTC')", [playerIdInt, kicksInt, 0, teamPlay === true]);
        // Get next ticket number
        const nextTicket = yield QueueTicket_1.default.getNextTicketNumber();
        yield client.query("COMMIT");
        res.json({
            success: true,
            message: "Player requeued successfully",
            ticketNumber: ticketNumber,
            nextTicket: nextTicket,
        });
    }
    catch (error) {
        yield client.query("ROLLBACK");
        console.error("Error requeuing player:", error);
        res.status(500).json({
            success: false,
            message: "Failed to requeue player",
        });
    }
    finally {
        client.release();
    }
}));
router.post("/sell-kicks", auth_1.isCashier, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Debug mode - just return request details
    if (req.body.debug) {
        return res.status(200).send("Debug info logged to server console");
    }
    const client = yield db_1.pool.connect();
    try {
        yield client.query("BEGIN");
        const { playerId, kicks, amount, addToQueue, officialEntry, teamPlay } = req.body;
        // Validate input
        if (!playerId || !kicks || !amount) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields",
            });
        }
        if (kicks < 1 || amount < 1) {
            return res.status(400).json({
                success: false,
                message: "Invalid kicks or amount",
            });
        }
        // Check if player exists (exclude deleted players)
        const playerCheck = yield client.query("SELECT * FROM players WHERE id = $1 AND deleted_at IS NULL", [playerId]);
        if (playerCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Player not found or account inactive",
            });
        }
        const player = playerCheck.rows[0];
        // Create transaction record
        const userId = parseInt(req.session.user.id); // Convert string to integer
        const transactionQuery = `
      INSERT INTO transactions (player_id, kicks, amount, team_play, staff_id, created_at)
      VALUES ($1, $2, $3, $4, $5, (NOW() - interval '6 hours')::timestamp AT TIME ZONE 'UTC')
      RETURNING id
    `;
        const transactionResult = yield client.query(transactionQuery, [
            playerId,
            kicks,
            amount,
            teamPlay || false,
            userId,
        ]);
        // Update player's kicks balance
        const updateBalanceQuery = `
      UPDATE players 
      SET kicks_balance = COALESCE(kicks_balance, 0) + $1,
          updated_at = NOW()
      WHERE id = $2
    `;
        yield client.query(updateBalanceQuery, [kicks, playerId]);
        let ticketNumber = null;
        let nextTicket = null;
        // Add to queue if requested
        if (addToQueue) {
            try {
                ticketNumber = yield QueueTicket_1.default.addToQueue(playerId, officialEntry, teamPlay);
                // Get the next ticket number without incrementing
                nextTicket = yield QueueTicket_1.default.getNextTicketNumber();
            }
            catch (queueError) {
                console.error("Queue error:", queueError);
                // Don't fail the entire transaction if queue fails
            }
        }
        yield client.query("COMMIT");
        res.json({
            success: true,
            message: "Sale completed successfully",
            ticketNumber: ticketNumber,
            nextTicket: nextTicket,
            transactionId: transactionResult.rows[0].id,
        });
    }
    catch (error) {
        yield client.query("ROLLBACK");
        console.error("Error processing sale - DETAILED ERROR:", error);
        console.error("Request body:", JSON.stringify(req.body));
        console.error("User session:", JSON.stringify(req.session.user));
        if (error instanceof Error) {
            console.error("Error name:", error.name);
            console.error("Error message:", error.message);
            console.error("Error stack:", error.stack);
        }
        res.status(500).json({
            success: false,
            message: "Failed to process sale: " +
                (error instanceof Error ? error.message : "Unknown error"),
        });
    }
    finally {
        client.release();
    }
}));
// Get player profile with picture
router.get("/player/:id", auth_1.isCashier, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const playerId = req.params.id;
        const query = `
      SELECT 
        p.*,
        COALESCE(p.kicks_balance, 0) as kicks_balance
      FROM players p
      WHERE p.id = $1
    `;
        const result = yield db_1.pool.query(query, [playerId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Player not found" });
        }
        const player = result.rows[0];
        // Add full photo URL if photo_path exists
        if (player.photo_path) {
            player.photoUrl = `/uploads/${player.photo_path}`;
        }
        res.json(player);
    }
    catch (error) {
        console.error("Error fetching player:", error);
        res.status(500).json({ error: "Failed to fetch player" });
    }
}));
exports.default = router;
