import { Request, Response } from "express";
import Player from "../../models/Player";
import Team from "../../models/Team";
import Shot from "../../models/Shot";
import QueueTicket from "../../models/QueueTicket";
import { pool } from "../../config/db";

// Runtime schema detection cache for optional new columns
let hasQueueTicketIdColumn: boolean | null = null;
async function ensureTransactionSchema() {
  if (hasQueueTicketIdColumn !== null) return hasQueueTicketIdColumn;
  try {
    const check = await pool.query(
      "SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'queue_ticket_id'"
    );
    hasQueueTicketIdColumn = check.rows.length > 0;
    if (!hasQueueTicketIdColumn) {
      console.warn(
        "[SCHEMA WARNING] 'queue_ticket_id' column missing on transactions table. Falling back to legacy insert. Run migration add-queue-ticket-id-to-transactions.sql to enable accurate ticket linkage."
      );
    }
  } catch (e) {
    console.error("Failed to verify transactions schema:", e);
    hasQueueTicketIdColumn = false; // fail safe
  }
  return hasQueueTicketIdColumn;
}

// Display cashier interface
export const getCashierInterface = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Allow staff, admin, and sales to access this page
    if (
      !(req.session as any).user ||
      ((req.session as any).user.role !== "admin" &&
        (req.session as any).user.role !== "staff" &&
        (req.session as any).user.role !== "sales")
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

    // Get display numbers (nowServing + next)
    const { currentServing, lastIssued, next } =
      await QueueTicket.getDisplayNumbers();

    // For sales users, pre-load their transactions directly
    let preloadedTransactions = [];
    if ((req.session as any).user.role === "sales") {
      const userId = parseInt((req.session as any).user.id);

      // Add timestamp for cache-busting on the query
      const timestamp = new Date().getTime();

      // Query to get transactions for this sales user - using Central timezone range converted to UTC
      const transactionsQuery =
        "SELECT t.id, t.created_at as timestamp, p.name as player_name, CASE WHEN t.kicks < 0 AND t.official_entry = true THEN 'Requeue' WHEN t.kicks > 0 AND t.official_entry = true AND qt.competition_type = 'standard' THEN 'Sale + Competition' WHEN t.kicks > 0 AND t.official_entry = true AND qt.competition_type = 'practice' THEN 'Sale + No Competition' WHEN t.kicks > 0 AND t.official_entry = false THEN 'Sale' ELSE 'Sale' END as transaction_type, t.kicks as kicks_count, t.amount, COALESCE(s.name, s.username, 'Staff') as staff_name, CASE WHEN t.official_entry = true THEN COALESCE(qt.ticket_number, 0) ELSE NULL END as ticket_number FROM transactions t JOIN players p ON t.player_id = p.id LEFT JOIN staff s ON t.staff_id = s.id LEFT JOIN (SELECT player_id, ticket_number, competition_type, created_at FROM queue_tickets WHERE created_at >= timezone('UTC', (NOW() - interval '6 hours')::date) AND created_at < timezone('UTC', (NOW() - interval '6 hours')::date + interval '1 day')) qt ON t.player_id = qt.player_id AND t.official_entry = true AND DATE(t.created_at) = DATE(qt.created_at) WHERE t.staff_id = $1 AND t.created_at >= timezone('UTC', (NOW() - interval '6 hours')::date) AND t.created_at < timezone('UTC', (NOW() - interval '6 hours')::date + interval '1 day') ORDER BY t.created_at DESC LIMIT 200";

      const result = await pool.query(transactionsQuery, [userId]);
      preloadedTransactions = result.rows;

      console.log(
        "Sample preloaded transactions:",
        preloadedTransactions.slice(0, 3)
      );
    }

    // Add no-cache headers for sales users to prevent caching
    if ((req.session as any).user.role === "sales") {
      res.setHeader(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, private"
      );
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
    }

    res.render("cashier/interface", {
      title: "Cashier Interface",
      competitionTypes,
      nextTicket: next,
      lastTicketIssued: lastIssued,
      currentServing: currentServing, // null if none waiting
      preloadedTransactions: preloadedTransactions,
      timestamp: new Date().getTime(),
    });
  } catch (error) {
    console.error("Cashier interface error:", error);
    req.flash(
      "error_msg",
      "An error occurred while loading the cashier interface"
    );
    res.redirect("/");
  }
};

// Search player
export const searchPlayer = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Allow admin, staff, and sales to access this API
    if (
      !(req.session as any).user ||
      ((req.session as any).user.role !== "admin" &&
        (req.session as any).user.role !== "staff" &&
        (req.session as any).user.role !== "sales")
    ) {
      res.status(401).json({ success: false, message: "Unauthorized access" });
      return;
    }

    const { query } = req.query;

    if (!query || typeof query !== "string") {
      res
        .status(400)
        .json({ success: false, message: "Search query is required" });
      return;
    }

    const players = await Player.search(query);
    if (process.env.DEBUG_SANITIZE === "true") {
      const first = players[0];
      if (first) {
        console.log(
          `[SEARCH DEBUG] Raw player fields: phone=${first.phone} residence=${first.residence} city_village=${first.city_village} parent_phone=${first.parent_phone} email=${first.email}`
        );
      } else {
        console.log(`[SEARCH DEBUG] No players found for query="${query}"`);
      }
    }
    (res.locals as any).skipSanitize = true;
    res.json({ success: true, players });
  } catch (error) {
    console.error("Player search error:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while searching for players",
    });
  }
};

// Search teams by name for cashier interface
export const searchTeams = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { query } = req.query;

    if (!query || typeof query !== "string") {
      res.json({ success: false, error: "Invalid search query" });
      return;
    }

    // Search teams using SQL query
    const searchQuery = `
      SELECT t.*, 
             p.name as captain_name,
             COUNT(tm_all.player_id) as member_count
      FROM teams t
      JOIN team_members tm_captain ON t.id = tm_captain.team_id AND tm_captain.is_captain = true
      JOIN players p ON tm_captain.player_id = p.id
      LEFT JOIN team_members tm_all ON t.id = tm_all.team_id
      WHERE LOWER(t.name) LIKE LOWER($1)
      GROUP BY t.id, p.name
      ORDER BY t.name
      LIMIT 10
    `;

    const result = await pool.query(searchQuery, [`%${query}%`]);
    const teams = result.rows;

    res.json({ success: true, teams: teams });
  } catch (error) {
    console.error("Error searching teams:", error);
    res.status(500).json({
      success: false,
      error: "An error occurred while searching teams",
    });
  }
};

// Process QR code scan
export const processQRScan = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Only allow staff, admin, or sales to access this API
    if (
      !(req.session as any).user ||
      ((req.session as any).user.role !== "admin" &&
        (req.session as any).user.role !== "staff" &&
        (req.session as any).user.role !== "sales")
    ) {
      res.status(401).json({ success: false, message: "Unauthorized access" });
      return;
    }

    const { qrData } = req.body;

    if (!qrData) {
      res.status(400).json({ success: false, message: "QR data is required" });
      return;
    }

    // Parse QR data
    let parsedData;
    try {
      parsedData = JSON.parse(qrData);
    } catch (error) {
      res
        .status(400)
        .json({ success: false, message: "Invalid QR code format" });
      return;
    }

    // Find player by QR hash or ID
    let player;
    if (parsedData.hash) {
      player = await Player.findByQRHash(parsedData.hash);
    } else if (parsedData.playerId) {
      player = await Player.findById(parsedData.playerId);
    }

    if (!player) {
      res.status(404).json({ success: false, message: "Player not found" });
      return;
    }

    // Get active queue tickets
    const activeTickets = await QueueTicket.findActiveByPlayerId(player.id);

    // Get next ticket number
    const nextTicketQuery = `
      SELECT value as next_ticket
      FROM global_counters
      WHERE id = 'next_queue_number'
    `;

    const nextTicketResult = await pool.query(nextTicketQuery);
    const nextTicket = nextTicketResult.rows[0]?.next_ticket || 1000;

    res.json({
      success: true,
      player: {
        id: player.id,
        name: player.name,
        // phone: REMOVED for security
        // email: REMOVED for security
        // residence: REMOVED for security
        age_group: player.age_group,
        gender: player.gender,
        photo_path: player.photo_path,
        kicks_balance: player.kicks_balance || 0,
      },
      activeTickets,
      nextTicket,
    });
  } catch (error) {
    console.error("QR scan error:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while processing QR code",
    });
  }
};

// Process kicks purchase
export const processKicksPurchase = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Only allow staff, admin, or sales to access this API
    if (
      !(req.session as any).user ||
      ((req.session as any).user.role !== "admin" &&
        (req.session as any).user.role !== "staff" &&
        (req.session as any).user.role !== "sales")
    ) {
      res.status(401).json({ success: false, message: "Unauthorized access" });
      return;
    }

    const { playerId, kicksQuantity, purchaseType, competitionType } = req.body;

    // Validate input
    if (!playerId || !kicksQuantity || kicksQuantity < 1) {
      res.status(400).json({
        success: false,
        message: "Player ID and kicks quantity are required",
      });
      return;
    }

    // Find player
    const player = await Player.findById(parseInt(playerId));

    if (!player) {
      res.status(404).json({ success: false, message: "Player not found" });
      return;
    }

    // Calculate amount ($1 per kick)
    const amount = parseInt(kicksQuantity);

    // Create shot transaction
    const shot = await Shot.create({
      player_id: player.id,
      amount,
      shots_quantity: kicksQuantity,
      payment_status: "completed",
      payment_reference: `PAY-${Date.now()}`,
    });

    if (!shot) {
      res
        .status(500)
        .json({ success: false, message: "Failed to create transaction" });
      return;
    }

    // Update player's kicks balance
    const updatedPlayer = await Player.updateKicksBalance(
      player.id,
      kicksQuantity
    );

    if (!updatedPlayer) {
      res.status(500).json({
        success: false,
        message: "Failed to update player kicks balance",
      });
      return;
    }

    // Handle different purchase types
    let tickets = [];
    let remainingKicks = updatedPlayer.kicks_balance;

    if (purchaseType === "queue") {
      // Create queue ticket (5 kicks per ticket)
      const ticketsToCreate = Math.min(Math.floor(kicksQuantity / 5), 1); // Max 1 ticket per transaction

      if (ticketsToCreate > 0) {
        // Deduct kicks from balance
        await Player.updateKicksBalance(player.id, -(ticketsToCreate * 5));
        remainingKicks = updatedPlayer.kicks_balance - ticketsToCreate * 5;

        // Create ticket
        const ticket = await QueueTicket.create({
          player_id: player.id,
          competition_type: competitionType || "accuracy",
          official: true,
        });

        if (ticket) {
          tickets.push(ticket);
        }
      }
    } else if (
      purchaseType === "balance-and-kick-for-competition" ||
      purchaseType === "balance-and-kick-no-competition"
    ) {
      // Competition or practice kick purchase - create queue ticket if 5+ kicks
      if (kicksQuantity >= 5) {
        // Deduct 5 kicks from balance for the queue ticket
        await Player.updateKicksBalance(player.id, -5);
        remainingKicks = updatedPlayer.kicks_balance - 5;

        // Create ticket
        const isCompetition =
          purchaseType === "balance-and-kick-for-competition";
        const ticket = await QueueTicket.create({
          player_id: player.id,
          competition_type: isCompetition ? "standard" : "practice",
          official: true,
        });

        if (ticket) {
          tickets.push(ticket);
        }
      }
    }

    // Insert transaction record for every purchase (for transaction table persistence)
    const staffId = parseInt((req.session as any).user.id); // Convert string to integer
    // Determine if this should be marked as an official entry (if tickets were created)
    const isOfficialEntry = tickets.length > 0;

    // Log ticket information for debugging
    if (tickets.length > 0) {
      console.log(
        "processKicksPurchase - Tickets created:",
        tickets.map((t) => ({ id: t.id, ticket_number: t.ticket_number }))
      );
    }

    // If tickets were created, capture the FIRST ticket's id to associate with this transaction
    const primaryTicketId = tickets.length > 0 ? tickets[0].id : null;
    const hasQueueTicket = await ensureTransactionSchema();
    if (hasQueueTicket) {
      const insertTransactionQuery =
        "INSERT INTO transactions (player_id, kicks, amount, created_at, team_play, staff_id, official_entry, queue_ticket_id) VALUES ($1, $2, $3, (NOW() - interval '6 hours')::timestamp AT TIME ZONE 'UTC', false, $4, $5, $6)";
      await pool.query(insertTransactionQuery, [
        player.id,
        kicksQuantity,
        amount,
        staffId,
        isOfficialEntry,
        primaryTicketId,
      ]);
    } else {
      // Legacy schema insert without queue_ticket_id column
      const legacyInsert =
        "INSERT INTO transactions (player_id, kicks, amount, created_at, team_play, staff_id, official_entry) VALUES ($1, $2, $3, (NOW() - interval '6 hours')::timestamp AT TIME ZONE 'UTC', false, $4, $5)";
      await pool.query(legacyInsert, [
        player.id,
        kicksQuantity,
        amount,
        staffId,
        isOfficialEntry,
      ]);
    }

    console.log(
      "processKicksPurchase - Transaction INSERT completed for staff_id:",
      staffId
    );

    // Verify the transaction was created by querying it back
    const verifyQuery =
      "SELECT id, staff_id, player_id, kicks, amount FROM transactions WHERE staff_id = $1 AND player_id = $2 ORDER BY created_at DESC LIMIT 1";
    const verifyResult = await pool.query(verifyQuery, [staffId, player.id]);
    // Get updated display numbers post-purchase
    const { currentServing, lastIssued, next } =
      await QueueTicket.getDisplayNumbers();
    res.json({
      success: true,
      player: {
        ...updatedPlayer,
        kicks_balance: remainingKicks,
      },
      transaction: shot,
      tickets,
      lastTicketIssued: lastIssued,
      currentServing,
      nextTicket: next,
    });
  } catch (error) {
    console.error("Kicks purchase error:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while processing kicks purchase",
    });
  }
};

// Process team kick purchases
export const processPurchaseKicksTeam = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Only allow staff, admin, or sales to access this API
    if (
      !(req.session as any).user ||
      ((req.session as any).user.role !== "admin" &&
        (req.session as any).user.role !== "staff" &&
        (req.session as any).user.role !== "sales")
    ) {
      res.status(401).json({ success: false, message: "Unauthorized access" });
      return;
    }

    const { teamId, kicksQuantity, purchaseType } = req.body;
    const userId = parseInt((req.session as any).user.id); // Convert string to integer

    if (!teamId || !kicksQuantity || !purchaseType) {
      res.json({ success: false, message: "Missing required fields" });
      return;
    }

    const kicks = parseInt(kicksQuantity);
    if (kicks < 1 || kicks > 3) {
      res.json({
        success: false,
        message:
          "Invalid kicks quantity. Must be between 1 and 3 per team member.",
      });
      return;
    }

    // Get team info and captain
    const team = await Team.getById(teamId);
    if (!team) {
      res.json({ success: false, message: "Team not found" });
      return;
    }

    // Get captain ID
    const captainResult = await pool.query(
      "SELECT player_id FROM team_members WHERE team_id = $1 AND is_captain = true",
      [teamId]
    );

    if (captainResult.rows.length === 0) {
      res.json({ success: false, message: "Team captain not found" });
      return;
    }

    const captainId = captainResult.rows[0].player_id;

    // Get team members
    const membersResult = await pool.query(
      "SELECT p.id, p.name FROM players p JOIN team_members tm ON p.id = tm.player_id WHERE tm.team_id = $1",
      [teamId]
    );

    const teamMembers = membersResult.rows;
    if (teamMembers.length === 0) {
      res.json({ success: false, message: "No team members found" });
      return;
    }

    const totalCost = kicks * teamMembers.length;

    // Process the purchase for each team member
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      for (const member of teamMembers) {
        // Add kicks to each member's balance
        await client.query(
          "UPDATE players SET kicks_balance = kicks_balance + $1 WHERE id = $2",
          [kicks, member.id]
        );

        // Record the transaction for each member using proper Belize timezone (UTC-6)
        await client.query(
          "INSERT INTO transactions (player_id, kicks, amount, staff_id, team_play, created_at) VALUES ($1, $2, $3, $4, true, (NOW() - interval '6 hours')::timestamp AT TIME ZONE 'UTC')",
          [
            member.id,
            kicks,
            kicks, // $1 per kick
            userId,
          ]
        );
      }

      // Team purchases always include immediate play - create queue ticket
      const isCompetition = purchaseType === "balance-and-kick-for-competition";

      // Deduct kicks from each member's balance for immediate play
      for (const member of teamMembers) {
        await client.query(
          "UPDATE players SET kicks_balance = kicks_balance - $1 WHERE id = $2",
          [kicks, member.id]
        );
      }

      // Create team queue ticket
      const ticketNumber = await QueueTicket.incrementTicketNumber();
      await client.query(
        "INSERT INTO queue_tickets (ticket_number, player_id, competition_type, team_play, status) VALUES ($1, $2, $3, true, 'in-queue')",
        [ticketNumber, captainId, isCompetition ? "standard" : "practice"]
      );

      await client.query("COMMIT");

      const successMessage =
        "Successfully purchased " +
        kicks +
        " kicks for each of " +
        teamMembers.length +
        " team members (Total: $" +
        totalCost +
        " BZD) and added team to queue. Ticket #" +
        ticketNumber;
      res.json({
        success: true,
        message: successMessage,
        ticketNumber,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error processing team kick purchase:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while processing the team purchase",
    });
  }
};

// Process re-queue
export const processReQueue = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Only allow staff, admin, or sales to access this API
    if (
      !(req.session as any).user ||
      ((req.session as any).user.role !== "admin" &&
        (req.session as any).user.role !== "staff" &&
        (req.session as any).user.role !== "sales")
    ) {
      res.status(401).json({ success: false, message: "Unauthorized access" });
      return;
    }

    const { playerId, competitionType } = req.body;

    // Validate input
    if (!playerId) {
      res
        .status(400)
        .json({ success: false, message: "Player ID is required" });
      return;
    }

    // Find player
    const player = await Player.findById(parseInt(playerId));

    if (!player) {
      res.status(404).json({ success: false, message: "Player not found" });
      return;
    }

    // Check if player has enough kicks
    if (player.kicks_balance < 5) {
      res.status(400).json({
        success: false,
        message:
          "Not enough kicks balance. Player needs to purchase more kicks.",
        kicksBalance: player.kicks_balance,
      });
      return;
    }

    // Deduct 5 kicks from balance
    const updatedPlayer = await Player.updateKicksBalance(player.id, -5);

    if (!updatedPlayer) {
      res.status(500).json({
        success: false,
        message: "Failed to update player kicks balance",
      });
      return;
    }

    // Create queue ticket
    const ticket = await QueueTicket.create({
      player_id: player.id,
      competition_type: competitionType || "accuracy",
      official: true,
    });

    if (!ticket) {
      // Refund kicks if ticket creation fails
      await Player.updateKicksBalance(player.id, 5);
      res
        .status(500)
        .json({ success: false, message: "Failed to create queue ticket" });
      return;
    }

    // Log the requeue as a transaction for persistence using proper Belize timezone (UTC-6)
    const staffId = parseInt((req.session as any).user.id);
    try {
      const hasQueueTicket = await ensureTransactionSchema();
      if (hasQueueTicket) {
        const insertQuery =
          "INSERT INTO transactions (player_id, kicks, amount, created_at, team_play, staff_id, official_entry, queue_ticket_id) VALUES ($1, $2, $3, (NOW() - interval '6 hours')::timestamp AT TIME ZONE 'UTC', false, $4, true, $5)";
        await pool.query(insertQuery, [player.id, -5, 0, staffId, ticket.id]);
      } else {
        const legacyInsert =
          "INSERT INTO transactions (player_id, kicks, amount, created_at, team_play, staff_id, official_entry) VALUES ($1, $2, $3, (NOW() - interval '6 hours')::timestamp AT TIME ZONE 'UTC', false, $4, true)";
        await pool.query(legacyInsert, [player.id, -5, 0, staffId]);
      }
    } catch (transactionError) {
      console.error("Error logging requeue transaction:", transactionError);
      // Don't fail the requeue if transaction logging fails
    }

    // Get current queue position
    const currentQueuePosition = await QueueTicket.getCurrentQueuePosition();

    // Get updated display numbers after requeue
    const { currentServing, lastIssued, next } =
      await QueueTicket.getDisplayNumbers();

    res.json({
      success: true,
      player: updatedPlayer,
      ticket,
      currentQueuePosition,
      lastTicketIssued: lastIssued,
      currentServing,
      nextTicket: next,
    });
  } catch (error) {
    console.error("Re-queue error:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while processing re-queue",
    });
  }
};

// Process team requeue
export const processRequeueTeam = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Only allow staff, admin, or sales to access this API
    if (
      !(req.session as any).user ||
      ((req.session as any).user.role !== "admin" &&
        (req.session as any).user.role !== "staff" &&
        (req.session as any).user.role !== "sales")
    ) {
      res.status(401).json({ success: false, message: "Unauthorized access" });
      return;
    }

    const { teamId, kicksAmount, requeueType } = req.body;
    const userId = parseInt((req.session as any).user.id); // Convert string to integer

    if (!teamId || !kicksAmount || !requeueType) {
      res.json({ success: false, message: "Missing required fields" });
      return;
    }

    const kicks = parseInt(kicksAmount);
    if (kicks < 1 || kicks > 3) {
      res.json({
        success: false,
        message:
          "Invalid kicks amount. Must be between 1 and 3 per team member.",
      });
      return;
    }

    // Get team info and captain
    const team = await Team.getById(teamId);
    if (!team) {
      res.json({ success: false, message: "Team not found" });
      return;
    }

    // Get captain ID
    const captainResult = await pool.query(
      "SELECT player_id FROM team_members WHERE team_id = $1 AND is_captain = true",
      [teamId]
    );

    if (captainResult.rows.length === 0) {
      res.json({ success: false, message: "Team captain not found" });
      return;
    }

    const captainId = captainResult.rows[0].player_id;

    // Get team members
    const membersResult = await pool.query(
      "SELECT p.id, p.name, p.kicks_balance FROM players p JOIN team_members tm ON p.id = tm.player_id WHERE tm.team_id = $1 AND p.deleted_at IS NULL",
      [teamId]
    );

    const teamMembers = membersResult.rows;
    if (teamMembers.length === 0) {
      res.json({ success: false, message: "No team members found" });
      return;
    }

    // Check if all team members have enough kicks
    const insufficientMembers = teamMembers.filter(
      (member) => member.kicks_balance < kicks
    );

    if (insufficientMembers.length > 0) {
      res.json({
        success: false,
        message:
          "Insufficient kicks. The following members need more kicks: " +
          insufficientMembers
            .map(
              (m) =>
                m.name + " (has " + m.kicks_balance + ", needs " + kicks + ")"
            )
            .join(", "),
      });
      return;
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Deduct kicks from each member's balance
      for (const member of teamMembers) {
        await client.query(
          "UPDATE players SET kicks_balance = kicks_balance - $1 WHERE id = $2",
          [kicks, member.id]
        );

        // Record the requeue transaction for each member using proper Belize timezone (UTC-6)
        await client.query(
          "INSERT INTO transactions (player_id, kicks, amount, staff_id, team_play, official_entry, created_at) VALUES ($1, $2, 0, $3, true, true, (NOW() - interval '6 hours')::timestamp AT TIME ZONE 'UTC')",
          [member.id, kicks, userId]
        );
      }

      // Create team queue ticket
      const isCompetition = requeueType === "kick-for-competition";
      const ticketNumber = await QueueTicket.incrementTicketNumber();
      await client.query(
        "INSERT INTO queue_tickets (ticket_number, player_id, competition_type, team_play, status) VALUES ($1, $2, $3, true, 'in-queue')",
        [ticketNumber, captainId, isCompetition ? "standard" : "practice"]
      );

      await client.query("COMMIT");

      res.json({
        success: true,
        message:
          "Successfully requeued team " +
          team.name +
          " with " +
          kicks +
          " kicks per member. Ticket #" +
          ticketNumber,
        ticketNumber,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error processing team requeue:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while processing the team requeue",
    });
  }
};

// Process credit transfer
export const processCreditTransfer = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Only allow staff, admin, or sales to access this API
    if (
      !(req.session as any).user ||
      ((req.session as any).user.role !== "admin" &&
        (req.session as any).user.role !== "staff" &&
        (req.session as any).user.role !== "sales")
    ) {
      res.status(401).json({ success: false, message: "Unauthorized access" });
      return;
    }

    const { fromPlayerId, toPlayerId, amount } = req.body;

    // Validate input
    if (!toPlayerId || !amount || amount < 1) {
      res.status(400).json({
        success: false,
        message: "Recipient player ID and amount are required",
      });
      return;
    }

    // Find recipient player
    const toPlayer = await Player.findById(parseInt(toPlayerId));

    if (!toPlayer) {
      res
        .status(404)
        .json({ success: false, message: "Recipient player not found" });
      return;
    }

    // Record credit transfer
    await Player.query(
      "INSERT INTO credit_transfers (from_player_id, to_player_id, amount, staff_id) VALUES ($1, $2, $3, $4)",
      [
        fromPlayerId || null,
        toPlayerId,
        amount,
        parseInt((req.session as any).user.id),
      ]
    );

    // Update recipient's kicks balance
    const updatedPlayer = await Player.updateKicksBalance(toPlayer.id, amount);

    if (!updatedPlayer) {
      res.status(500).json({
        success: false,
        message: "Failed to update recipient kicks balance",
      });
      return;
    }

    res.json({
      success: true,
      player: updatedPlayer,
    });
  } catch (error) {
    console.error("Credit transfer error:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while processing credit transfer",
    });
  }
};

// Get queue status for cashier interface
export const getQueueStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { currentServing, lastIssued, next } =
      await QueueTicket.getDisplayNumbers();
    if (process.env.DEBUG_TICKETS === "true") {
      console.log(
        `[TICKETS] /cashier/queue-status -> currentServing=${currentServing} lastIssued=${lastIssued} next=${next}`
      );
    }
    res.json({
      success: true,
      currentNumber: currentServing,
      lastTicketIssued: lastIssued,
      currentServing,
      nextTicket: next,
    });
  } catch (error) {
    console.error("Error getting queue status:", error);
    res.status(500).json({
      success: false,
      error: "An error occurred while getting queue status",
    });
  }
};

// Get today's transactions for cashier interface
export const getTodaysTransactions = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Allow staff, admin, and sales to access this API
    if (
      !(req.session as any).user ||
      ((req.session as any).user.role !== "admin" &&
        (req.session as any).user.role !== "staff" &&
        (req.session as any).user.role !== "sales")
    ) {
      res.status(401).json({ success: false, message: "Unauthorized access" });
      return;
    }

    // Get today's date in Belize timezone (UTC-6) to match preloaded transactions
    const centralTimeQuery =
      "SELECT (NOW() - interval '6 hours')::date as today";
    const centralTimeResult = await pool.query(centralTimeQuery);
    const today = centralTimeResult.rows[0].today.toISOString().split("T")[0];

    const userId = parseInt((req.session as any).user.id); // Convert string to integer
    const userRole = (req.session as any).user.role;
    const userName =
      (req.session as any).user.name || (req.session as any).user.username;

    // Get transactions for this specific user (staff member) - using Belize timezone range converted to UTC
    // Fixed query to prevent duplicates from multiple queue tickets
    // Determine if we can safely reference queue_ticket_id
    const hasQueueTicket = await ensureTransactionSchema();
    let transactionsQuery: string;
    if (hasQueueTicket) {
      transactionsQuery =
        "SELECT t.id, t.created_at as timestamp, p.name as player_name, CASE WHEN t.kicks < 0 AND t.official_entry = true THEN 'Requeue' WHEN t.kicks > 0 AND t.official_entry = true AND qt2.competition_type = 'standard' THEN 'Sale + Competition' WHEN t.kicks > 0 AND t.official_entry = true AND qt2.competition_type = 'practice' THEN 'Sale + No Competition' WHEN t.kicks > 0 AND t.official_entry = false THEN 'Sale' ELSE 'Sale' END as transaction_type, t.kicks as kicks_count, t.amount, COALESCE(s.name, s.username, 'Staff') as staff_name, CASE WHEN t.official_entry = true THEN COALESCE(qt2.ticket_number, 0) ELSE NULL END as ticket_number FROM transactions t JOIN players p ON t.player_id = p.id LEFT JOIN staff s ON t.staff_id = s.id LEFT JOIN queue_tickets qt2 ON qt2.id = t.queue_ticket_id WHERE t.staff_id = $2 AND t.created_at >= ($1::date + interval '6 hours')::timestamp AND t.created_at < ($1::date + interval '1 day' + interval '6 hours')::timestamp ORDER BY t.created_at DESC LIMIT 200";
    } else {
      // Legacy path: emulate ticket linkage without queue_ticket_id column using date + player join to today's tickets
      // Improved legacy approximation: choose the nearest ticket for that day (within day window) to the transaction time.
      // Adds better correlation when multiple tickets exist; still approximate.
      // Revert to legacy mapping v3: global rank pairing (off by one previously but stable & unique).
      transactionsQuery = `WITH day_window AS (
        SELECT ($1::date + interval '6 hours')::timestamp AS start_ts,
               ($1::date + interval '1 day' + interval '6 hours')::timestamp AS end_ts
      ), tx_official AS (
        SELECT t.id, t.created_at, t.player_id, t.kicks, t.amount, t.staff_id,
               ROW_NUMBER() OVER (ORDER BY t.created_at, t.id) AS global_rank
        FROM transactions t, day_window dw
        WHERE t.staff_id = $2
          AND t.official_entry = true
          AND t.created_at >= dw.start_ts
          AND t.created_at < dw.end_ts
      ), tickets AS (
        SELECT qt.ticket_number, qt.competition_type,
               ROW_NUMBER() OVER (ORDER BY qt.created_at, qt.ticket_number) AS global_rank
        FROM queue_tickets qt, day_window dw
        WHERE qt.created_at >= dw.start_ts
          AND qt.created_at < dw.end_ts
      ), match AS (
        SELECT tx.id, tk.ticket_number, tk.competition_type
        FROM tx_official tx
        LEFT JOIN tickets tk USING (global_rank)
      )
      SELECT t.id,
             t.created_at AS timestamp,
             p.name AS player_name,
             CASE
               WHEN t.kicks < 0 AND t.official_entry = true THEN 'Requeue'
               WHEN t.kicks > 0 AND t.official_entry = true AND m.competition_type = 'standard' THEN 'Sale + Competition'
               WHEN t.kicks > 0 AND t.official_entry = true AND m.competition_type = 'practice' THEN 'Sale + No Competition'
               WHEN t.kicks > 0 AND t.official_entry = false THEN 'Sale'
               ELSE 'Sale'
             END AS transaction_type,
             t.kicks AS kicks_count,
             t.amount,
             COALESCE(s.name, s.username, 'Staff') AS staff_name,
  CASE WHEN t.official_entry = true AND m.ticket_number IS NOT NULL THEN m.ticket_number::text
         WHEN t.official_entry = true THEN NULL
         ELSE NULL END AS ticket_number,
       CASE WHEN t.official_entry = true THEN CASE WHEN m.ticket_number IS NOT NULL THEN 'global-rank+1' ELSE 'unmatched' END ELSE NULL END AS ticket_accuracy
      FROM transactions t
      JOIN players p ON t.player_id = p.id
      LEFT JOIN staff s ON t.staff_id = s.id
      LEFT JOIN match m ON t.id = m.id, day_window dw
      WHERE t.staff_id = $2
        AND t.created_at >= dw.start_ts
        AND t.created_at < dw.end_ts
      ORDER BY t.created_at DESC
      LIMIT 200`;
      console.warn(
        "[TRANSACTIONS] Using legacy query (global-rank mapping; no queue_ticket_id column present)"
      );
    }
    const result = await pool.query(transactionsQuery, [today, userId]);
    // If legacy path, annotate rows (fallback if SQL concat unsupported on platform)
    if (!hasQueueTicket) {
      for (const row of result.rows) {
        if (row.official_entry && !row.ticket_accuracy) {
          (row as any).ticket_accuracy = "approx";
        }
      }
      try {
        const mapped = result.rows.filter((r: any) => r.ticket_number != null);
        const accuracyCounts: Record<string, number> = {};
        for (const r of mapped) {
          const key = r.ticket_accuracy || "none";
          accuracyCounts[key] = (accuracyCounts[key] || 0) + 1;
        }
        console.debug(
          "[LEGACY-TX] total rows",
          result.rows.length,
          "mapped",
          mapped.length,
          "accuracy",
          accuracyCounts
        );
        console.debug(
          "[LEGACY-TX] sample first 5",
          mapped.slice(0, 5).map((m) => ({
            id: m.id,
            ticket: m.ticket_number,
            acc: m.ticket_accuracy,
          }))
        );
      } catch (e) {
        console.warn("[LEGACY-TX] debug logging failed", e);
      }
    }

    // Debug: Let's also check all transactions for today regardless of staff_id (using Central timezone range converted to UTC)
    const allTodayQuery =
      "SELECT t.id, t.staff_id, t.player_id, t.kicks, t.amount, p.name as player_name, s.name as staff_name, s.role as staff_role FROM transactions t LEFT JOIN players p ON t.player_id = p.id LEFT JOIN staff s ON t.staff_id = s.id WHERE t.created_at >= timezone('UTC', ($1::date)::timestamp) AND t.created_at < timezone('UTC', ($1::date + interval '1 day')::timestamp) ORDER BY t.created_at DESC";

    const allTodayResult = await pool.query(allTodayQuery, [today]);
    // Log transactions for this user separately from the full query
    const userTransactions = allTodayResult.rows.filter(
      (t) => t.staff_id === userId
    );
    // If inconsistent, log a warning
    if (userTransactions.length !== result.rows.length) {
      console.warn(
        "WARNING: Transaction count mismatch! Direct query found",
        result.rows.length,
        "transactions but filtering all transactions found",
        userTransactions.length
      );
    }

    // Add timestamp to the response for clients to verify freshness
    const responseData = {
      timestamp: Date.now(),
      transactions: result.rows,
      count: result.rows.length,
      userId: userId,
      role: userRole,
    };

    // Send the data to the client with explicit content type and no-cache headers
    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate, private"
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Surrogate-Control", "no-store");
    res.setHeader("Vary", "Accept, Cookie");
    // Always send the structured response object instead of just the array
    res.send(JSON.stringify(responseData));
  } catch (error) {
    console.error("Error getting today's transactions:", error);
    res.status(500).json({
      success: false,
      error: "An error occurred while getting today's transactions",
    });
  }
};
