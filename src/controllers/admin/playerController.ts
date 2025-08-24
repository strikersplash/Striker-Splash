import { Request, Response } from "express";
import { pool, executeQuery } from "../../config/db";

// Display player management page
export const getPlayerManagement = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Allow admin or staff to access this page
    if (
      !(req.session as any).user ||
      ((req.session as any).user.role !== "admin" &&
        (req.session as any).user.role !== "staff")
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
    const playersResult = await executeQuery(query, params);
    const players = playersResult.rows.map((p: any) => ({
      id: p.id,
      name: p.name,
      email: p.email || null,
      phone: p.phone || null,
      kicks_balance: p.kicks_balance || 0,
      deleted_at: p.deleted_at || null,
      created_at: p.created_at || null,
      photo_path: p.photo_path,
      profile_picture: p.photo_path, // legacy field used by avatar script
    }));

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
    // Allow admin or staff to access this page
    if (
      !(req.session as any).user ||
      ((req.session as any).user.role !== "admin" &&
        (req.session as any).user.role !== "staff")
    ) {
      req.flash("error_msg", "Unauthorized access");
      return res.redirect("/auth/login");
    }

    const { id } = req.params;

    // Get player (including soft-deleted ones for admin review)
    const playerQuery = "SELECT * FROM players WHERE id = $1";
    const playerResult = await executeQuery(playerQuery, [id]);
    const player = playerResult.rows[0];

    if (!player) {
      req.flash("error_msg", "Player not found");
      return res.redirect("/admin/players");
    }

    // Debug player profile picture
    // Query to check what tables exist in the database
    const tablesQuery =
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'";
    const tablesResult = await executeQuery(tablesQuery);
    const tables = tablesResult.rows.map((r: any) => r.table_name);

    // Using correct table name (game_stats) as shown in the debug output
    // Improved stats query with ticket number resolution (handles legacy missing linkage)
    const statsQuery = `WITH gs_base AS (
        SELECT gs.*, s.name AS staff_name
        FROM game_stats gs
        LEFT JOIN staff s ON gs.staff_id = s.id
        WHERE gs.player_id = $1
      ),
      with_direct AS (
        SELECT g.*, qt.ticket_number::int AS direct_ticket
        FROM gs_base g
        LEFT JOIN queue_tickets qt ON qt.id = g.queue_ticket_id
      ),
      unresolved AS (
        SELECT * FROM with_direct WHERE direct_ticket IS NULL
      ),
      ranked AS (
        SELECT u.*, ROW_NUMBER() OVER (ORDER BY u.timestamp, u.id) AS local_rank
        FROM unresolved u
      ),
      tickets_day AS (
        SELECT qt.id, qt.ticket_number::int AS ticket_number,
               ROW_NUMBER() OVER (ORDER BY qt.created_at, qt.ticket_number) AS day_rank
        FROM queue_tickets qt
        WHERE qt.player_id = $1
      ),
      matched AS (
        SELECT r.*, td.ticket_number AS approx_ticket
        FROM ranked r
        LEFT JOIN tickets_day td ON td.day_rank = r.local_rank
      )
  SELECT w.id, w.timestamp, w.goals, w.staff_id, w.staff_name, w.competition_type, w.location,
     COALESCE(w.direct_ticket, m.approx_ticket) AS resolved_ticket,
     CASE WHEN w.direct_ticket IS NOT NULL THEN 'direct'
      WHEN m.approx_ticket IS NOT NULL THEN 'approx'
      ELSE NULL END AS ticket_source,
             w.queue_ticket_id
      FROM with_direct w
      LEFT JOIN matched m ON m.id = w.id
      ORDER BY w.timestamp DESC`;

    const statsResult = await executeQuery(statsQuery, [id]);
    const stats = statsResult.rows.map((r: any) => ({
      ...r,
      queue_ticket_id: r.resolved_ticket || r.queue_ticket_id,
    }));

    // Get player tickets
    const ticketsQuery =
      "SELECT * FROM queue_tickets WHERE player_id = $1 ORDER BY created_at DESC";

    const ticketsResult = await executeQuery(ticketsQuery, [id]);
    const tickets = ticketsResult.rows;

    // Get table structure for game_stats
    const tableStructureQuery =
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'game_stats'";
    const tableStructureResult = await executeQuery(tableStructureQuery);
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
    // Allow admin or staff to access this API
    if (
      !(req.session as any).user ||
      ((req.session as any).user.role !== "admin" &&
        (req.session as any).user.role !== "staff")
    ) {
      res.status(401).json({ success: false, message: "Unauthorized access" });
      return;
    }

    const { id } = req.params;
    const { name, phone, email, district, cityVillage, gender, age_group } =
      req.body as any;

    // Validate input
    if (!name || !phone || !district || !age_group) {
      req.flash(
        "error_msg",
        "Name, phone, district, and age group are required"
      );
      return res.redirect(`/admin/players/${id}`);
    }

    // Update player (excluding kicks_balance)
    // Handle optional photo upload (multer middleware attached globally as single('photo'))
    let photoPath: string | null = null;
    const file: any = (req as any).file;
    if (file) {
      photoPath = `/uploads/${file.filename}`;
    }

    const updateQuery = `
      UPDATE players
      SET name = $1, phone = $2, email = $3, residence = $4, city_village = $5, gender = $6, age_group = $7, photo_path = COALESCE($8, photo_path)
      WHERE id = $9
      RETURNING *
    `;

    const updateResult = await executeQuery(updateQuery, [
      name,
      phone,
      email || null,
      district,
      cityVillage || null,
      gender || null,
      age_group,
      photoPath,
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
    // Allow admin or staff to access this API
    if (
      !(req.session as any).user ||
      ((req.session as any).user.role !== "admin" &&
        (req.session as any).user.role !== "staff")
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
    const playerResult = await executeQuery(playerQuery, [id]);
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

    await executeQuery(updateQuery, [newBalance, id]);

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

    await executeQuery(logQuery, [
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
    // Allow admin or staff to access this function
    if (
      !(req.session as any).user ||
      ((req.session as any).user.role !== "admin" &&
        (req.session as any).user.role !== "staff")
    ) {
      req.flash("error_msg", "Unauthorized access");
      return res.redirect("/auth/login");
    }

    const { id } = req.params;
    const staffId = (req.session as any).user.id;

    // First check if player exists and is not already deleted
    const playerQuery =
      "SELECT * FROM players WHERE id = $1 AND deleted_at IS NULL";
    const playerResult = await executeQuery(playerQuery, [id]);
    const player = playerResult.rows[0];

    if (!player) {
      req.flash("error_msg", "Player not found or already deleted");
      return res.redirect("/admin/players");
    }

    // Begin transaction to ensure all operations are atomic
    await executeQuery("BEGIN");

    try {
      // Soft delete: Mark player as deleted but preserve all data
      // This maintains transaction history for sales reports and financial auditing
      const softDeleteQuery = `
        UPDATE players 
        SET deleted_at = timezone('UTC', NOW() AT TIME ZONE 'America/Belize'),
            deleted_by = $2
        WHERE id = $1
      `;
      await executeQuery(softDeleteQuery, [id, staffId]);

      // Cancel any active queue tickets (but keep the records for history)
      await executeQuery(
        "UPDATE queue_tickets SET status = 'cancelled' WHERE player_id = $1 AND status = 'waiting'",
        [id]
      );

      // Add a transaction record for the deletion (for audit trail)
      const auditTransactionQuery =
        "INSERT INTO transactions (player_id, kicks, amount, staff_id, team_play, created_at) VALUES ($1, 0, 0, $2, false, timezone('UTC', NOW() AT TIME ZONE 'America/Belize'))";
      await executeQuery(auditTransactionQuery, [id, staffId]);

      // Commit the transaction
      await executeQuery("COMMIT");

      req.flash(
        "success_msg",
        'Player "' +
          player.name +
          '" has been deleted. Transaction history preserved for sales reports.'
      );
      res.redirect("/admin/players");
    } catch (deleteError) {
      // Rollback transaction on error
      await executeQuery("ROLLBACK");
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
    // Allow admin or staff to access this function
    if (
      !(req.session as any).user ||
      ((req.session as any).user.role !== "admin" &&
        (req.session as any).user.role !== "staff")
    ) {
      req.flash("error_msg", "Unauthorized access");
      return res.redirect("/auth/login");
    }

    const { id } = req.params;
    const staffId = (req.session as any).user.id;

    // First check if player exists and is deleted
    const playerQuery =
      "SELECT * FROM players WHERE id = $1 AND deleted_at IS NOT NULL";
    const playerResult = await executeQuery(playerQuery, [id]);
    const player = playerResult.rows[0];

    if (!player) {
      req.flash("error_msg", "Player not found or not deleted");
      return res.redirect("/admin/players");
    }

    // Begin transaction to ensure all operations are atomic
    await executeQuery("BEGIN");

    try {
      // Check team capacity before reactivation
      const teamCapacityQuery = `
        SELECT t.id, t.name, t.team_size,
               COUNT(tm2.player_id) FILTER (WHERE p2.deleted_at IS NULL) as current_active_members,
               tm.is_captain
        FROM team_members tm
        JOIN teams t ON tm.team_id = t.id
        LEFT JOIN team_members tm2 ON t.id = tm2.team_id
        LEFT JOIN players p2 ON tm2.player_id = p2.id
        WHERE tm.player_id = $1
        GROUP BY t.id, t.name, t.team_size, tm.is_captain
      `;
      const teamCapacityResult = await executeQuery(teamCapacityQuery, [id]);

      let teamsToRemoveFrom = [];
      let teamWarnings = [];
      let availableTeams = [];

      // Check each team the player belongs to
      for (const teamData of teamCapacityResult.rows) {
        const {
          id: teamId,
          name: teamName,
          team_size,
          current_active_members,
          is_captain,
        } = teamData;

        if (team_size && current_active_members >= team_size) {
          // Team is at capacity - player will be removed from this team
          teamsToRemoveFrom.push({
            id: teamId,
            name: teamName,
            current: current_active_members,
            capacity: team_size,
            is_captain,
          });
        } else if (team_size && current_active_members === team_size - 1) {
          // Team will be at capacity after reactivation
          teamWarnings.push({
            name: teamName,
            current: current_active_members + 1,
            capacity: team_size,
          });
          availableTeams.push(teamName);
        } else {
          // Team has space
          availableTeams.push(teamName);
        }
      }

      // Restore player: Clear deletion fields
      const restoreQuery = `
        UPDATE players 
        SET deleted_at = NULL,
            deleted_by = NULL
        WHERE id = $1
      `;
      await executeQuery(restoreQuery, [id]);

      // Remove player from teams that are at capacity
      for (const team of teamsToRemoveFrom) {
        await pool.query(
          "DELETE FROM team_members WHERE team_id = $1 AND player_id = $2",
          [team.id, id]
        );
      }

      // Reactivate any cancelled queue tickets that are still current
      await pool.query(
        "UPDATE queue_tickets SET status = 'waiting' WHERE player_id = $1 AND status = 'cancelled' AND created_at > NOW() - INTERVAL '1 day'",
        [id]
      );

      // Add a transaction record for the restoration (for audit trail)
      const auditTransactionQuery =
        "INSERT INTO transactions (player_id, kicks, amount, staff_id, team_play, created_at) VALUES ($1, 0, 0, $2, false, timezone('UTC', NOW() AT TIME ZONE 'America/Belize'))";
      await pool.query(auditTransactionQuery, [id, staffId]);

      // Commit the transaction
      await pool.query("COMMIT");

      // Create comprehensive success message
      let successMessage =
        'Player "' +
        player.name +
        '" has been restored and can now log in again.';

      if (availableTeams.length > 0) {
        successMessage +=
          " They have been restored to: " + availableTeams.join(", ") + ".";
      }

      if (teamsToRemoveFrom.length > 0) {
        const removedTeamDetails = teamsToRemoveFrom
          .map(
            (team) =>
              '"' +
              team.name +
              '" (was ' +
              team.current +
              "/" +
              team.capacity +
              (team.is_captain ? ", was Captain" : "") +
              ")"
          )
          .join(", ");
        successMessage +=
          " However, they were removed from the following teams that are now at capacity: " +
          removedTeamDetails +
          ".";
      }

      if (teamWarnings.length > 0) {
        const warningDetails = teamWarnings
          .map(
            (team) =>
              '"' +
              team.name +
              '" (now ' +
              team.current +
              "/" +
              team.capacity +
              ")"
          )
          .join(", ");
        successMessage +=
          " Note: The following teams are now at full capacity: " +
          warningDetails +
          ".";
      }

      req.flash("success_msg", successMessage);
      res.redirect("/admin/players/" + id);
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
    res.redirect("/admin/players/" + req.params.id);
  }
};
