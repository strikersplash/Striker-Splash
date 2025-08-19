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
const auth_1 = require("../../middleware/auth");
const db_1 = require("../../config/db");
const playerController_1 = require("../../controllers/player/playerController");
const teamController_1 = require("../../controllers/teams/teamController");
const router = express_1.default.Router();
// API routes
router.get("/api/queue-status", auth_1.isAuthenticated, playerController_1.getQueueStatus);
// Player routes
router.get("/dashboard/:playerSlug?", auth_1.isAuthenticated, playerController_1.getDashboard);
router.get("/edit-profile", auth_1.isAuthenticated, playerController_1.getEditProfile);
router.post("/update-profile", auth_1.isAuthenticated, playerController_1.updateProfile);
router.get("/download-qr", auth_1.isAuthenticated, playerController_1.downloadQR);
// Team routes
router.get("/teams/create", auth_1.isAuthenticated, teamController_1.getCreateTeamForm);
router.post("/teams/create", auth_1.isAuthenticated, teamController_1.createTeam);
router.get("/teams/browse", auth_1.isAuthenticated, teamController_1.browseTeams);
router.post("/teams/:teamId/join", auth_1.isAuthenticated, teamController_1.joinTeam);
router.post("/teams/leave", auth_1.isAuthenticated, teamController_1.leaveTeam);
router.get("/team/view", auth_1.isAuthenticated, teamController_1.getTeamDashboard);
// Notification routes
router.get("/notifications", auth_1.isAuthenticated, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const playerId = req.session.user.id;
        // Create notifications table if it doesn't exist
        yield db_1.pool.query(`
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
        const notificationsQuery = `
      SELECT *
      FROM notifications
      WHERE player_id = $1
      ORDER BY created_at DESC
      LIMIT 20
    `;
        const result = yield db_1.pool.query(notificationsQuery, [playerId]);
        res.json({ success: true, notifications: result.rows });
    }
    catch (error) {
        console.error("Error fetching notifications:", error);
        res
            .status(500)
            .json({ success: false, message: "Failed to fetch notifications" });
    }
}));
// Mark notification as read
router.post("/notifications/:id/read", auth_1.isAuthenticated, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const playerId = req.session.user.id;
        const notificationId = req.params.id;
        // Update notification
        const updateQuery = `
      UPDATE notifications
      SET is_read = true
      WHERE id = $1 AND player_id = $2
      RETURNING id
    `;
        const result = yield db_1.pool.query(updateQuery, [notificationId, playerId]);
        if (result.rowCount === 0) {
            return res
                .status(404)
                .json({ success: false, message: "Notification not found" });
        }
        res.json({ success: true });
    }
    catch (error) {
        console.error("Error marking notification as read:", error);
        res
            .status(500)
            .json({ success: false, message: "Failed to update notification" });
    }
}));
// Clear all notifications for a player
router.delete("/notifications/clear", auth_1.isAuthenticated, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const playerId = req.session.user.id;
        // Delete all notifications for this player
        const deleteQuery = `
      DELETE FROM notifications
      WHERE player_id = $1
    `;
        const result = yield db_1.pool.query(deleteQuery, [playerId]);
        res.json({
            success: true,
            message: `Cleared ${result.rowCount} notifications`,
            deletedCount: result.rowCount,
        });
    }
    catch (error) {
        console.error("Error clearing notifications:", error);
        res
            .status(500)
            .json({ success: false, message: "Failed to clear notifications" });
    }
}));
exports.default = router;
