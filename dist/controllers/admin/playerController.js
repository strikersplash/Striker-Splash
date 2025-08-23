"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.restorePlayer = exports.deletePlayer = exports.updateKicksBalance = exports.updatePlayer = exports.getPlayerDetails = exports.getPlayerManagement = void 0;
const db_1 = require("../../config/db");
// Display player management page
const getPlayerManagement = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Allow admin or staff to access this page
        if (!req.session.user ||
            (req.session.user.role !== "admin" && req.session.user.role !== "staff")) {
            req.flash("error_msg", "Unauthorized access");
            return res.redirect("/auth/login");
        }
        // Get search query and show deleted filter
        const { search, showDeleted } = req.query;
        // Build query - by default, only show active (non-deleted) players
        let query = "SELECT * FROM players";
        const params = [];
        // Base condition: filter deleted players unless specifically requested
        let whereConditions = [];
        if (showDeleted !== "true") {
            whereConditions.push("deleted_at IS NULL");
        }
        if (search) {
            whereConditions.push("(name ILIKE $" +
                (params.length + 1) +
                " OR phone LIKE $" +
                (params.length + 2) +
                " OR email ILIKE $" +
                (params.length + 3) +
                ")");
            const searchParam = `%${search}%`;
            params.push(searchParam, searchParam, searchParam);
        }
        if (whereConditions.length > 0) {
            query += " WHERE " + whereConditions.join(" AND ");
        }
        query += " ORDER BY name LIMIT 100";
        // Get players
        const playersResult = yield db_1.pool.query(query, params);
        const players = playersResult.rows.map((p) => ({
            id: p.id,
            name: p.name,
            photo_path: p.photo_path,
            profile_picture: p.photo_path, // Map photo_path to profile_picture
        }));
        res.render("admin/player-management", {
            title: "Player Management",
            players,
            search: search || "",
            showDeleted: showDeleted === "true",
            activePage: "players",
        });
    }
    catch (error) {
        console.error("Player management error:", error);
        req.flash("error_msg", "An error occurred while loading player management");
        res.redirect("/admin/dashboard");
    }
});
exports.getPlayerManagement = getPlayerManagement;
// Display player details
const getPlayerDetails = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Allow admin or staff to access this page
        if (!req.session.user ||
            (req.session.user.role !== "admin" && req.session.user.role !== "staff")) {
            req.flash("error_msg", "Unauthorized access");
            return res.redirect("/auth/login");
        }
        const { id } = req.params;
        // Get player (including soft-deleted ones for admin review)
        const playerQuery = "SELECT * FROM players WHERE id = $1";
        const playerResult = yield db_1.pool.query(playerQuery, [id]);
        const player = playerResult.rows[0];
        if (!player) {
            req.flash("error_msg", "Player not found");
            return res.redirect("/admin/players");
        }
        // Debug player profile picture
        // Query to check what tables exist in the database
        const tablesQuery = "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'";
        const tablesResult = yield db_1.pool.query(tablesQuery);
        const tables = tablesResult.rows.map((r) => r.table_name);
        // Using correct table name (game_stats) as shown in the debug output
        const statsQuery = "SELECT gs.*, s.name as staff_name FROM game_stats gs LEFT JOIN staff s ON gs.staff_id = s.id WHERE gs.player_id = $1 ORDER BY gs.timestamp DESC";
        const statsResult = yield db_1.pool.query(statsQuery, [id]);
        const stats = statsResult.rows;
        // Get player tickets
        const ticketsQuery = "SELECT * FROM queue_tickets WHERE player_id = $1 ORDER BY created_at DESC";
        const ticketsResult = yield db_1.pool.query(ticketsQuery, [id]);
        const tickets = ticketsResult.rows;
        // Get table structure for game_stats
        const tableStructureQuery = "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'game_stats'";
        const tableStructureResult = yield db_1.pool.query(tableStructureQuery);
        res.render("admin/player-details", {
            title: `Player: ${player.name}`,
            player,
            stats,
            tickets,
            activePage: "players",
        });
    }
    catch (error) {
        console.error("Player details error:", error);
        req.flash("error_msg", "An error occurred while loading player details");
        res.redirect("/admin/players");
    }
});
exports.getPlayerDetails = getPlayerDetails;
// Update player
const updatePlayer = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Allow admin or staff to access this API
        if (!req.session.user ||
            (req.session.user.role !== "admin" && req.session.user.role !== "staff")) {
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
        const updateResult = yield db_1.pool.query(updateQuery, [
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
    }
    catch (error) {
        console.error("Update player error:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while updating player",
        });
    }
});
exports.updatePlayer = updatePlayer;
// Update kicks balance
const updateKicksBalance = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Allow admin or staff to access this API
        if (!req.session.user ||
            (req.session.user.role !== "admin" && req.session.user.role !== "staff")) {
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
        const playerResult = yield db_1.pool.query(playerQuery, [id]);
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
        yield db_1.pool.query(updateQuery, [newBalance, id]);
        // Log the kicks balance update to transactions table
        const logQuery = `
      INSERT INTO transactions (player_id, kicks, amount, staff_id, team_play, created_at)
      VALUES ($1, $2, $3, $4, false, timezone('UTC', NOW() AT TIME ZONE 'America/Belize'))
    `;
        const changeAmount = operation === "add"
            ? parseInt(amount)
            : operation === "subtract"
                ? -parseInt(amount)
                : newBalance - currentBalance;
        yield db_1.pool.query(logQuery, [
            id,
            changeAmount,
            0, // amount field (for kicks transactions, amount is usually 0)
            req.session.user.id,
        ]);
        req.flash("success_msg", `Kicks balance ${operation === "set"
            ? "set to"
            : operation === "add"
                ? "increased by"
                : "decreased by"} ${amount}. New balance: ${newBalance}`);
        res.redirect(`/admin/players/${id}`);
    }
    catch (error) {
        console.error("Update kicks balance error:", error);
        req.flash("error_msg", "An error occurred while updating kicks balance");
        res.redirect(`/admin/players/${req.params.id}`);
    }
});
exports.updateKicksBalance = updateKicksBalance;
// Delete player account (soft delete - preserves transaction history for sales reports)
const deletePlayer = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Allow admin or staff to access this function
        if (!req.session.user ||
            (req.session.user.role !== "admin" && req.session.user.role !== "staff")) {
            req.flash("error_msg", "Unauthorized access");
            return res.redirect("/auth/login");
        }
        const { id } = req.params;
        const staffId = req.session.user.id;
        // First check if player exists and is not already deleted
        const playerQuery = "SELECT * FROM players WHERE id = $1 AND deleted_at IS NULL";
        const playerResult = yield db_1.pool.query(playerQuery, [id]);
        const player = playerResult.rows[0];
        if (!player) {
            req.flash("error_msg", "Player not found or already deleted");
            return res.redirect("/admin/players");
        }
        // Begin transaction to ensure all operations are atomic
        yield db_1.pool.query("BEGIN");
        try {
            // Soft delete: Mark player as deleted but preserve all data
            // This maintains transaction history for sales reports and financial auditing
            const softDeleteQuery = `
        UPDATE players 
        SET deleted_at = timezone('UTC', NOW() AT TIME ZONE 'America/Belize'),
            deleted_by = $2
        WHERE id = $1
      `;
            yield db_1.pool.query(softDeleteQuery, [id, staffId]);
            // Cancel any active queue tickets (but keep the records for history)
            yield db_1.pool.query("UPDATE queue_tickets SET status = 'cancelled' WHERE player_id = $1 AND status = 'waiting'", [id]);
            // Add a transaction record for the deletion (for audit trail)
            const auditTransactionQuery = "INSERT INTO transactions (player_id, kicks, amount, staff_id, team_play, created_at) VALUES ($1, 0, 0, $2, false, timezone('UTC', NOW() AT TIME ZONE 'America/Belize'))";
            yield db_1.pool.query(auditTransactionQuery, [id, staffId]);
            // Commit the transaction
            yield db_1.pool.query("COMMIT");
            req.flash("success_msg", 'Player "' +
                player.name +
                '" has been deleted. Transaction history preserved for sales reports.');
            res.redirect("/admin/players");
        }
        catch (deleteError) {
            // Rollback transaction on error
            yield db_1.pool.query("ROLLBACK");
            throw deleteError;
        }
    }
    catch (error) {
        console.error("Delete player error:", error);
        req.flash("error_msg", "An error occurred while deleting the player account.");
        res.redirect(`/admin/players/${req.params.id}`);
    }
});
exports.deletePlayer = deletePlayer;
// Restore deleted player account
const restorePlayer = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Allow admin or staff to access this function
        if (!req.session.user ||
            (req.session.user.role !== "admin" && req.session.user.role !== "staff")) {
            req.flash("error_msg", "Unauthorized access");
            return res.redirect("/auth/login");
        }
        const { id } = req.params;
        const staffId = req.session.user.id;
        // First check if player exists and is deleted
        const playerQuery = "SELECT * FROM players WHERE id = $1 AND deleted_at IS NOT NULL";
        const playerResult = yield db_1.pool.query(playerQuery, [id]);
        const player = playerResult.rows[0];
        if (!player) {
            req.flash("error_msg", "Player not found or not deleted");
            return res.redirect("/admin/players");
        }
        // Begin transaction to ensure all operations are atomic
        yield db_1.pool.query("BEGIN");
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
            const teamCapacityResult = yield db_1.pool.query(teamCapacityQuery, [id]);
            let teamsToRemoveFrom = [];
            let teamWarnings = [];
            let availableTeams = [];
            // Check each team the player belongs to
            for (const teamData of teamCapacityResult.rows) {
                const { id: teamId, name: teamName, team_size, current_active_members, is_captain, } = teamData;
                if (team_size && current_active_members >= team_size) {
                    // Team is at capacity - player will be removed from this team
                    teamsToRemoveFrom.push({
                        id: teamId,
                        name: teamName,
                        current: current_active_members,
                        capacity: team_size,
                        is_captain,
                    });
                }
                else if (team_size && current_active_members === team_size - 1) {
                    // Team will be at capacity after reactivation
                    teamWarnings.push({
                        name: teamName,
                        current: current_active_members + 1,
                        capacity: team_size,
                    });
                    availableTeams.push(teamName);
                }
                else {
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
            yield db_1.pool.query(restoreQuery, [id]);
            // Remove player from teams that are at capacity
            for (const team of teamsToRemoveFrom) {
                yield db_1.pool.query("DELETE FROM team_members WHERE team_id = $1 AND player_id = $2", [team.id, id]);
            }
            // Reactivate any cancelled queue tickets that are still current
            yield db_1.pool.query("UPDATE queue_tickets SET status = 'waiting' WHERE player_id = $1 AND status = 'cancelled' AND created_at > NOW() - INTERVAL '1 day'", [id]);
            // Add a transaction record for the restoration (for audit trail)
            const auditTransactionQuery = "INSERT INTO transactions (player_id, kicks, amount, staff_id, team_play, created_at) VALUES ($1, 0, 0, $2, false, timezone('UTC', NOW() AT TIME ZONE 'America/Belize'))";
            yield db_1.pool.query(auditTransactionQuery, [id, staffId]);
            // Commit the transaction
            yield db_1.pool.query("COMMIT");
            // Create comprehensive success message
            let successMessage = 'Player "' +
                player.name +
                '" has been restored and can now log in again.';
            if (availableTeams.length > 0) {
                successMessage +=
                    " They have been restored to: " + availableTeams.join(", ") + ".";
            }
            if (teamsToRemoveFrom.length > 0) {
                const removedTeamDetails = teamsToRemoveFrom
                    .map((team) => '"' +
                    team.name +
                    '" (was ' +
                    team.current +
                    "/" +
                    team.capacity +
                    (team.is_captain ? ", was Captain" : "") +
                    ")")
                    .join(", ");
                successMessage +=
                    " However, they were removed from the following teams that are now at capacity: " +
                        removedTeamDetails +
                        ".";
            }
            if (teamWarnings.length > 0) {
                const warningDetails = teamWarnings
                    .map((team) => '"' +
                    team.name +
                    '" (now ' +
                    team.current +
                    "/" +
                    team.capacity +
                    ")")
                    .join(", ");
                successMessage +=
                    " Note: The following teams are now at full capacity: " +
                        warningDetails +
                        ".";
            }
            req.flash("success_msg", successMessage);
            res.redirect("/admin/players/" + id);
        }
        catch (restoreError) {
            // Rollback transaction on error
            yield db_1.pool.query("ROLLBACK");
            throw restoreError;
        }
    }
    catch (error) {
        console.error("Restore player error:", error);
        req.flash("error_msg", "An error occurred while restoring the player account.");
        res.redirect("/admin/players/" + req.params.id);
    }
});
exports.restorePlayer = restorePlayer;
