import { Request, Response } from "express";
import { pool } from "../../config/db";
import QueueTicket from "../../models/QueueTicket";

// Get all registered players for an event who don't have queue tickets yet
export const getRegisteredPlayersForEvent = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log("getRegisteredPlayersForEvent called with params:", req.params);
    const { eventId } = req.params;

    if (!eventId) {
      console.log("Event ID is missing in the request");
      res.status(400).json({
        success: false,
        message: "Event ID is required",
      });
      return;
    }

    console.log("Looking for event with ID:", eventId);

    // Get event information first
    const eventQuery = `
      SELECT * FROM event_locations WHERE id = $1
    `;
    const eventResult = await pool.query(eventQuery, [eventId]);

    if (eventResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "Event not found",
      });
      return;
    }

    const event = eventResult.rows[0];

    // Get registered players for this event who don't have queue tickets assigned yet
    const registrationsQuery = `
      SELECT 
        er.id as registration_id, 
        er.player_id, 
        er.registration_number,
        er.kicks_requested,
        er.is_competition,
        er.registration_date,
        er.queue_ticket_id,
        p.name as player_name,
        p.phone,
        p.photo_path,
        p.age_group
      FROM event_registrations er
      JOIN players p ON er.player_id = p.id
      WHERE er.event_id = $1 AND er.queue_ticket_id IS NULL
      ORDER BY er.registration_number ASC
    `;

    const registrationsResult = await pool.query(registrationsQuery, [eventId]);

    res.json({
      success: true,
      event,
      registrations: registrationsResult.rows,
    });
  } catch (error) {
    console.error("Error getting registered players for event:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get registered players",
    });
  }
};

// Assign queue tickets to registered players for an event
export const assignTicketsToRegisteredPlayers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { eventId } = req.params;
    const { registrationIds } = req.body;

    if (
      !eventId ||
      !registrationIds ||
      !Array.isArray(registrationIds) ||
      registrationIds.length === 0
    ) {
      res.status(400).json({
        success: false,
        message: "Event ID and at least one registration ID are required",
      });
      return;
    }

    // Begin transaction
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const assignedTickets = [];

      // Process each registration
      for (const registrationId of registrationIds) {
        // Get registration details
        const registrationQuery = `
          SELECT er.*, p.name as player_name
          FROM event_registrations er
          JOIN players p ON er.player_id = p.id
          WHERE er.id = $1
        `;
        const registrationResult = await client.query(registrationQuery, [
          registrationId,
        ]);

        if (registrationResult.rows.length === 0) {
          continue; // Skip if registration not found
        }

        const registration = registrationResult.rows[0];

        // Check if this registration already has a ticket
        if (registration.queue_ticket_id) {
          continue; // Skip if already has a ticket
        }

        // Create a new queue ticket
        const competitionType = registration.is_competition
          ? "for-competition"
          : "practice";
        const newTicket = await QueueTicket.create({
          player_id: registration.player_id,
          competition_type: competitionType,
          official: true,
        });

        if (!newTicket) {
          throw new Error(
            `Failed to create ticket for player ${registration.player_name}`
          );
        }

        // Update the registration with ticket ID
        const updateQuery = `
          UPDATE event_registrations
          SET queue_ticket_id = $1
          WHERE id = $2
          RETURNING *
        `;

        await client.query(updateQuery, [newTicket.id, registrationId]);

        // Add notification for the player
        const notificationQuery = `
          INSERT INTO notifications
          (player_id, title, message, type, created_at, is_read)
          VALUES ($1, $2, $3, $4, NOW(), false)
        `;

        await client.query(notificationQuery, [
          registration.player_id,
          `Ticket Assigned`,
          `Your queue ticket #${newTicket.ticket_number} has been assigned for your event registration.`,
          "ticket_assigned",
        ]);

        assignedTickets.push({
          registrationId: registrationId,
          playerId: registration.player_id,
          playerName: registration.player_name,
          ticketNumber: newTicket.ticket_number,
        });
      }

      await client.query("COMMIT");

      res.json({
        success: true,
        message: `Successfully assigned ${assignedTickets.length} tickets`,
        assignedTickets,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error assigning tickets to registered players:", error);
    res.status(500).json({
      success: false,
      message: "Failed to assign tickets to registered players",
    });
  }
};

// Get all events with registered players
export const getEventsWithRegistrations = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log("getEventsWithRegistrations called");

    // Manually calculate Belize time (UTC-6) - same fix as public API
    const now = new Date();
    const belizeTime = new Date(now.getTime() - 6 * 60 * 60 * 1000); // Subtract 6 hours for UTC-6
    const today = belizeTime.toISOString().split("T")[0];
    console.log("Using Belize date for staff events filter:", today);

    // Get events with count of registered players
    const eventsQuery = `
      SELECT 
        el.id, 
        el.name, 
        el.address, 
        el.start_date, 
        el.end_date,
        COALESCE(COUNT(er.id), 0) as total_registrations,
        COALESCE(SUM(CASE WHEN er.id IS NOT NULL AND er.queue_ticket_id IS NULL THEN 1 ELSE 0 END), 0) as pending_ticket_assignments
      FROM event_locations el
      LEFT JOIN event_registrations er ON el.id = er.event_id
      WHERE el.end_date >= $1
      GROUP BY el.id
      ORDER BY el.start_date ASC
    `;

    const eventsResult = await pool.query(eventsQuery, [today]);

    console.log("Events found:", eventsResult.rows.length);

    res.json({
      success: true,
      events: eventsResult.rows,
    });
  } catch (error) {
    console.error("Error getting events with registrations:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get events with registrations",
    });
  }
};
