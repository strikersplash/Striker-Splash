"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTeamMembers = exports.searchTeams = exports.getPlayerDetails = exports.fixKicksBalance = exports.updatePlayerName = exports.skipQueue = exports.logGoals = exports.searchPlayerByName = exports.searchPlayerByPhone = exports.processQRScan = exports.getRefereeInterface = void 0;
const Player_1 = require("../../models/Player");
const QueueTicket_1 = require("../../models/QueueTicket");
const Team_1 = require("../../models/Team");
const db_1 = require("../../config/db");
// Display referee interface
const getRefereeInterface = async (req, res) => {
    try {
        // Only allow staff to access this page
        if (!req.session.user ||
            (req.session.user.role !== "admin" &&
                req.session.user.role !== "staff")) {
            req.flash("error_msg", "Unauthorized access");
            return res.redirect("/auth/login");
        }
        // Get competition types
        const competitionTypesResult = await Player_1.default.query("SELECT * FROM competition_types WHERE active = TRUE", []);
        const competitionTypes = competitionTypesResult.rows;
        // Get current queue position
        const currentQueuePosition = await QueueTicket_1.default.getCurrentQueuePosition();
        res.render("referee/interface", {
            title: "Referee Interface",
            competitionTypes,
            currentQueuePosition,
            user: req.session.user, // Add user info for activity persistence
        });
    }
    catch (error) {
        console.error("Referee interface error:", error);
        req.flash("error_msg", "An error occurred while loading the referee interface");
        res.redirect("/");
    }
};
exports.getRefereeInterface = getRefereeInterface;
// Process QR code scan
const processQRScan = async (req, res) => {
    try {
        // Only allow staff to access this API
        if (!req.session.user ||
            (req.session.user.role !== "admin" &&
                req.session.user.role !== "staff")) {
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
        }
        catch (error) {
            res
                .status(400)
                .json({ success: false, message: "Invalid QR code format" });
            return;
        }
        // Find player by QR hash
        const player = await Player_1.default.findById(parsedData.playerId);
        if (!player) {
            res.status(404).json({ success: false, message: "Player not found" });
            return;
        }
        // Get active queue tickets
        const activeTickets = await QueueTicket_1.default.findActiveByPlayerId(player.id);
        // Get today's kicks count
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const kicksResult = await Player_1.default.query("SELECT SUM(gs.kicks_used) as total_kicks FROM game_stats gs WHERE gs.player_id = $1 AND gs.timestamp >= $2", [player.id, today]);
        const todayKicks = parseInt(kicksResult.rows[0]?.total_kicks || "0");
        // Get team information if player is in a team
        let teamInfo = null;
        const teamResult = await Player_1.default.query("SELECT t.*, tm.is_captain FROM teams t JOIN team_members tm ON t.id = tm.team_id WHERE tm.player_id = $1", [player.id]);
        if (teamResult.rows.length > 0) {
            const team = teamResult.rows[0];
            const teamMembers = await Team_1.default.getMembers(team.id);
            // Get today's kicks for each team member
            const membersWithKicks = await Promise.all(teamMembers.map(async (member) => {
                const memberKicksResult = await Player_1.default.query("SELECT SUM(gs.kicks_used) as total_kicks FROM game_stats gs WHERE gs.player_id = $1 AND gs.timestamp >= $2", [member.player_id, today]);
                return {
                    ...member,
                    today_kicks: parseInt(memberKicksResult.rows[0]?.total_kicks || "0"),
                };
            }));
            teamInfo = {
                id: team.id,
                name: team.name,
                slug: team.slug,
                is_captain: team.is_captain,
                members: membersWithKicks,
            };
        }
        res.json({
            success: true,
            player: {
                id: player.id,
                name: player.name,
                // phone: REMOVED for security
                // email: REMOVED for security
                // residence: REMOVED for security
                // city_village: REMOVED for security
                age_group: player.age_group,
                photo_path: player.photo_path,
                kicks_balance: player.kicks_balance,
                name_change_count: player.name_change_count || 0,
                is_child_account: player.is_child_account || false,
                // parent_phone: REMOVED for security
            },
            activeTickets,
            todayKicks,
            teamInfo,
        });
    }
    catch (error) {
        console.error("QR scan error:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while processing QR code",
        });
    }
};
exports.processQRScan = processQRScan;
// Search player by phone
const searchPlayerByPhone = async (req, res) => {
    try {
        // Only allow staff to access this API
        if (!req.session.user ||
            (req.session.user.role !== "admin" &&
                req.session.user.role !== "staff")) {
            res.status(401).json({ success: false, message: "Unauthorized access" });
            return;
        }
        const { phone } = req.query;
        if (!phone || typeof phone !== "string") {
            res
                .status(400)
                .json({ success: false, message: "Phone number is required" });
            return;
        }
        // Find player by phone
        const player = await Player_1.default.findByPhone(phone);
        if (!player) {
            res.status(404).json({ success: false, message: "Player not found" });
            return;
        }
        // Get active queue tickets
        const activeTickets = await QueueTicket_1.default.findActiveByPlayerId(player.id);
        // Get today's kicks count
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const kicksResult = await Player_1.default.query("SELECT SUM(gs.kicks_used) as total_kicks FROM game_stats gs WHERE gs.player_id = $1 AND gs.timestamp >= $2", [player.id, today]);
        const todayKicks = parseInt(kicksResult.rows[0]?.total_kicks || "0");
        // Get team information if player is in a team
        let teamInfo = null;
        const teamResult = await Player_1.default.query("SELECT t.*, tm.is_captain FROM teams t JOIN team_members tm ON t.id = tm.team_id WHERE tm.player_id = $1", [player.id]);
        if (teamResult.rows.length > 0) {
            const team = teamResult.rows[0];
            const teamMembers = await Team_1.default.getMembers(team.id);
            // Get today's kicks for each team member
            const membersWithKicks = await Promise.all(teamMembers.map(async (member) => {
                const memberKicksResult = await Player_1.default.query("SELECT SUM(gs.kicks_used) as total_kicks FROM game_stats gs WHERE gs.player_id = $1 AND gs.timestamp >= $2", [member.player_id, today]);
                return {
                    ...member,
                    today_kicks: parseInt(memberKicksResult.rows[0]?.total_kicks || "0"),
                };
            }));
            teamInfo = {
                id: team.id,
                name: team.name,
                slug: team.slug,
                is_captain: team.is_captain,
                members: membersWithKicks,
            };
        }
        res.json({
            success: true,
            player: {
                id: player.id,
                name: player.name,
                // phone: REMOVED for security
                // email: REMOVED for security
                // residence: REMOVED for security
                age_group: player.age_group,
                photo_path: player.photo_path,
                kicks_balance: player.kicks_balance,
                name_change_count: player.name_change_count || 0,
            },
            activeTickets,
            todayKicks,
            teamInfo,
        });
    }
    catch (error) {
        console.error("Player search error:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while searching for player",
        });
    }
};
exports.searchPlayerByPhone = searchPlayerByPhone;
// Search player by name
const searchPlayerByName = async (req, res) => {
    try {
        // Only allow staff to access this API
        if (!req.session.user ||
            (req.session.user.role !== "admin" &&
                req.session.user.role !== "staff")) {
            res.status(401).json({ success: false, message: "Unauthorized access" });
            return;
        }
        const { name } = req.query;
        if (!name || typeof name !== "string") {
            res.status(400).json({ success: false, message: "Name is required" });
            return;
        }
        // Search for players by name (case insensitive, partial match, excluding deleted players)
        const searchResult = await Player_1.default.query("SELECT * FROM players WHERE LOWER(name) LIKE LOWER($1) AND deleted_at IS NULL ORDER BY name LIMIT 10", ["%" + name + "%"]);
        const players = searchResult.rows;
        res.json({
            success: true,
            players: players.map((player) => ({
                id: player.id,
                name: player.name,
                // phone: REMOVED for security
                // email: REMOVED for security
                // residence: REMOVED for security
                age_group: player.age_group,
                kicks_balance: player.kicks_balance,
            })),
        });
    }
    catch (error) {
        console.error("Player name search error:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while searching for players",
        });
    }
};
exports.searchPlayerByName = searchPlayerByName;
// Log goals - FIXED VERSION
const logGoals = async (req, res) => {
    console.log("KICKS BALANCE UPDATE ATTEMPT STARTING");
    try {
        // Only allow staff to access this API
        if (!req.session.user ||
            (req.session.user.role !== "admin" &&
                req.session.user.role !== "staff")) {
            res.status(401).json({ success: false, message: "Unauthorized access" });
            return;
        }
        const { playerId, ticketId, kicksUsed, goals, location, competitionType, requeue, teamPlay, teamId, teamMemberId, } = req.body;
        // Validate input
        if (!ticketId ||
            goals === undefined ||
            goals < 0 ||
            goals > 5 ||
            !kicksUsed ||
            kicksUsed < 1 ||
            kicksUsed > (teamPlay ? 3 : 5)) {
            res.status(400).json({
                success: false,
                message: `Ticket ID, valid kicks used (1-${teamPlay ? 3 : 5}), and valid goals count (0-5) are required`,
            });
            return;
        }
        // For team play, we need teamId and teamMemberId
        if (teamPlay && (!teamId || !teamMemberId)) {
            res.status(400).json({
                success: false,
                message: "Team ID and team member selection are required for team play",
            });
            return;
        }
        // For individual play, we need playerId
        if (!teamPlay && !playerId) {
            res.status(400).json({
                success: false,
                message: "Player ID is required for individual play",
            });
            return;
        }
        const actualPlayerId = teamPlay
            ? parseInt(teamMemberId)
            : parseInt(playerId);
        const ticketIdInt = parseInt(ticketId);
        const kicksUsedInt = parseInt(kicksUsed);
        const goalsInt = parseInt(goals);
        // Find the actual player who scored
        const player = await Player_1.default.findById(actualPlayerId);
        if (!player) {
            res.status(404).json({ success: false, message: "Player not found" });
            return;
        }
        // Team mode validation
        if (teamPlay) {
            // Verify the team exists and the selected member is in the team
            const teamMemberResult = await Player_1.default.query("SELECT tm.*, t.name as team_name, tm.is_captain FROM team_members tm JOIN teams t ON tm.team_id = t.id WHERE tm.team_id = $1 AND tm.player_id = $2", [parseInt(teamId), actualPlayerId]);
            if (teamMemberResult.rows.length === 0) {
                res.status(400).json({
                    success: false,
                    message: "Selected player is not a member of this team",
                });
                return;
            }
            // Get all team members for balance validation
            const teamMembers = await Team_1.default.getMembers(parseInt(teamId));
            // Check if all team members have enough balance
            const insufficientBalanceMembers = teamMembers.filter((member) => member.kicks_balance < kicksUsedInt);
            if (insufficientBalanceMembers.length > 0) {
                const memberNames = insufficientBalanceMembers
                    .map((m) => m.name)
                    .join(", ");
                res.status(400).json({
                    success: false,
                    message: "Team members with insufficient balance: " + memberNames,
                });
                return;
            }
            // Check today's kicks for the specific team member (max 3 kicks per person in team mode)
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const memberKicksResult = await Player_1.default.query("SELECT SUM(gs.kicks_used) as total_kicks FROM game_stats gs WHERE gs.player_id = $1 AND gs.timestamp >= $2 AND gs.team_play = TRUE", [actualPlayerId, today]);
            const memberTodayKicks = parseInt(memberKicksResult.rows[0]?.total_kicks || "0");
            if (memberTodayKicks + kicksUsedInt > 3) {
                res.status(400).json({
                    success: false,
                    message: player.name +
                        " would exceed 3 kicks limit in team mode today (currently used: " +
                        memberTodayKicks +
                        ")",
                });
                return;
            }
        }
        // Check if player has enough kicks
        if (player.kicks_balance < kicksUsedInt) {
            res.status(400).json({
                success: false,
                message: "Player only has " +
                    player.kicks_balance +
                    " kicks remaining but trying to use " +
                    kicksUsedInt,
            });
            return;
        }
        // Find ticket
        const ticket = await QueueTicket_1.default.findById(ticketIdInt);
        if (!ticket) {
            res
                .status(404)
                .json({ success: false, message: "Queue ticket not found" });
            return;
        }
        if (ticket.status !== "in-queue") {
            res
                .status(400)
                .json({ success: false, message: "Queue ticket is not active" });
            return;
        }
        // Start transaction to ensure data consistency
        const client = await db_1.pool.connect();
        try {
            await client.query("BEGIN");
            if (teamPlay) {
                // Team mode: deduct kicks from all team members
                const teamResult = await client.query("SELECT t.*, tm.is_captain FROM teams t JOIN team_members tm ON t.id = tm.team_id WHERE tm.player_id = $1", [actualPlayerId]);
                const team = teamResult.rows[0];
                const teamMembers = await Team_1.default.getMembers(team.id);
                // Deduct kicks from all team members
                for (const member of teamMembers) {
                    const memberPlayer = await Player_1.default.findById(member.player_id);
                    if (memberPlayer) {
                        const newMemberBalance = Math.max(0, memberPlayer.kicks_balance - kicksUsedInt);
                        await client.query("UPDATE players SET kicks_balance = $1 WHERE id = $2", [newMemberBalance, member.player_id]);
                    }
                }
            }
            else {
                // Individual mode: deduct kicks from player only
                const newBalance = Math.max(0, player.kicks_balance - kicksUsedInt);
                await client.query("UPDATE players SET kicks_balance = $1 WHERE id = $2", [newBalance, actualPlayerId]);
            }
            // 2. Mark ticket as played
            // 2. Update queue ticket status to 'played' with timestamp in Belize timezone
            const updateTicketQuery = "UPDATE queue_tickets SET status = $1, played_at = (NOW() AT TIME ZONE 'America/Belize')::timestamp WHERE id = $2";
            await client.query(updateTicketQuery, ["played", ticketIdInt]);
            // 3. Log goals in game_stats
            const insertGameStatQuery = "INSERT INTO game_stats (player_id, goals, kicks_used, staff_id, location, competition_type, queue_ticket_id, requeued, team_play, timestamp) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, (NOW() AT TIME ZONE 'America/Belize')::timestamp) RETURNING *";
            const gameStatResult = await client.query(insertGameStatQuery, [
                actualPlayerId,
                goalsInt,
                kicksUsedInt,
                parseInt(req.session.user.id),
                location || "Unknown",
                competitionType || ticket.competition_type,
                ticketIdInt,
                requeue === true,
                teamPlay === true,
            ]);
            const gameStat = gameStatResult.rows[0];
            // 4. Handle requeue if requested
            let newTicket = null;
            if (requeue) {
                try {
                    if (teamPlay) {
                        // Team mode requeue: create ticket for captain only, but mark as team play
                        const ticketNumber = await QueueTicket_1.default.addToQueue(actualPlayerId, false, // not official entry
                        true // team play status
                        );
                        newTicket = {
                            ticket_number: ticketNumber,
                            player_id: actualPlayerId,
                            team_play: true,
                        };
                        console.log("Free team requeue created:", newTicket);
                    }
                    else {
                        // Individual requeue
                        const ticketNumber = await QueueTicket_1.default.addToQueue(actualPlayerId, false, // not official entry
                        false // individual play
                        );
                        newTicket = {
                            ticket_number: ticketNumber,
                            player_id: actualPlayerId,
                            team_play: false,
                        };
                        console.log("Free individual requeue created:", newTicket);
                    }
                }
                catch (requeueError) {
                    console.error("Requeue error:", requeueError);
                    // Don't fail the entire transaction for requeue error
                }
            }
            // Commit transaction
            await client.query("COMMIT");
            // Get current queue position
            const currentQueuePosition = await QueueTicket_1.default.getCurrentQueuePosition();
            // Get updated player data to verify the balance was updated
            const updatedPlayerResult = await client.query("SELECT * FROM players WHERE id = $1", [actualPlayerId]);
            const updatedPlayer = updatedPlayerResult.rows[0];
            res.json({
                success: true,
                message: "Successfully logged " +
                    goalsInt +
                    " goals and deducted " +
                    kicksUsedInt +
                    " kicks",
                gameStat,
                newTicket,
                currentQueuePosition,
                updatedPlayer: {
                    id: updatedPlayer.id,
                    name: updatedPlayer.name,
                    kicks_balance: updatedPlayer.kicks_balance,
                },
            });
        }
        catch (transactionError) {
            // Rollback transaction on error
            await client.query("ROLLBACK");
            throw transactionError;
        }
        finally {
            client.release();
        }
    }
    catch (error) {
        console.error("Log goals error:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while logging goals",
        });
    }
};
exports.logGoals = logGoals;
// Skip current queue
const skipQueue = async (req, res) => {
    try {
        // Only allow staff to access this API
        if (!req.session.user ||
            (req.session.user.role !== "admin" &&
                req.session.user.role !== "staff")) {
            res.status(401).json({ success: false, message: "Unauthorized access" });
            return;
        }
        // Get current queue ticket and mark it as skipped
        const currentPosition = await QueueTicket_1.default.getCurrentQueuePosition();
        if (!currentPosition) {
            res
                .status(404)
                .json({ success: false, message: "No active queue tickets to skip" });
            return;
        }
        // Find the ticket with the current queue position
        const ticketQuery = "SELECT * FROM queue_tickets WHERE ticket_number = $1 AND status = 'in-queue' LIMIT 1";
        const ticketResult = await db_1.pool.query(ticketQuery, [currentPosition]);
        if (ticketResult.rows.length === 0) {
            res
                .status(404)
                .json({ success: false, message: "Current queue ticket not found" });
            return;
        }
        const currentTicket = ticketResult.rows[0];
        if (!currentTicket) {
            res
                .status(404)
                .json({ success: false, message: "No active queue tickets to skip" });
            return;
        }
        // Mark current ticket as expired (using a valid status)
        await QueueTicket_1.default.updateStatus(currentTicket.id, "expired");
        // Get new current queue position
        const newQueuePosition = await QueueTicket_1.default.getCurrentQueuePosition();
        res.json({
            success: true,
            message: "Skipped ticket #" + currentTicket.ticket_number,
            currentQueuePosition: newQueuePosition,
        });
    }
    catch (error) {
        console.error("Skip queue error:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while skipping queue",
        });
    }
};
exports.skipQueue = skipQueue;
// Update player name (referee can change up to 2 times)
const updatePlayerName = async (req, res) => {
    try {
        // Only allow staff to access this API
        if (!req.session.user ||
            (req.session.user.role !== "admin" &&
                req.session.user.role !== "staff")) {
            res.status(401).json({ success: false, message: "Unauthorized access" });
            return;
        }
        const { playerId, name } = req.body;
        // Validate input
        if (!playerId || !name) {
            res
                .status(400)
                .json({ success: false, message: "Player ID and name are required" });
            return;
        }
        const playerIdInt = parseInt(playerId);
        // Find player and check current name change count
        const player = await Player_1.default.findById(playerIdInt);
        if (!player) {
            res.status(404).json({ success: false, message: "Player not found" });
            return;
        }
        const currentNameChanges = player.name_change_count || 0;
        // Check if player has exceeded name change limit (2 changes allowed)
        if (currentNameChanges >= 2) {
            res.status(400).json({
                success: false,
                message: "Player has already used maximum allowed name changes (2)",
            });
            return;
        }
        // Update player name and increment name change count
        const client = await db_1.pool.connect();
        try {
            await client.query("BEGIN");
            const updateQuery = `
        UPDATE players 
        SET name = $1, name_change_count = $2 
        WHERE id = $3 
        RETURNING *
      `;
            const result = await client.query(updateQuery, [
                name.trim(),
                currentNameChanges + 1,
                playerIdInt,
            ]);
            await client.query("COMMIT");
            const updatedPlayer = result.rows[0];
            const remainingChanges = 2 - updatedPlayer.name_change_count;
            res.json({
                success: true,
                message: "Player name updated successfully",
                player: {
                    id: updatedPlayer.id,
                    name: updatedPlayer.name,
                    name_change_count: updatedPlayer.name_change_count,
                },
                remainingChanges,
            });
        }
        catch (transactionError) {
            await client.query("ROLLBACK");
            throw transactionError;
        }
        finally {
            client.release();
        }
    }
    catch (error) {
        console.error("Update player name error:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while updating player name",
        });
    }
};
exports.updatePlayerName = updatePlayerName;
// Fix kicks balance (admin function)
const fixKicksBalance = async (req, res) => {
    try {
        // Only allow admin to access this API
        if (!req.session.user ||
            req.session.user.role !== "admin") {
            res
                .status(401)
                .json({ success: false, message: "Admin access required" });
            return;
        }
        const { playerId, amount } = req.body;
        if (!playerId || amount === undefined) {
            res
                .status(400)
                .json({ success: false, message: "Player ID and amount are required" });
            return;
        }
        const playerIdInt = parseInt(playerId);
        const amountInt = parseInt(amount);
        // Validate amount
        if (amountInt < 0) {
            res
                .status(400)
                .json({ success: false, message: "Amount cannot be negative" });
            return;
        }
        // Direct update with proper parameterization
        const updateQuery = "UPDATE players SET kicks_balance = $1 WHERE id = $2 RETURNING *";
        const result = await db_1.pool.query(updateQuery, [amountInt, playerIdInt]);
        if (result.rows.length === 0) {
            res.status(404).json({ success: false, message: "Player not found" });
            return;
        }
        const updatedPlayer = result.rows[0];
        res.json({
            success: true,
            message: "Kicks balance set to " + amountInt,
            player: {
                id: updatedPlayer.id,
                name: updatedPlayer.name,
                kicks_balance: updatedPlayer.kicks_balance,
            },
        });
    }
    catch (error) {
        console.error("Fix kicks balance error:", error);
        res
            .status(500)
            .json({ success: false, message: "Failed to fix kicks balance" });
    }
};
exports.fixKicksBalance = fixKicksBalance;
// Get detailed player information
const getPlayerDetails = async (req, res) => {
    try {
        // Only allow staff to access this API
        if (!req.session.user ||
            (req.session.user.role !== "admin" &&
                req.session.user.role !== "staff")) {
            res.status(401).json({ success: false, message: "Unauthorized access" });
            return;
        }
        const { playerId } = req.params;
        if (!playerId) {
            res
                .status(400)
                .json({ success: false, message: "Player ID is required" });
            return;
        }
        const playerIdInt = parseInt(playerId);
        // Find player
        const player = await Player_1.default.findById(playerIdInt);
        if (!player) {
            res.status(404).json({ success: false, message: "Player not found" });
            return;
        }
        // Get active queue tickets
        const activeTickets = await QueueTicket_1.default.findActiveByPlayerId(player.id);
        // Get today's kicks count
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const kicksResult = await Player_1.default.query("SELECT SUM(gs.kicks_used) as total_kicks FROM game_stats gs WHERE gs.player_id = $1 AND gs.timestamp >= $2", [player.id, today]);
        const todayKicks = parseInt(kicksResult.rows[0]?.total_kicks || "0");
        // Get team information if player is in a team
        let teamInfo = null;
        const teamResult = await Player_1.default.query("SELECT t.*, tm.is_captain FROM teams t JOIN team_members tm ON t.id = tm.team_id WHERE tm.player_id = $1", [player.id]);
        if (teamResult.rows.length > 0) {
            const team = teamResult.rows[0];
            const teamMembers = await Team_1.default.getMembers(team.id);
            // Get today's kicks for each team member
            const membersWithKicks = await Promise.all(teamMembers.map(async (member) => {
                const memberKicksResult = await Player_1.default.query("SELECT SUM(gs.kicks_used) as total_kicks FROM game_stats gs WHERE gs.player_id = $1 AND gs.timestamp >= $2", [member.player_id, today]);
                return {
                    ...member,
                    today_kicks: parseInt(memberKicksResult.rows[0]?.total_kicks || "0"),
                };
            }));
            teamInfo = {
                id: team.id,
                name: team.name,
                slug: team.slug,
                is_captain: team.is_captain,
                members: membersWithKicks,
            };
        }
        res.json({
            success: true,
            player: {
                id: player.id,
                name: player.name,
                // phone: REMOVED for security
                // email: REMOVED for security
                // residence: REMOVED for security
                // city_village: REMOVED for security
                age_group: player.age_group,
                photo_path: player.photo_path,
                kicks_balance: player.kicks_balance,
                name_change_count: player.name_change_count || 0,
                is_child_account: player.is_child_account || false,
                // parent_phone: REMOVED for security
            },
            activeTickets,
            todayKicks,
            teamInfo,
        });
    }
    catch (error) {
        console.error("Get player details error:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while getting player details",
        });
    }
};
exports.getPlayerDetails = getPlayerDetails;
// Search teams by name for referee interface
const searchTeams = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query || typeof query !== "string") {
            res.json({ success: false, error: "Invalid search query" });
            return;
        }
        // Search teams using SQL query and include active queue tickets from ANY team member
        const searchQuery = `
      SELECT t.*, 
             p_captain.name as captain_name,
             COUNT(DISTINCT tm_all.player_id) as member_count,
             STRING_AGG(DISTINCT qt.ticket_number::text, ',') as ticket_numbers,
             STRING_AGG(DISTINCT qt.id::text, ',') as ticket_ids,
             STRING_AGG(DISTINCT qt.status, ',') as ticket_statuses,
             MIN(qt.created_at) as first_ticket_created
      FROM teams t
      JOIN team_members tm_captain ON t.id = tm_captain.team_id AND tm_captain.is_captain = true
      JOIN players p_captain ON tm_captain.player_id = p_captain.id
      LEFT JOIN team_members tm_all ON t.id = tm_all.team_id
      LEFT JOIN queue_tickets qt ON tm_all.player_id = qt.player_id AND qt.team_play = true AND qt.status = 'in-queue'
      WHERE LOWER(t.name) LIKE LOWER($1)
      GROUP BY t.id, t.name, t.created_at, t.logo_path, t.slug, p_captain.name
      ORDER BY t.name
      LIMIT 10
    `;
        const result = await db_1.pool.query(searchQuery, ["%" + query + "%"]);
        const teams = result.rows;
        res.json({ success: true, teams: teams });
    }
    catch (error) {
        console.error("Error searching teams:", error);
        res.status(500).json({
            success: false,
            error: "An error occurred while searching teams",
        });
    }
};
exports.searchTeams = searchTeams;
// Get team members for team play goal logging
const getTeamMembers = async (req, res) => {
    try {
        const { teamId } = req.params;
        console.log("Getting team members for team ID:", teamId);
        if (!teamId) {
            console.log("No team ID provided");
            res.json({ success: false, error: "Team ID is required" });
            return;
        }
        // First check if the team exists
        const teamQuery = "SELECT * FROM teams WHERE id = $1";
        const teamResult = await db_1.pool.query(teamQuery, [teamId]);
        if (teamResult.rows.length === 0) {
            console.log("Team with ID " + teamId + " does not exist");
            res.json({ success: false, error: "Team not found" });
            return;
        }
        // Get team members with player details and team name
        const membersQuery = `
      SELECT tm.player_id, tm.is_captain, tm.joined_at,
             p.name, p.phone, p.city_village, p.residence, p.age_group,
             p.photo_path, p.kicks_balance,
             COALESCE(daily_kicks.today_kicks, 0) as today_kicks,
             p.id as id,  -- Include the id field explicitly for clarity
             t.name as team_name,  -- Include team name for UI display
             t.id as team_id  -- Include team ID for proper reference
      FROM team_members tm
      JOIN players p ON tm.player_id = p.id
      JOIN teams t ON tm.team_id = t.id
      LEFT JOIN (
        SELECT player_id, 
               COUNT(*) as today_kicks
        FROM game_stats 
        WHERE DATE(timestamp) = CURRENT_DATE
        GROUP BY player_id
      ) daily_kicks ON p.id = daily_kicks.player_id
      WHERE tm.team_id = $1 AND p.deleted_at IS NULL
      ORDER BY tm.is_captain DESC, tm.joined_at ASC
    `;
        const result = await db_1.pool.query(membersQuery, [teamId]);
        const members = result.rows;
        console.log("Found " + members.length + " team members for team " + teamId);
        if (members.length === 0) {
            console.log("No members found for team " + teamId);
            res.json({ success: false, error: "Team not found or has no members" });
            return;
        }
        res.json({ success: true, members: members });
    }
    catch (error) {
        console.error("Error getting team members:", error);
        res.status(500).json({
            success: false,
            error: "An error occurred while getting team members",
        });
    }
};
exports.getTeamMembers = getTeamMembers;
