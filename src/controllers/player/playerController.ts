import { Request, Response } from "express";
import { pool } from "../../config/db";
import Player from "../../models/Player";
import QueueTicket from "../../models/QueueTicket";
import QRCode from "qrcode";
import path from "path";
import fs from "fs";

// Display player dashboard
export const getDashboard = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Only allow players to access this page
    if (
      !(req.session as any).user ||
      (req.session as any).user.role !== "player"
    ) {
      req.flash("error_msg", "Unauthorized access");
      return res.redirect("/auth/login");
    }

    const loggedInPlayerId = parseInt((req.session as any).user.id);
    const { playerSlug } = req.params;

    // SECURITY FIX: Always show the logged-in player's dashboard
    // This prevents authentication bypass via name collisions
    let player;

    if (!playerSlug) {
      // No slug provided - show logged-in player's dashboard
      player = await Player.findById(loggedInPlayerId);
    } else {
      // Slug provided - verify ownership before showing dashboard
      if (!isNaN(parseInt(playerSlug))) {
        // It's a numeric ID
        const requestedPlayerId = parseInt(playerSlug);

        // SECURITY: Only allow viewing own dashboard
        if (requestedPlayerId !== loggedInPlayerId) {
          req.flash("error_msg", "You can only view your own dashboard");
          return res.redirect("/player/dashboard");
        }

        player = await Player.findById(requestedPlayerId);
      } else {
        // It's a slug - verify the slug belongs to the logged-in user
        const foundPlayer = await Player.findBySlug(playerSlug);

        if (!foundPlayer || foundPlayer.id !== loggedInPlayerId) {
          req.flash("error_msg", "You can only view your own dashboard");
          return res.redirect("/player/dashboard");
        }

        player = foundPlayer;
      }
    }

    if (!player) {
      req.flash("error_msg", "Player not found");
      return res.redirect("/auth/logout");
    }

    // Get player stats
    const statsQuery = `
      SELECT 
        COALESCE(SUM(gs.goals), 0) as total_goals,
        COALESCE(COUNT(gs.id) * 5, 0) as total_attempts
      FROM 
        game_stats gs
      WHERE 
        gs.player_id = $1
    `;

    const statsResult = await pool.query(statsQuery, [player.id]);
    const stats = statsResult.rows[0] || { total_goals: 0, total_attempts: 0 };

    // Get best consecutive kicks
    let bestConsecutiveKicks = 0;
    try {
      const consecutiveQuery = `
        SELECT 
          COALESCE(MAX(consecutive_kicks), 0) as best_consecutive
        FROM 
          game_stats
        WHERE 
          player_id = $1 
          AND consecutive_kicks IS NOT NULL
      `;

      const consecutiveResult = await pool.query(consecutiveQuery, [player.id]);
      bestConsecutiveKicks = consecutiveResult.rows[0]?.best_consecutive || 0;
    } catch (error) {
      console.error("Error fetching best consecutive kicks:", error);
      // Graceful fallback if consecutive_kicks column doesn't exist
      bestConsecutiveKicks = 0;
    }

    // Add best consecutive kicks to stats
    stats.best_consecutive_kicks = bestConsecutiveKicks;

    // Get recent activity
    let recentActivity = [];
    try {
      const activityQuery = `
        SELECT 
          gs.*,
          s.name as staff_name
        FROM 
          game_stats gs
        LEFT JOIN
          staff s ON gs.staff_id = s.id
        WHERE 
          gs.player_id = $1
        ORDER BY 
          gs.timestamp DESC
        LIMIT 5
      `;

      const activityResult = await pool.query(activityQuery, [player.id]);
      recentActivity = activityResult.rows;
    } catch (error) {
      console.error("Error fetching recent activity:", error);
    }

    // Get player's teams directly from database (now supporting multiple teams)
    let teamInfo = null;
    let allTeams = [];
    try {
      const teamQuery = `
        SELECT t.* 
        FROM teams t
        JOIN team_members tm ON t.id = tm.team_id
        WHERE tm.player_id = $1
        ORDER BY t.name ASC
      `;

      const teamResult = await pool.query(teamQuery, [player.id]);
      if (teamResult.rows.length > 0) {
        allTeams = teamResult.rows;
        teamInfo = teamResult.rows[0]; // Keep for backward compatibility
      }
    } catch (error) {
      console.error("Error fetching teams:", error);
    }

    // Get player's active queue tickets
    let activeTickets = [];
    let currentQueuePosition = null;
    try {
      // Get active tickets for this player
      const ticketsQuery = `
        SELECT * FROM queue_tickets 
        WHERE player_id = $1 AND status = 'in-queue'
        ORDER BY ticket_number ASC
      `;
      const ticketsResult = await pool.query(ticketsQuery, [player.id]);
      activeTickets = ticketsResult.rows;

      // Get current queue position (now serving)
      currentQueuePosition = await QueueTicket.getCurrentQueuePosition();
    } catch (error) {
      console.error("Error fetching queue tickets:", error);
    }

    res.render("player/dashboard", {
      title: "Player Dashboard",
      player,
      stats,
      recentActivity,
      teamInfo,
      allTeams, // Add all teams for multiple team display
      activeTickets,
      currentQueuePosition,
    });
  } catch (error) {
    console.error("Player dashboard error:", error);
    req.flash("error_msg", "An error occurred while loading the dashboard");
    res.redirect("/");
  }
};

// Display edit profile form
export const getEditProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Only allow players to access this page
    if (
      !(req.session as any).user ||
      (req.session as any).user.role !== "player"
    ) {
      req.flash("error_msg", "Unauthorized access");
      return res.redirect("/auth/login");
    }

    const playerId = parseInt((req.session as any).user.id);

    // Get player details
    const player = await Player.findById(playerId);

    if (!player) {
      req.flash("error_msg", "Player not found");
      return res.redirect("/auth/logout");
    }

    // Get age brackets
    const ageBracketsQuery = `
      SELECT * FROM age_brackets
      WHERE active = true
      ORDER BY min_age
    `;

    const ageBracketsResult = await pool.query(ageBracketsQuery);
    const ageBrackets = ageBracketsResult.rows;

    res.render("player/edit-profile", {
      title: "Edit Profile",
      player,
      ageBrackets,
    });
  } catch (error) {
    console.error("Edit profile error:", error);
    req.flash(
      "error_msg",
      "An error occurred while loading the edit profile page"
    );
    res.redirect("/player/dashboard");
  }
};

// Update player profile
export const updateProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Only allow players to access this API
    if (
      !(req.session as any).user ||
      (req.session as any).user.role !== "player"
    ) {
      req.flash("error_msg", "Unauthorized access");
      return res.redirect("/auth/login");
    }

    const playerId = parseInt((req.session as any).user.id);
    const { phone, email, residence, age_group } = req.body;

    // Validate input
    if (!phone || !residence || !age_group) {
      req.flash("error_msg", "Phone, residence, and age group are required");
      return res.redirect("/player/edit-profile");
    }

    // Update player
    const updatedPlayer = await Player.update(playerId, {
      phone,
      email: email || null,
      residence,
      age_group,
    });

    if (!updatedPlayer) {
      req.flash("error_msg", "Failed to update profile");
      return res.redirect("/player/edit-profile");
    }

    req.flash("success_msg", "Profile updated successfully");
    res.redirect("/player/dashboard");
  } catch (error) {
    console.error("Update profile error:", error);
    req.flash("error_msg", "An error occurred while updating profile");
    res.redirect("/player/edit-profile");
  }
};

// Download QR code
export const downloadQR = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Only allow players to access this API
    if (
      !(req.session as any).user ||
      (req.session as any).user.role !== "player"
    ) {
      req.flash("error_msg", "Unauthorized access");
      return res.redirect("/auth/login");
    }

    const playerId = parseInt((req.session as any).user.id);

    // Get player details
    const player = await Player.findById(playerId);

    if (!player) {
      req.flash("error_msg", "Player not found");
      return res.redirect("/auth/logout");
    }

    // Create QR code data
    const qrData = JSON.stringify({
      playerId: player.id,
      name: player.name,
      // phone: REMOVED for security,
    });

    // Generate QR code
    const qrCodeDataURL = await QRCode.toDataURL(qrData);

    // Convert data URL to buffer
    const data = qrCodeDataURL.replace(/^data:image\/png;base64,/, "");
    const buffer = Buffer.from(data, "base64");

    // Set response headers
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="qr-code-${player.id}.png"`
    );
    res.setHeader("Content-Type", "image/png");

    // Send the buffer
    res.send(buffer);
  } catch (error) {
    console.error("Download QR code error:", error);
    req.flash("error_msg", "An error occurred while downloading QR code");
    res.redirect("/player/dashboard");
  }
};

// Display QR code inline
export const displayQR = async (req: Request, res: Response): Promise<void> => {
  try {
    const playerId = parseInt(req.params.id);

    if (isNaN(playerId)) {
      res.status(400).send("Invalid player ID");
      return;
    }

    // Get player details
    const player = await Player.findById(playerId);

    if (!player) {
      res.status(404).send("Player not found");
      return;
    }

    // Generate QR code
    const qrData = JSON.stringify({
      id: player.id,
      hash: player.qr_hash,
    });

    // Generate QR code as buffer
    const qrBuffer = await QRCode.toBuffer(qrData, {
      width: 200,
      margin: 2,
    });

    // Set headers for inline display
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, max-age=3600"); // Cache for 1 hour

    // Send the buffer
    res.send(qrBuffer);
  } catch (error) {
    console.error("Display QR code error:", error);
    res.status(500).send("Error generating QR code");
  }
};

// Get queue status for player
export const getQueueStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Only allow players to access this API
    if (
      !(req.session as any).user ||
      (req.session as any).user.role !== "player"
    ) {
      res.status(401).json({ success: false, message: "Unauthorized access" });
      return;
    }

    const playerId = parseInt((req.session as any).user.id);
    // Get current queue position
    const currentQueuePosition = await QueueTicket.getCurrentQueuePosition();
    console.log(`Current queue position: ${currentQueuePosition}`);

    // Get player's active tickets
    const ticketsQuery = `
      SELECT * FROM queue_tickets 
      WHERE player_id = $1 AND status = 'in-queue'
      ORDER BY ticket_number ASC
    `;
    const ticketsResult = await pool.query(ticketsQuery, [playerId]);
    const playerTickets = ticketsResult.rows;
    const response = {
      success: true,
      currentQueuePosition,
      playerTickets,
    };
    res.json(response);
  } catch (error) {
    console.error("Queue status error:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching queue status",
    });
  }
};
