import { Request, Response } from "express";
import Player from "../../models/Player";
import QueueTicket from "../../models/QueueTicket";
import { pool } from "../../config/db";

// Display staff interface
export const getInterface = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Only allow staff to access this page
    if (
      !(req.session as any).user ||
      ((req.session as any).user.role !== "admin" &&
        (req.session as any).user.role !== "staff")
    ) {
      req.flash("error_msg", "Unauthorized access");
      return res.redirect("/auth/login");
    }

    // Get competition types
    const competitionTypesResult = await Player.query(
      "SELECT * FROM competition_types WHERE active = TRUE",
      []
    );

    const competitionTypes = competitionTypesResult.rows;

    // Get current queue position
    const currentQueuePosition = await QueueTicket.getCurrentQueuePosition();

    // Get next ticket number
    const nextTicketQuery = `
      SELECT value as next_ticket
      FROM global_counters
      WHERE id = 'next_queue_number'
    `;

    const nextTicketResult = await pool.query(nextTicketQuery);
    const nextTicket = nextTicketResult.rows[0]?.next_ticket || 1000;

    // Get ticket information for low ticket warning using same logic as ticket management
    let ticketInfo = {
      availableTickets: 0,
      ticketRange: "Not set",
      lowTicketWarning: true,
    };

    try {
      const ticketRangeQuery = `
        SELECT * FROM ticket_ranges
        ORDER BY created_at DESC
        LIMIT 1
      `;

      const rangeResult = await pool.query(ticketRangeQuery);

      if (rangeResult.rows.length > 0) {
        const ticketRangeSettings = rangeResult.rows[0];
        const startTicket = ticketRangeSettings.start_ticket;
        const endTicket = ticketRangeSettings.end_ticket;

        // Calculate available tickets the same way as ticket management page
        ticketInfo.availableTickets = Math.max(0, endTicket - nextTicket + 1);
        ticketInfo.ticketRange = `${startTicket}-${endTicket}`;
        ticketInfo.lowTicketWarning = ticketInfo.availableTickets < 50;
      } else {
        ticketInfo.availableTickets = 0;
        ticketInfo.ticketRange = "No range set";
        ticketInfo.lowTicketWarning = true;
      }
    } catch (e) {
      console.error("Error getting ticket information:", e);
      ticketInfo.availableTickets = 0;
      ticketInfo.ticketRange = "Error";
      ticketInfo.lowTicketWarning = true;
    }

    res.render("staff/interface", {
      title: "Staff Interface",
      competitionTypes,
      currentQueuePosition,
      nextTicket,
      ticketInfo,
    });
  } catch (error) {
    console.error("Staff interface error:", error);
    req.flash(
      "error_msg",
      "An error occurred while loading the staff interface"
    );
    res.redirect("/");
  }
};
