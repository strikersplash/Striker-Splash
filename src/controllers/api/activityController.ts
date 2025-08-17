import { Request, Response } from "express";
import { pool } from "../../config/db";
import QueueTicket from "../../models/QueueTicket";

// Get today's activity
export const getTodaysActivity = async (
  req: Request,
  res: Response
): Promise<void> => {
  console.log(
    "API: getTodaysActivity called - User:",
    (req.session as any).user
  );

  try {
    console.log(
      `API: Getting today's activity using Belize timezone filtering`
    );

    // Get today's game stats with player names - use same filtering as referee controller
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
        gs.timestamp >= (NOW() AT TIME ZONE 'America/Belize')::date
        AND gs.timestamp < ((NOW() AT TIME ZONE 'America/Belize')::date + interval '1 day')
      ORDER BY 
        gs.timestamp DESC
    `;

    const result = await pool.query(query);
    console.log("API: Activity data found:", result.rows.length, "items");

    res.json(result.rows);
  } catch (error) {
    console.error("API Error getting today's activity:", error);
    res
      .status(500)
      .json({ error: "An error occurred while getting today's activity" });
  }
};

// Get current queue position
export const getCurrentQueuePosition = async (
  req: Request,
  res: Response
): Promise<void> => {
  console.log("API: getCurrentQueuePosition called");

  try {
    const currentQueuePosition = await QueueTicket.getCurrentQueuePosition();
    console.log("API: Current queue position:", currentQueuePosition);

    // Return a proper JSON object even if currentQueuePosition is null
    res.json({
      currentQueuePosition: currentQueuePosition || 0,
      success: true,
    });
  } catch (error) {
    console.error("API Error getting current queue position:", error);
    // Return a properly formatted error response
    res.status(500).json({
      error: "An error occurred while getting current queue position",
      success: false,
      currentQueuePosition: 0,
    });
  }
};

// Get queue list with player details
export const getQueueList = async (
  req: Request,
  res: Response
): Promise<void> => {
  console.log("API: getQueueList called");

  try {
    const query = `
      SELECT 
        qt.ticket_number,
        qt.player_id,
        qt.competition_type,
        qt.team_play,
        qt.status,
        qt.created_at,
        p.name as player_name,
        p.age_group
      FROM queue_tickets qt
      JOIN players p ON qt.player_id = p.id
      WHERE qt.status = 'in-queue'
      ORDER BY qt.ticket_number ASC
    `;

    const result = await pool.query(query);
    console.log("API: Found", result.rows.length, "active queue tickets");

    res.json({
      success: true,
      queue: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error("API Error getting queue list:", error);
    res.status(500).json({
      error: "An error occurred while getting queue list",
      success: false,
      queue: [],
      count: 0,
    });
  }
};

// Expire all tickets at end of day
export const expireEndOfDay = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Only allow admin to access this API
    if (
      !(req.session as any).user ||
      (req.session as any).user.role !== "admin"
    ) {
      res.status(401).json({ success: false, message: "Unauthorized access" });
      return;
    }

    const expiredCount = await QueueTicket.expireEndOfDay();

    res.json({ success: true, expiredCount });
  } catch (error) {
    console.error("Error expiring tickets:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while expiring tickets",
    });
  }
};
