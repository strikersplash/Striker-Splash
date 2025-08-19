import express from "express";

const router = express.Router();

// Test route to verify API is working
router.get("/test", (req, res) => {
  res.json({ message: "API is working", timestamp: new Date().toISOString() });
});

// Simple activity route that returns today's activities only
router.get("/activity/today", async (req, res) => {
  try {
    // Import pool here to avoid circular dependencies
    const { pool } = require("../../config/db");

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

    const result = await pool.query(query, [todayString]);
    res.json(result.rows);
  } catch (error) {
    console.error("Error getting today's activity:", error);
    res.status(500).json({ error: "Failed to get today's activity" });
  }
});

// Public events endpoint for About Us page
router.get("/public/events", async (req, res) => {
  console.log("Request received at:", new Date().toISOString());

  // First, let's try a simple response to make sure the route works
  try {
    res.json({
      success: true,
      events: [],
      debug: "Route is working but returning empty for now",
    });
  } catch (error) {
    console.error("Error in public events route:", error);
    res.status(500).json({
      success: false,
      error: "Route error",
      events: [],
    });
  }
});

// Events endpoint for logged-in users (supports player registrations)
router.get("/events/upcoming", async (req, res) => {
  console.log("Events/upcoming route hit!");

  try {
    // Import pool here to avoid circular dependencies
    const { pool } = require("../../config/db");

    // Get upcoming events (current and future events only)
    const today = new Date().toISOString().split("T")[0];
    const eventsQuery = `
      SELECT * FROM event_locations 
      WHERE end_date >= $1
      ORDER BY start_date ASC
    `;

    const eventsResult = await pool.query(eventsQuery, [today]);
    // For now, return basic structure - can be enhanced later for player-specific data
    res.json({
      success: true,
      events: eventsResult.rows,
      availableKicks: 0, // Default value
      registrations: [], // Default empty registrations
    });
  } catch (error) {
    console.error("Error fetching events for logged-in user:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch events",
      events: [],
      availableKicks: 0,
      registrations: [],
    });
  }
});

// Event registration endpoint
router.post("/events/register", async (req, res) => {
  console.log("Events/register route hit!");

  try {
    // For now, return a basic response - implement full registration logic later
    res.json({
      success: true,
      message: "Registration functionality not yet implemented",
    });
  } catch (error) {
    console.error("Error registering for event:", error);
    res.status(500).json({
      success: false,
      error: "Registration failed",
    });
  }
});

// Get player's event registrations
router.get("/events/registrations", async (req, res) => {
  console.log("Events/registrations route hit!");

  try {
    // For now, return empty registrations - implement full logic later
    res.json({
      success: true,
      registrations: [],
    });
  } catch (error) {
    console.error("Error fetching registrations:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch registrations",
      registrations: [],
    });
  }
});

// Delete event registration
router.delete("/events/registrations/:id", async (req, res) => {
  console.log("Delete registration route hit!");

  try {
    // For now, return success - implement full logic later
    res.json({
      success: true,
      message: "Registration deletion not yet implemented",
    });
  } catch (error) {
    console.error("Error deleting registration:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete registration",
    });
  }
});

export default router;
