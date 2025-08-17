import { Request, Response } from "express";
import { pool } from "../../config/db";

// Display player management page
export const getPlayerManagement = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Only allow admin to access this page
    if (
      !(req.session as any).user ||
      (req.session as any).user.role !== "admin"
    ) {
      req.flash("error_msg", "Unauthorized access");
      return res.redirect("/auth/login");
    }

    // Get search query and show deleted filter
    const { search, showDeleted } = req.query;

    // Build query - by default, only show active (non-deleted) players
    let query = "SELECT * FROM players";
    const params: any[] = [];

    // Base condition: filter deleted players unless specifically requested
    let whereConditions = [];
    if (showDeleted !== "true") {
      whereConditions.push("deleted_at IS NULL");
    }

    if (search) {
      whereConditions.push(
        "(name ILIKE $" +
          (params.length + 1) +
          " OR phone LIKE $" +
          (params.length + 2) +
          " OR email ILIKE $" +
          (params.length + 3) +
          ")"
      );
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    if (whereConditions.length > 0) {
      query += " WHERE " + whereConditions.join(" AND ");
    }

    query += " ORDER BY name LIMIT 100";

    // Get players
    const playersResult = await pool.query(query, params);
    const players = playersResult.rows;

    // Debug profile pictures
    console.log(
      "DEBUG - Player profile pictures:",
      players.slice(0, 3).map((p) => ({
        id: p.id,
        name: p.name,
        photo_path: p.photo_path,
        profile_picture: p.photo_path, // Map photo_path to profile_picture
      }))
    );

    res.render("admin/player-management", {
      title: "Player Management",
      players,
      search: search || "",
      showDeleted: showDeleted === "true",
      activePage: "players",
    });
  } catch (error) {
    console.error("Player management error:", error);
    req.flash("error_msg", "An error occurred while loading player management");
    res.redirect("/admin/dashboard");
  }
};

// Display player details
export const getPlayerDetails = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Only allow admin to access this page
    if (
      !(req.session as any).user ||
      (req.session as any).user.role !== "admin"
    ) {
      req.flash("error_msg", "Unauthorized access");
      return res.redirect("/auth/login");
    }

    const { id } = req.params;

    // Get player (including soft-deleted ones for admin review)
    const playerQuery = "SELECT * FROM players WHERE id = $1";
    const playerResult = await pool.query(playerQuery, [id]);
    const player = playerResult.rows[0];

    if (!player) {
      req.flash("error_msg", "Player not found");
      return res.redirect("/admin/players");
    }

    // Debug player profile picture
    console.log("DEBUG - Player Detail profile picture:", {
      id: player.id,
      name: player.name,
      photo_path: player.photo_path,
      profile_picture: player.photo_path, // Map photo_path to profile_picture
    });

    // Query to check what tables exist in the database
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    const tablesResult = await pool.query(tablesQuery);
    console.log(
      "DEBUG - Tables in database:",
      tablesResult.rows.map((r) => r.table_name)
    );

    // Using correct table name (game_stats) as shown in the debug output
    const statsQuery = `
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
    `;

    const statsResult = await pool.query(statsQuery, [id]);
    const stats = statsResult.rows;
    console.log("DEBUG - Player Stats:", id, stats.length, stats.slice(0, 2));

    // Get player tickets
    const ticketsQuery = `
      SELECT *
      FROM queue_tickets
      WHERE player_id = $1
      ORDER BY created_at DESC
    `;

    const ticketsResult = await pool.query(ticketsQuery, [id]);
    const tickets = ticketsResult.rows;
    console.log(
      "DEBUG - Player Tickets:",
      id,
      tickets.length,
      tickets.slice(0, 2)
    );

    // Get table structure for game_stats
    const tableStructureQuery = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'game_stats'
    `;
    const tableStructureResult = await pool.query(tableStructureQuery);
    console.log(
      "DEBUG - game_stats table structure:",
      tableStructureResult.rows
    );

    res.render("admin/player-details", {
      title: `Player: ${player.name}`,
      player,
      stats,
      tickets,
      activePage: "players",
    });
  } catch (error) {
    console.error("Player details error:", error);
    req.flash("error_msg", "An error occurred while loading player details");
    res.redirect("/admin/players");
  }
};

// Update player
export const updatePlayer = async (
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

    const { id } = req.params;
    const { name, phone, email, residence, gender, age_group } = req.body;

    // Validate input
    if (!name || !phone || !residence || !age_group) {
      res.status(400).json({
        success: false,
        message: "Name, phone, residence, and age group are required",
      });
      return;
    }

    // Update player (excluding kicks_balance)
    const updateQuery = `
      UPDATE players
      SET name = $1, phone = $2, email = $3, residence = $4, gender = $5, age_group = $6
      WHERE id = $7
      RETURNING *
    `;

    const updateResult = await pool.query(updateQuery, [
      name,
      phone,
      email || null,
      residence,
      gender || null,
      age_group,
      id,
    ]);

    const updatedPlayer = updateResult.rows[0];

    req.flash("success_msg", "Player information updated successfully");
    res.redirect(`/admin/players/${id}`);
  } catch (error) {
    console.error("Update player error:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while updating player",
    });
  }
};

// Update kicks balance
export const updateKicksBalance = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Only allow admin to access this API
    if (
      !(req.session as any).user ||
      (req.session as any).user.role !== "admin"
    ) {
      req.flash("error_msg", "Unauthorized access");
      return res.redirect("/auth/login");
    }

    const { id } = req.params;
    const { operation, amount, reason } = req.body;

    // Validate input
    if (!operation || !amount || !reason) {
      req.flash("error_msg", "Operation, amount, and reason are required");
      return res.redirect(`/admin/players/${id}`);
    }

    // Get current kicks balance
    const playerQuery = "SELECT * FROM players WHERE id = $1";
    const playerResult = await pool.query(playerQuery, [id]);
    const player = playerResult.rows[0];

    if (!player) {
      req.flash("error_msg", "Player not found");
      return res.redirect("/admin/players");
    }

    let newBalance = 0;
    const currentBalance = player.kicks_balance || 0;

    switch (operation) {
      case "add":
        newBalance = currentBalance + parseInt(amount);
        break;
      case "subtract":
        newBalance = Math.max(0, currentBalance - parseInt(amount));
        break;
      case "set":
        newBalance = Math.max(0, parseInt(amount));
        break;
      default:
        req.flash("error_msg", "Invalid operation");
        return res.redirect(`/admin/players/${id}`);
    }

    // Update kicks balance
    const updateQuery = `
      UPDATE players
      SET kicks_balance = $1
      WHERE id = $2
      RETURNING *
    `;

    await pool.query(updateQuery, [newBalance, id]);

    // Log the kicks balance update to transactions table
    const logQuery = `
      INSERT INTO transactions (player_id, kicks, amount, staff_id, team_play, created_at)
      VALUES ($1, $2, $3, $4, false, timezone('UTC', NOW() AT TIME ZONE 'America/Belize'))
    `;

    const changeAmount =
      operation === "add"
        ? parseInt(amount)
        : operation === "subtract"
        ? -parseInt(amount)
        : newBalance - currentBalance;

    await pool.query(logQuery, [
      id,
      changeAmount,
      0, // amount field (for kicks transactions, amount is usually 0)
      (req.session as any).user.id,
    ]);

    req.flash(
      "success_msg",
      `Kicks balance ${
        operation === "set"
          ? "set to"
          : operation === "add"
          ? "increased by"
          : "decreased by"
      } ${amount}. New balance: ${newBalance}`
    );
    res.redirect(`/admin/players/${id}`);
  } catch (error) {
    console.error("Update kicks balance error:", error);
    req.flash("error_msg", "An error occurred while updating kicks balance");
    res.redirect(`/admin/players/${req.params.id}`);
  }
};

// Delete player account (soft delete - preserves transaction history for sales reports)
export const deletePlayer = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Only allow admin to access this function
    if (
      !(req.session as any).user ||
      (req.session as any).user.role !== "admin"
    ) {
      req.flash("error_msg", "Unauthorized access");
      return res.redirect("/auth/login");
    }

    const { id } = req.params;
    const staffId = (req.session as any).user.id;

    // First check if player exists and is not already deleted
    const playerQuery =
      "SELECT * FROM players WHERE id = $1 AND deleted_at IS NULL";
    const playerResult = await pool.query(playerQuery, [id]);
    const player = playerResult.rows[0];

    if (!player) {
      req.flash("error_msg", "Player not found or already deleted");
      return res.redirect("/admin/players");
    }

    // Begin transaction to ensure all operations are atomic
    await pool.query("BEGIN");

    try {
      // Soft delete: Mark player as deleted but preserve all data
      // This maintains transaction history for sales reports and financial auditing
      const softDeleteQuery = `
        UPDATE players 
        SET deleted_at = timezone('UTC', NOW() AT TIME ZONE 'America/Belize'),
            deleted_by = $2
        WHERE id = $1
      `;
      await pool.query(softDeleteQuery, [id, staffId]);

      // Cancel any active queue tickets (but keep the records for history)
      await pool.query(
        "UPDATE queue_tickets SET status = 'cancelled' WHERE player_id = $1 AND status = 'waiting'",
        [id]
      );

      // Add a transaction record for the deletion (for audit trail)
      const auditTransactionQuery = `
        INSERT INTO transactions (player_id, kicks, amount, staff_id, team_play, created_at)
        VALUES ($1, 0, 0, $2, false, timezone('UTC', NOW() AT TIME ZONE 'America/Belize'))
      `;
      await pool.query(auditTransactionQuery, [id, staffId]);

      // Commit the transaction
      await pool.query("COMMIT");

      console.log(
        `Player soft deleted successfully: ${player.name} (ID: ${id}) by staff ${staffId}`
      );
      req.flash(
        "success_msg",
        `Player "${player.name}" has been deleted. Transaction history preserved for sales reports.`
      );
      res.redirect("/admin/players");
    } catch (deleteError) {
      // Rollback transaction on error
      await pool.query("ROLLBACK");
      throw deleteError;
    }
  } catch (error) {
    console.error("Delete player error:", error);
    req.flash(
      "error_msg",
      "An error occurred while deleting the player account."
    );
    res.redirect(`/admin/players/${req.params.id}`);
  }
};

// Restore deleted player account
export const restorePlayer = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Only allow admin to access this function
    if (
      !(req.session as any).user ||
      (req.session as any).user.role !== "admin"
    ) {
      req.flash("error_msg", "Unauthorized access");
      return res.redirect("/auth/login");
    }

    const { id } = req.params;
    const staffId = (req.session as any).user.id;

    // First check if player exists and is deleted
    const playerQuery =
      "SELECT * FROM players WHERE id = $1 AND deleted_at IS NOT NULL";
    const playerResult = await pool.query(playerQuery, [id]);
    const player = playerResult.rows[0];

    if (!player) {
      req.flash("error_msg", "Player not found or not deleted");
      return res.redirect("/admin/players");
    }

    // Begin transaction to ensure all operations are atomic
    await pool.query("BEGIN");

    try {
      // Restore player: Clear deletion fields
      const restoreQuery = `
        UPDATE players 
        SET deleted_at = NULL,
            deleted_by = NULL
        WHERE id = $1
      `;
      await pool.query(restoreQuery, [id]);

      // Reactivate any cancelled queue tickets that are still current
      await pool.query(
        "UPDATE queue_tickets SET status = 'waiting' WHERE player_id = $1 AND status = 'cancelled' AND created_at > NOW() - INTERVAL '1 day'",
        [id]
      );

      // Add a transaction record for the restoration (for audit trail)
      const auditTransactionQuery = `
        INSERT INTO transactions (player_id, kicks, amount, staff_id, team_play, created_at)
        VALUES ($1, 0, 0, $2, false, timezone('UTC', NOW() AT TIME ZONE 'America/Belize'))
      `;
      await pool.query(auditTransactionQuery, [id, staffId]);

      // Commit the transaction
      await pool.query("COMMIT");

      console.log(
        `Player restored successfully: ${player.name} (ID: ${id}) by staff ${staffId}`
      );
      req.flash(
        "success_msg",
        `Player "${player.name}" has been restored and can now log in again.`
      );
      res.redirect(`/admin/players/${id}`);
    } catch (restoreError) {
      // Rollback transaction on error
      await pool.query("ROLLBACK");
      throw restoreError;
    }
  } catch (error) {
    console.error("Restore player error:", error);
    req.flash(
      "error_msg",
      "An error occurred while restoring the player account."
    );
    res.redirect(`/admin/players/${req.params.id}`);
  }
};
