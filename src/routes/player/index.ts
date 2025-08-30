import express from "express";
import { isAuthenticated } from "../../middleware/auth";
import { pool } from "../../config/db";
import {
  getDashboard,
  getEditProfile,
  updateProfile,
  downloadQR,
  displayQR,
  getQueueStatus,
} from "../../controllers/player/playerController";
import {
  createTeam,
  getCreateTeamForm,
  browseTeams,
  joinTeam,
  leaveTeam,
  getTeamDashboard,
} from "../../controllers/teams/teamController";

const router = express.Router();

// API routes
router.get("/api/queue-status", isAuthenticated, getQueueStatus);

// Player routes
router.get(
  "/dashboard/:playerSlug?",
  (req, res, next) => {
    if (process.env.AUTH_DEBUG === "true") {
      console.log("[AUTH_DEBUG] /player/dashboard route hit", {
        sessionID: (req as any).sessionID,
        hasUser: !!(req.session as any)?.user,
        user: (req.session as any)?.user,
        serverStartTime: (req.session as any)?.serverStartTime,
      });
    }
    next();
  },
  isAuthenticated,
  getDashboard
);
router.get("/edit-profile", isAuthenticated, getEditProfile);
router.post("/update-profile", isAuthenticated, updateProfile);
router.get("/download-qr", isAuthenticated, downloadQR);

// Team routes
router.get("/teams/create", isAuthenticated, getCreateTeamForm);
router.post("/teams/create", isAuthenticated, createTeam);
router.get("/teams/browse", isAuthenticated, browseTeams);
router.post("/teams/:teamId/join", isAuthenticated, joinTeam);
router.post("/teams/leave", isAuthenticated, leaveTeam);
router.get("/team/view", isAuthenticated, getTeamDashboard);

// Notification routes
router.get("/notifications", isAuthenticated, async (req, res) => {
  try {
    const playerId = (req.session as any).user.id;

    // Create notifications table if it doesn't exist
    await pool.query(`
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

    const result = await pool.query(notificationsQuery, [playerId]);

    res.json({ success: true, notifications: result.rows });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch notifications" });
  }
});

// Mark notification as read
router.post("/notifications/:id/read", isAuthenticated, async (req, res) => {
  try {
    const playerId = (req.session as any).user.id;
    const notificationId = req.params.id;

    // Update notification
    const updateQuery = `
      UPDATE notifications
      SET is_read = true
      WHERE id = $1 AND player_id = $2
      RETURNING id
    `;

    const result = await pool.query(updateQuery, [notificationId, playerId]);

    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Notification not found" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update notification" });
  }
});

// Clear all notifications for a player
router.delete("/notifications/clear", isAuthenticated, async (req, res) => {
  try {
    const playerId = (req.session as any).user.id;

    // Delete all notifications for this player
    const deleteQuery = `
      DELETE FROM notifications
      WHERE player_id = $1
    `;

    const result = await pool.query(deleteQuery, [playerId]);

    res.json({
      success: true,
      message: `Cleared ${result.rowCount} notifications`,
      deletedCount: result.rowCount,
    });
  } catch (error) {
    console.error("Error clearing notifications:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to clear notifications" });
  }
});

export default router;
