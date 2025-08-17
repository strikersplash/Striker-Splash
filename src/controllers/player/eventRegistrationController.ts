import { Request, Response } from "express";
import { pool } from "../../config/db";

// Get all upcoming events
export const getUpcomingEvents = async (
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

    // Get player's available kicks from their balance
    const playerId = (req.session as any).user.id;
    const kicksQuery = `
      SELECT kicks_balance
      FROM players
      WHERE id = $1
    `;

    const kicksResult = await pool.query(kicksQuery, [playerId]);
    const availableKicks = parseInt(
      kicksResult.rows[0]?.kicks_balance || "0",
      10
    );

    // Get player's existing registrations
    const registrationsQuery = `
      SELECT er.*, el.name, el.start_date, el.end_date, el.event_type
      FROM event_registrations er
      JOIN event_locations el ON er.event_id = el.id
      WHERE er.player_id = $1
    `;

    const registrationsResult = await pool.query(registrationsQuery, [
      playerId,
    ]);
    const registrations = registrationsResult.rows;

    res.json({
      success: true,
      events,
      availableKicks,
      registrations,
    });
  } catch (error) {
    console.error("Error fetching upcoming events:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load events",
    });
  }
};

// Register for an event
export const registerForEvent = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const playerId = (req.session as any).user.id;
    const { eventId, kicksRequested, isCompetition } = req.body;

    // Validate input
    if (!eventId || !kicksRequested || kicksRequested < 1) {
      res.status(400).json({
        success: false,
        message: "Event ID and number of kicks are required",
      });
      return;
    }

    // Check if the event exists and is still available
    // Manually calculate Belize time (UTC-6)
    const now = new Date();
    const belizeTime = new Date(now.getTime() - 6 * 60 * 60 * 1000);
    const today = belizeTime.toISOString().split("T")[0];

    const eventQuery = `
      SELECT * FROM event_locations 
      WHERE id = $1 AND end_date >= $2
    `;

    const eventResult = await pool.query(eventQuery, [eventId, today]);
    const event = eventResult.rows[0];

    if (!event) {
      res.status(404).json({
        success: false,
        message: "Event not found or has ended",
      });
      return;
    }

    // Check if kicks requested is within max allowed
    if (kicksRequested > event.max_kicks) {
      res.status(400).json({
        success: false,
        message: `Maximum ${event.max_kicks} kicks allowed for this event`,
      });
      return;
    }

    // Check if player is already registered
    const existingRegQuery = `
      SELECT * FROM event_registrations 
      WHERE event_id = $1 AND player_id = $2
    `;

    const existingRegResult = await pool.query(existingRegQuery, [
      eventId,
      playerId,
    ]);

    if (existingRegResult.rows.length > 0) {
      res.status(400).json({
        success: false,
        message: "You are already registered for this event",
      });
      return;
    }

    // Calculate kicks required
    const kicksRequired = kicksRequested;

    // Check if player has enough kicks in their balance
    const playerQuery = `
      SELECT kicks_balance, name
      FROM players
      WHERE id = $1
    `;

    const playerResult = await pool.query(playerQuery, [playerId]);
    const kicksBalance = parseInt(
      playerResult.rows[0]?.kicks_balance || "0",
      10
    );
    const playerName = playerResult.rows[0]?.name || "Player";

    if (kicksBalance < kicksRequired) {
      res.status(400).json({
        success: false,
        message: `Not enough kicks. You need ${kicksRequired} kicks but have only ${kicksBalance} in your balance`,
      });
      return;
    }

    // Begin transaction
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Deduct kicks from player's balance
      const updateKicksQuery = `
        UPDATE players
        SET kicks_balance = kicks_balance - $1
        WHERE id = $2
        RETURNING kicks_balance
      `;

      const kicksUpdateResult = await client.query(updateKicksQuery, [
        kicksRequired,
        playerId,
      ]);

      if (!kicksUpdateResult.rows[0]) {
        throw new Error("Failed to update kicks balance");
      }

      const updatedKicksBalance = kicksUpdateResult.rows[0].kicks_balance;

      // Register for event and assign a registration number
      const registerQuery = `
        INSERT INTO event_registrations 
        (event_id, player_id, kicks_requested, is_competition, tickets_used, registration_number) 
        VALUES ($1, $2, $3, $4, $5, 
          (SELECT COALESCE(MAX(registration_number), 0) + 1 
           FROM event_registrations 
           WHERE event_id = $1))
        RETURNING id, registration_number
      `;

      const registerResult = await client.query(registerQuery, [
        eventId,
        playerId,
        kicksRequested,
        isCompetition || false,
        kicksRequired, // Using kicks as tickets for compatibility
      ]);

      // Insert a notification for the player
      const notificationQuery = `
        INSERT INTO notifications
        (player_id, title, message, type, created_at, is_read)
        VALUES ($1, $2, $3, $4, NOW(), false)
      `;

      await client.query(notificationQuery, [
        playerId,
        `Event Registration Confirmed`,
        `You have successfully registered for "${event.name}". Your registration number is #${registerResult.rows[0].registration_number}. Visit the event to get your queue ticket assigned by staff.`,
        "event_registration",
      ]);

      await client.query("COMMIT");

      res.json({
        success: true,
        message: "Successfully registered for the event",
        registrationId: registerResult.rows[0].id,
        registrationNumber: registerResult.rows[0].registration_number,
        kicksUsed: kicksRequired,
        remainingKicks: updatedKicksBalance,
      });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error registering for event:", error);
    res.status(500).json({
      success: false,
      message: "Failed to register for event",
    });
  }
};

// Get player event registrations
export const getPlayerEventRegistrations = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const playerId = (req.session as any).user.id;

    const registrationsQuery = `
      SELECT er.*, el.name, el.address, el.start_date, el.end_date, el.event_type, el.description
      FROM event_registrations er
      JOIN event_locations el ON er.event_id = el.id
      WHERE er.player_id = $1
      ORDER BY el.start_date ASC
    `;

    const registrationsResult = await pool.query(registrationsQuery, [
      playerId,
    ]);
    const registrations = registrationsResult.rows;

    res.json({
      success: true,
      registrations,
    });
  } catch (error) {
    console.error("Error fetching player registrations:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load your event registrations",
    });
  }
};

// Cancel event registration
export const cancelEventRegistration = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const playerId = (req.session as any).user.id;
    const { registrationId } = req.params;

    // Check if registration exists and belongs to player
    const regQuery = `
      SELECT * FROM event_registrations 
      WHERE id = $1 AND player_id = $2
    `;

    const regResult = await pool.query(regQuery, [registrationId, playerId]);

    if (regResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "Registration not found",
      });
      return;
    }

    const registration = regResult.rows[0];

    // Check if event is in the future
    const eventQuery = `
      SELECT start_date FROM event_locations WHERE id = $1
    `;

    const eventResult = await pool.query(eventQuery, [registration.event_id]);
    const eventStartDate = new Date(eventResult.rows[0].start_date);
    const today = new Date();

    if (eventStartDate <= today) {
      res.status(400).json({
        success: false,
        message:
          "Cannot cancel registration for an event that has started or ended",
      });
      return;
    }

    // Begin transaction
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Delete the registration
      await client.query("DELETE FROM event_registrations WHERE id = $1", [
        registrationId,
      ]);

      // Return tickets to player
      await client.query(
        `
        INSERT INTO queue_tickets (player_id, status)
        SELECT $1, 'available' FROM generate_series(1, $2)
      `,
        [playerId, registration.tickets_used]
      );

      await client.query("COMMIT");

      res.json({
        success: true,
        message: "Registration cancelled and tickets refunded",
        ticketsRefunded: registration.tickets_used,
      });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error cancelling registration:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cancel registration",
    });
  }
};
