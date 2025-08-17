import { Request, Response } from "express";
import { pool } from "../../config/db";

// Get all upcoming events for public viewing (no authentication required)
export const getPublicEvents = async (
  req: Request,
  res: Response
): Promise<void> => {
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

    const eventsResult = await pool.query(eventsQuery, [today]);
    const events = eventsResult.rows;

    res.json({
      success: true,
      events,
    });
  } catch (error) {
    console.error("Error fetching public events:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load events",
    });
  }
};
