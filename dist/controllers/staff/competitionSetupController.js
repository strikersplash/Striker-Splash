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
exports.saveActiveTeamPlayers = exports.getActiveTeamPlayers = exports.getParticipantsWithLoggedGoals = exports.getCompetitionActivity = exports.logCompetitionGoals = exports.getTeamLeaderboard = exports.getIndividualLeaderboard = exports.getCompetitionLive = exports.cancelCompetition = exports.endCompetition = exports.startCompetition = exports.getCompetitionQueue = exports.createCompetition = exports.getCompetitionSetup = void 0;
const db_1 = require("../../config/db");
// Display competition setup page
const getCompetitionSetup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Only allow staff to access this page
        if (!req.session.user ||
            (req.session.user.role !== "admin" &&
                req.session.user.role !== "staff")) {
            req.flash("error_msg", "Unauthorized access");
            return res.redirect("/auth/login");
        }
        res.render("staff/competition-setup", {
            title: "Competition Setup",
            user: req.session.user,
        });
    }
    catch (error) {
        console.error("Competition setup error:", error);
        req.flash("error_msg", "An error occurred while loading competition setup");
        res.redirect("/staff/interface");
    }
});
exports.getCompetitionSetup = getCompetitionSetup;
// Create a new competition
const createCompetition = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("=== COMPETITION CREATION DEBUG ===");
        console.log("Request body:", JSON.stringify(req.body, null, 2));
        // Only allow staff to create competitions
        if (!req.session.user ||
            (req.session.user.role !== "admin" &&
                req.session.user.role !== "staff")) {
            res.status(401).json({ success: false, message: "Unauthorized access" });
            return;
        }
        const competitionData = req.body;
        // Validate required fields
        if (!competitionData.name ||
            !competitionData.type ||
            competitionData.cost < 0) {
            res.status(400).json({
                success: false,
                message: "Name, type, and valid cost are required",
            });
            return;
        }
        const client = yield db_1.pool.connect();
        try {
            yield client.query("BEGIN");
            // Create competition record
            const competitionQuery = `
        INSERT INTO competitions (
          name, type, format, team_size, cost, kicks_per_player, 
          max_participants, max_teams, description, status, created_by, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'waiting', $10, NOW())
        RETURNING *
      `;
            const competitionValues = [
                competitionData.name,
                competitionData.type,
                competitionData.format || null,
                competitionData.team_size || null,
                competitionData.cost,
                competitionData.kicks_per_player,
                competitionData.max_participants || null,
                competitionData.max_teams || null,
                competitionData.description || null,
                req.session.user.id,
            ];
            const competitionResult = yield client.query(competitionQuery, competitionValues);
            const competition = competitionResult.rows[0];
            // Add participants/teams
            console.log("=== PARTICIPANT ADDITION LOGIC ===");
            if (competitionData.type === "individual" &&
                competitionData.participants) {
                for (const participantId of competitionData.participants) {
                    console.log(`Inserting participant ${participantId} into competition ${competition.id}`);
                    const insertResult = yield client.query(`INSERT INTO competition_players (competition_id, player_id)
             VALUES ($1, $2) RETURNING *`, [competition.id, participantId]);
                }
                console.log("✓ All participants added successfully");
            }
            else if (competitionData.type === "team" && competitionData.teams) {
                console.log("✓ ADDING TEAM PARTICIPANTS");
                for (const teamId of competitionData.teams) {
                    yield client.query(`INSERT INTO competition_teams (competition_id, team_id)
             VALUES ($1, $2)`, [competition.id, teamId]);
                    // If this is an 11+ player team and we have selected players
                    if (competitionData.team_size &&
                        competitionData.team_size >= 11 &&
                        competitionData.selected_players &&
                        competitionData.selected_players[teamId]) {
                        // Store the selected players for this team
                        const selectedPlayers = competitionData.selected_players[teamId];
                        for (const playerId of selectedPlayers) {
                            yield client.query(`INSERT INTO custom_competition_active_players 
                 (competition_id, team_id, player_id, status, selected_at)
                 VALUES ($1, $2, $3, 'active', NOW())`, [competition.id, teamId, playerId]);
                        }
                    }
                }
            }
            else {
                console.log("❌ NO PARTICIPANTS ADDED - conditions not met");
            }
            yield client.query("COMMIT");
            res.json({
                success: true,
                message: "Competition created successfully",
                competition: competition,
            });
        }
        catch (error) {
            yield client.query("ROLLBACK");
            throw error;
        }
        finally {
            client.release();
        }
    }
    catch (error) {
        console.error("Error creating competition:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while creating the competition",
        });
    }
});
exports.createCompetition = createCompetition;
// Get competition queue
const getCompetitionQueue = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const query = `
      SELECT 
        c.*,
        COUNT(DISTINCT cp.player_id) as participant_count,
        COUNT(DISTINCT ct.team_id) as team_count
      FROM competitions c
      LEFT JOIN competition_players cp ON c.id = cp.competition_id
      LEFT JOIN competition_teams ct ON c.id = ct.competition_id
      WHERE c.status IN ('waiting', 'active')
      GROUP BY c.id
      ORDER BY c.created_at ASC
    `;
        const result = yield db_1.pool.query(query);
        const competitions = result.rows.map((comp) => (Object.assign(Object.assign({}, comp), { 
            // Convert string counts to numbers for proper display
            participant_count: parseInt(comp.participant_count) || 0, team_count: parseInt(comp.team_count) || 0 })));
        res.json({
            success: true,
            competitions: competitions,
        });
    }
    catch (error) {
        console.error("Error getting competition queue:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while getting the competition queue",
        });
    }
});
exports.getCompetitionQueue = getCompetitionQueue;
// Start a competition
const startCompetition = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Update competition status to active
        const updateQuery = `
      UPDATE competitions 
      SET status = 'active', started_at = NOW()
      WHERE id = $1 AND status = 'waiting'
      RETURNING *
    `;
        const result = yield db_1.pool.query(updateQuery, [id]);
        if (result.rows.length === 0) {
            res.status(404).json({
                success: false,
                message: "Competition not found or already started",
            });
            return;
        }
        res.json({
            success: true,
            message: "Competition started successfully",
            competition: result.rows[0],
        });
    }
    catch (error) {
        console.error("Error starting competition:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while starting the competition",
        });
    }
});
exports.startCompetition = startCompetition;
// End a competition
const endCompetition = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const client = yield db_1.pool.connect();
        try {
            yield client.query("BEGIN");
            // Update competition status to completed
            const updateQuery = `
        UPDATE competitions 
        SET status = 'completed', ended_at = NOW()
        WHERE id = $1 AND status = 'active'
        RETURNING *
      `;
            const result = yield client.query(updateQuery, [id]);
            if (result.rows.length === 0) {
                yield client.query("ROLLBACK");
                res.status(404).json({
                    success: false,
                    message: "Competition not found or not active",
                });
                return;
            }
            const competition = result.rows[0];
            // Note: Removed status updates for competition_players and competition_teams
            // as these tables don't have status columns. The competition status in the
            // main competitions table is sufficient to track completion.
            yield client.query("COMMIT");
            res.json({
                success: true,
                message: "Competition ended successfully",
                competition: competition,
            });
        }
        catch (error) {
            yield client.query("ROLLBACK");
            throw error;
        }
        finally {
            client.release();
        }
    }
    catch (error) {
        console.error("Error ending competition:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while ending the competition",
        });
    }
});
exports.endCompetition = endCompetition;
// Cancel a competition
const cancelCompetition = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Update competition status to cancelled
        const updateQuery = `
      UPDATE competitions 
      SET status = 'cancelled', ended_at = NOW()
      WHERE id = $1 AND status IN ('waiting', 'active')
      RETURNING *
    `;
        const result = yield db_1.pool.query(updateQuery, [id]);
        if (result.rows.length === 0) {
            res.status(404).json({
                success: false,
                message: "Competition not found or already completed",
            });
            return;
        }
        res.json({
            success: true,
            message: "Competition cancelled successfully",
            competition: result.rows[0],
        });
    }
    catch (error) {
        console.error("Error cancelling competition:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while cancelling the competition",
        });
    }
});
exports.cancelCompetition = cancelCompetition;
// Get competition live view
const getCompetitionLive = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Get competition details
        const competitionQuery = `
      SELECT * FROM competitions WHERE id = $1
    `;
        const competitionResult = yield db_1.pool.query(competitionQuery, [id]);
        if (competitionResult.rows.length === 0) {
            res.status(404).render("system/error", {
                title: "Competition Not Found",
                code: 404,
                message: "Competition not found",
            });
            return;
        }
        const competition = competitionResult.rows[0];
        if (competition.type === "individual") {
            // Get participants
            const participantsQuery = `
        SELECT 
          cp.*,
          p.name,
          p.age_group,
          p.residence
        FROM competition_players cp
        JOIN players p ON cp.player_id = p.id
        WHERE cp.competition_id = $1
        ORDER BY p.name ASC
      `;
            const participantsResult = yield db_1.pool.query(participantsQuery, [id]);
            // Calculate format based on number of players
            const participantCount = participantsResult.rows.length;
            let format = "Individual";
            if (participantCount === 2) {
                format = "1v1";
            }
            else if (participantCount === 3) {
                format = "1v1v1";
            }
            else if (participantCount > 3) {
                format = `${participantCount} Players`;
            }
            res.render("staff/competition-live", {
                title: `Live Competition: ${competition.name}`,
                competition: Object.assign(Object.assign({}, competition), { format }),
                participants: participantsResult.rows,
                teams: [],
                user: req.session.user,
            });
        }
        else {
            // Get teams
            const teamsQuery = `
        SELECT 
          ct.*,
          t.name,
          t.id as team_id,
          p.name as captain_name,
          COUNT(tm.player_id) as member_count
        FROM competition_teams ct
        JOIN teams t ON ct.team_id = t.id
        JOIN team_members tm_captain ON t.id = tm_captain.team_id AND tm_captain.is_captain = true
        JOIN players p ON tm_captain.player_id = p.id
        LEFT JOIN team_members tm ON t.id = tm.team_id
        WHERE ct.competition_id = $1
        GROUP BY ct.id, t.id, t.name, p.name
        ORDER BY t.name ASC
      `;
            const teamsResult = yield db_1.pool.query(teamsQuery, [id]);
            // Calculate format for team competitions
            const teamCount = teamsResult.rows.length;
            let format = "Team";
            if (teamCount === 2) {
                // Calculate based on team size, e.g., "5v5"
                const teamSize = competition.team_size || 5; // Default to 5 if not specified
                format = `${teamSize}v${teamSize}`;
            }
            else if (teamCount > 2) {
                format = `${teamCount} Teams`;
            }
            console.log(`Calculated team competition format: ${format}`);
            res.render("staff/competition-live", {
                title: `Live Competition: ${competition.name}`,
                competition: Object.assign(Object.assign({}, competition), { format }),
                participants: [],
                teams: teamsResult.rows,
                user: req.session.user,
            });
        }
    }
    catch (error) {
        console.error("Error loading competition live view:", error);
        res.status(500).render("system/error", {
            title: "Server Error",
            code: 500,
            message: "Failed to load competition live view",
        });
    }
});
exports.getCompetitionLive = getCompetitionLive;
// Get individual competition leaderboard
const getIndividualLeaderboard = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const query = `
      SELECT 
        cp.*,
        p.name,
        p.age_group,
        p.residence,
        COALESCE(cp.goals, 0) as goals,
        COALESCE(cp.kicks_taken, 0) as kicks_taken,
        CASE 
          WHEN COALESCE(cp.kicks_taken, 0) > 0 
          THEN ROUND((COALESCE(cp.goals, 0)::numeric / cp.kicks_taken::numeric) * 100, 1)
          ELSE 0 
        END as accuracy
      FROM competition_players cp
      JOIN players p ON cp.player_id = p.id
      WHERE cp.competition_id = $1 AND p.deleted_at IS NULL
      ORDER BY COALESCE(cp.goals, 0) DESC, COALESCE(cp.kicks_taken, 0) ASC, p.name ASC
    `;
        const result = yield db_1.pool.query(query, [id]);
        res.json({
            success: true,
            leaderboard: result.rows,
            participants: result.rows,
        });
    }
    catch (error) {
        console.error("Error getting individual leaderboard:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while getting the leaderboard",
        });
    }
});
exports.getIndividualLeaderboard = getIndividualLeaderboard;
// Get team competition leaderboard
const getTeamLeaderboard = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const query = `
      SELECT 
        ct.*,
        t.name,
        COALESCE(SUM(cp.goals), 0) as total_goals,
        COALESCE(SUM(cp.kicks_taken), 0) as total_kicks,
        CASE 
          WHEN COALESCE(SUM(cp.kicks_taken), 0) > 0 
          THEN ROUND((COALESCE(SUM(cp.goals), 0)::numeric / SUM(cp.kicks_taken)::numeric) * 100, 1)
          ELSE 0 
        END as accuracy,
        COUNT(tm.player_id) AS member_count,
        (COUNT(tm.player_id) * cc.kicks_per_player) AS max_kicks
      FROM competition_teams ct
      JOIN teams t ON ct.team_id = t.id
      JOIN competitions cc ON ct.competition_id = cc.id
      LEFT JOIN team_members tm ON t.id = tm.team_id
      LEFT JOIN players p ON tm.player_id = p.id AND p.deleted_at IS NULL
      LEFT JOIN competition_players cp ON cp.competition_id = ct.competition_id 
        AND cp.player_id = tm.player_id AND cp.team_id = t.id
      WHERE ct.competition_id = $1
      GROUP BY ct.id, t.id, t.name, cc.kicks_per_player
      ORDER BY COALESCE(SUM(cp.goals), 0) DESC, COALESCE(SUM(cp.kicks_taken), 0) ASC, t.name ASC
    `;
        const result = yield db_1.pool.query(query, [id]);
        res.json({
            success: true,
            leaderboard: result.rows,
            teams: result.rows,
        });
    }
    catch (error) {
        console.error("Error getting team leaderboard:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while getting the team leaderboard",
        });
    }
});
exports.getTeamLeaderboard = getTeamLeaderboard;
// Log goals in competition
const logCompetitionGoals = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("Log goals request body:", req.body);
        const { competitionId, participantId, teamId, kicksUsed, goals, consecutiveKicks, notes, } = req.body;
        console.log("Parsed values:", {
            competitionId,
            participantId,
            teamId,
            kicksUsed,
            goals,
            consecutiveKicks,
            notes,
        });
        // Validate input
        if (!competitionId) {
            console.error("Missing competition ID");
            res.status(400).json({
                success: false,
                message: "Competition ID is required",
            });
            return;
        }
        if (!participantId) {
            console.error("Missing participant ID");
            res.status(400).json({
                success: false,
                message: "Participant ID is required",
            });
            return;
        }
        if (kicksUsed === undefined) {
            console.error("Missing kicks used");
            res.status(400).json({
                success: false,
                message: "Kicks used is required",
            });
            return;
        }
        if (goals === undefined) {
            console.error("Missing goals");
            res.status(400).json({
                success: false,
                message: "Goals is required",
            });
            return;
        }
        const client = yield db_1.pool.connect();
        try {
            yield client.query("BEGIN");
            // Check if user session exists and get user ID
            let userId = 1; // Default to ID 1 if session doesn't exist
            try {
                if (req.session &&
                    req.session.user &&
                    req.session.user.id) {
                    userId = req.session.user.id;
                }
                else {
                    console.warn("User session not found, using default user ID");
                }
            }
            catch (error) {
                console.error("Error accessing user session:", error);
            }
            // Get competition details
            const competitionQuery = `SELECT * FROM competitions WHERE id = $1`;
            const competitionResult = yield client.query(competitionQuery, [
                competitionId,
            ]);
            if (competitionResult.rows.length === 0) {
                console.error("Competition not found with ID:", competitionId);
                yield client.query("ROLLBACK");
                res.status(404).json({
                    success: false,
                    message: "Competition not found",
                });
                return;
            }
            const competition = competitionResult.rows[0];
            let actualPlayerId;
            let teamIdToUpdate = null;
            // Make sure participantId is treated as a number if it's a valid number string
            if (participantId && !isNaN(parseInt(participantId))) {
                actualPlayerId = parseInt(participantId);
            }
            else {
                console.error("Invalid participantId:", participantId);
                yield client.query("ROLLBACK");
                res.status(400).json({
                    success: false,
                    message: "Invalid participant ID",
                });
                return;
            }
            if (competition.type === "individual") {
                // Update individual participant
                const updateQuery = `
          UPDATE competition_players 
          SET goals = goals + $1, kicks_taken = kicks_taken + $2
          WHERE id = $3
          RETURNING *
        `;
                const updateResult = yield client.query(updateQuery, [
                    goals,
                    kicksUsed,
                    participantId,
                ]);
                if (updateResult.rows.length === 0) {
                    console.error("No participant found to update");
                    yield client.query("ROLLBACK");
                    res.status(404).json({
                        success: false,
                        message: "Participant not found in competition",
                    });
                    return;
                }
                // Get the player_id from the updated participant record for activity logging
                const updatedParticipant = updateResult.rows[0];
                actualPlayerId = updatedParticipant.player_id;
                // Also insert into game_stats to make it appear in the global leaderboard
                if (goals > 0) {
                    const gameStatsQuery = `
            INSERT INTO game_stats (
              player_id, staff_id, goals, location, competition_type, 
              consecutive_kicks, kicks_used, timestamp
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, timezone('UTC', NOW() AT TIME ZONE 'America/Belize'))
            RETURNING id
          `;
                    const gameStatsParams = [
                        actualPlayerId,
                        userId, // staff_id
                        goals,
                        "Custom Competition", // location
                        "custom_competition", // competition_type
                        consecutiveKicks || null,
                        kicksUsed,
                    ];
                    try {
                        const gameStatsResult = yield client.query(gameStatsQuery, gameStatsParams);
                    }
                    catch (error) {
                        console.error("Error inserting game stats:", error);
                        // Don't fail the entire operation if game_stats fails
                    }
                }
            }
            else if (competition.type === "team") {
                // For team competitions, we need to handle two cases:
                // 1. If teamId is provided, use that directly
                // 2. If only participantId is provided, find the team the player belongs to
                if (teamId && teamId !== "null" && teamId !== "") {
                    teamIdToUpdate = parseInt(teamId);
                    console.log("Using provided teamId:", teamIdToUpdate);
                }
                else {
                    // Find which team the player belongs to
                    const findTeamQuery = `
            SELECT tm.team_id 
            FROM team_members tm
            JOIN teams t ON tm.team_id = t.id
            JOIN competition_teams cct ON cct.team_id = t.id
            WHERE tm.player_id = $1 AND cct.competition_id = $2
          `;
                    const findTeamResult = yield client.query(findTeamQuery, [
                        actualPlayerId,
                        competitionId,
                    ]);
                    if (findTeamResult.rows.length > 0) {
                        teamIdToUpdate = findTeamResult.rows[0].team_id;
                    }
                    else {
                        console.error("No team found for player:", actualPlayerId);
                        yield client.query("ROLLBACK");
                        res.status(404).json({
                            success: false,
                            message: "Player is not part of any team in this competition",
                        });
                        return;
                    }
                }
                if (teamIdToUpdate) {
                    console.log("Updating team stats for team ID:", teamIdToUpdate);
                    // For team competitions, we need to:
                    // 1. Add/update the individual player's record in competition_players
                    // 2. Update the team_stats table for global leaderboard
                    // First, check if this player already has a record in competition_players for this competition
                    const checkPlayerQuery = `
            SELECT id FROM competition_players 
            WHERE competition_id = $1 AND player_id = $2 AND team_id = $3
          `;
                    const existingPlayerResult = yield client.query(checkPlayerQuery, [
                        competitionId,
                        actualPlayerId,
                        teamIdToUpdate,
                    ]);
                    if (existingPlayerResult.rows.length > 0) {
                        // Update existing player record
                        const updatePlayerQuery = `
              UPDATE competition_players 
              SET goals = goals + $1, kicks_taken = kicks_taken + $2
              WHERE competition_id = $3 AND player_id = $4 AND team_id = $5
              RETURNING *
            `;
                        const playerUpdateResult = yield client.query(updatePlayerQuery, [
                            goals,
                            kicksUsed,
                            competitionId,
                            actualPlayerId,
                            teamIdToUpdate,
                        ]);
                    }
                    else {
                        // Insert new player record
                        const insertPlayerQuery = `
              INSERT INTO competition_players (competition_id, player_id, team_id, goals, kicks_taken)
              VALUES ($1, $2, $3, $4, $5)
              RETURNING *
            `;
                        const playerInsertResult = yield client.query(insertPlayerQuery, [
                            competitionId,
                            actualPlayerId,
                            teamIdToUpdate,
                            goals,
                            kicksUsed,
                        ]);
                    }
                    // Also update team_stats to reflect in the global team leaderboard
                    try {
                        // First, check if a record exists for this team and competition
                        const checkExistingQuery = `
              SELECT id FROM team_stats 
              WHERE team_id = $1 AND competition_id = $2
            `;
                        const existingResult = yield client.query(checkExistingQuery, [
                            teamIdToUpdate,
                            competitionId,
                        ]);
                        if (existingResult.rows.length > 0) {
                            // Update existing record
                            const updateQuery = `
                UPDATE team_stats 
                SET total_goals = total_goals + $3, 
                    total_attempts = total_attempts + $4,
                    last_updated = NOW()
                WHERE team_id = $1 AND competition_id = $2
                RETURNING *
              `;
                            const teamStatsResult = yield client.query(updateQuery, [
                                teamIdToUpdate,
                                competitionId,
                                goals,
                                kicksUsed,
                            ]);
                        }
                        else {
                            // Insert new record
                            const insertQuery = `
                INSERT INTO team_stats (
                  team_id, competition_id, total_goals, total_attempts, last_updated
                ) VALUES ($1, $2, $3, $4, NOW())
                RETURNING *
              `;
                            const teamStatsResult = yield client.query(insertQuery, [
                                teamIdToUpdate,
                                competitionId,
                                goals,
                                kicksUsed,
                            ]);
                        }
                    }
                    catch (error) {
                        console.error("Error updating team global stats:", error);
                        // Continue with the transaction - don't fail the operation if team_stats update fails
                    }
                    // Also insert into game_stats for the individual player (affects global team stats)
                    if (goals > 0) {
                        const gameStatsQuery = `
              INSERT INTO game_stats (
                player_id, staff_id, goals, location, competition_type,
                consecutive_kicks, kicks_used, team_play, timestamp
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, timezone('UTC', NOW() AT TIME ZONE 'America/Belize'))
              RETURNING id
            `;
                        const gameStatsParams = [
                            actualPlayerId,
                            userId, // staff_id
                            goals,
                            "Team Competition", // location
                            "team_competition", // competition_type
                            consecutiveKicks || null,
                            kicksUsed,
                            true, // team_play set to true for team competitions
                        ];
                        try {
                            const gameStatsResult = yield client.query(gameStatsQuery, gameStatsParams);
                        }
                        catch (error) {
                            console.error("Error inserting game stats for player:", error);
                            // Don't fail the entire operation if game_stats fails
                        }
                    }
                }
            }
            else {
                console.error("Unknown competition type:", competition.type);
                yield client.query("ROLLBACK");
                res.status(400).json({
                    success: false,
                    message: "Unknown competition type",
                });
                return;
            }
            // Log the activity
            const activityQuery = `
        INSERT INTO custom_competition_activity (
          competition_id, player_id, team_id, goals, kicks_used, 
          consecutive_kicks, notes, logged_by, logged_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        RETURNING id
      `;
            // Log user ID from session (safely)
            try {
                console.log("Session user:", req.session.user
                    ? req.session.user.id
                    : "Not available");
            }
            catch (error) {
                console.error("Error logging session info:", error);
            }
            // Activity parameters
            const activityParams = [
                parseInt(competitionId),
                actualPlayerId, // Already validated and converted to number above
                teamIdToUpdate, // Use the determined team ID for the player
                parseInt(goals),
                parseInt(kicksUsed),
                consecutiveKicks ? parseInt(consecutiveKicks) : null,
                notes || null,
                userId,
            ];
            try {
                const activityResult = yield client.query(activityQuery, activityParams);
            }
            catch (error) {
                console.error("Error inserting activity:", error);
                // Don't rollback the transaction for activity logging failures
                // The main goal logging was successful, so we should continue
            }
            yield client.query("COMMIT");
            res.json({
                success: true,
                message: "Goals logged successfully",
            });
        }
        catch (error) {
            yield client.query("ROLLBACK");
            throw error;
        }
        finally {
            client.release();
        }
    }
    catch (error) {
        console.error("Error logging competition goals:", error);
        // Log more detailed error information
        if (error instanceof Error) {
            console.error("Error message:", error.message);
            console.error("Error stack:", error.stack);
        }
        // Only send a response if one hasn't been sent yet
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: error instanceof Error
                    ? error.message
                    : "An error occurred while logging goals",
            });
        }
    }
});
exports.logCompetitionGoals = logCompetitionGoals;
// Get competition activity
const getCompetitionActivity = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const query = `
      SELECT 
        cca.*,
        p.name as player_name,
        t.name as team_name,
        TO_CHAR(cca.logged_at, 'Mon DD, HH12:MI AM') as formatted_time
      FROM custom_competition_activity cca
      JOIN players p ON cca.player_id = p.id
      LEFT JOIN teams t ON cca.team_id = t.id
      WHERE cca.competition_id = $1
      ORDER BY cca.logged_at DESC
    `;
        const result = yield db_1.pool.query(query, [id]);
        res.json({
            success: true,
            activity: result.rows,
        });
    }
    catch (error) {
        console.error("Error getting competition activity:", error);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: "An error occurred while getting competition activity",
            });
        }
    }
});
exports.getCompetitionActivity = getCompetitionActivity;
// Get participants with logged goals
const getParticipantsWithLoggedGoals = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { competitionId } = req.params;
        if (!competitionId) {
            res.status(400).json({
                success: false,
                message: "Competition ID is required",
            });
            return;
        }
        const query = `
      SELECT DISTINCT player_id, team_id
      FROM custom_competition_activity
      WHERE competition_id = $1
    `;
        const result = yield db_1.pool.query(query, [competitionId]);
        res.json({
            success: true,
            participantsWithGoals: result.rows,
        });
    }
    catch (error) {
        console.error("Error getting participants with logged goals:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while getting participants with logged goals",
        });
    }
});
exports.getParticipantsWithLoggedGoals = getParticipantsWithLoggedGoals;
// Get active players for a competition
const getActiveTeamPlayers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const competitionId = req.params.competitionId;
        // Check if competition exists and is team competition
        const competitionQuery = yield db_1.pool.query("SELECT * FROM competitions WHERE id = $1", [competitionId]);
        if (competitionQuery.rows.length === 0) {
            res.status(404).json({
                success: false,
                message: "Competition not found",
            });
            return;
        }
        const competition = competitionQuery.rows[0];
        if (competition.type !== "team") {
            res.status(400).json({
                success: false,
                message: "This is not a team competition",
            });
            return;
        }
        // Get active players for each team
        const activePlayersQuery = yield db_1.pool.query(`SELECT cp.competition_id, cp.team_id, cp.player_id, cp.status,
              p.name as player_name
       FROM custom_competition_active_players cp
       JOIN players p ON cp.player_id = p.id
       WHERE cp.competition_id = $1 AND cp.status = 'active'
       ORDER BY cp.team_id, p.name`, [competitionId]);
        res.json({
            success: true,
            competitionId,
            activePlayersByTeam: activePlayersQuery.rows,
        });
    }
    catch (error) {
        console.error("Error getting active players:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while getting active players",
        });
    }
});
exports.getActiveTeamPlayers = getActiveTeamPlayers;
// Save active players for a team in a competition
const saveActiveTeamPlayers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const competitionId = req.params.competitionId;
        const teamId = req.params.teamId;
        const { activePlayers } = req.body;
        // Validate input
        if (!activePlayers || !Array.isArray(activePlayers)) {
            res.status(400).json({
                success: false,
                message: "Invalid active players data",
            });
            return;
        }
        // Check if competition exists and is team competition
        const competitionQuery = yield db_1.pool.query("SELECT * FROM competitions WHERE id = $1", [competitionId]);
        if (competitionQuery.rows.length === 0) {
            res.status(404).json({
                success: false,
                message: "Competition not found",
            });
            return;
        }
        const competition = competitionQuery.rows[0];
        if (competition.type !== "team") {
            res.status(400).json({
                success: false,
                message: "This is not a team competition",
            });
            return;
        }
        // Check if team exists in the competition
        const teamQuery = yield db_1.pool.query(`SELECT * FROM competition_teams WHERE competition_id = $1 AND team_id = $2`, [competitionId, teamId]);
        if (teamQuery.rows.length === 0) {
            res.status(404).json({
                success: false,
                message: "Team not found in this competition",
            });
            return;
        }
        // Start transaction
        yield db_1.pool.query("BEGIN");
        // First, set all players for this team to inactive
        yield db_1.pool.query(`UPDATE custom_competition_active_players 
       SET status = 'inactive' 
       WHERE competition_id = $1 AND team_id = $2`, [competitionId, teamId]);
        // Then, for each active player, either update or insert
        for (const playerId of activePlayers) {
            // Check if player already exists in the table
            const playerQuery = yield db_1.pool.query(`SELECT * FROM custom_competition_active_players 
         WHERE competition_id = $1 AND team_id = $2 AND player_id = $3`, [competitionId, teamId, playerId]);
            if (playerQuery.rows.length > 0) {
                // Update existing record
                yield db_1.pool.query(`UPDATE custom_competition_active_players 
           SET status = 'active' 
           WHERE competition_id = $1 AND team_id = $2 AND player_id = $3`, [competitionId, teamId, playerId]);
            }
            else {
                // Insert new record
                yield db_1.pool.query(`INSERT INTO custom_competition_active_players 
           (competition_id, team_id, player_id, status) 
           VALUES ($1, $2, $3, 'active')`, [competitionId, teamId, playerId]);
            }
        }
        // Commit transaction
        yield db_1.pool.query("COMMIT");
        res.status(200).json({
            success: true,
            message: "Active players updated successfully",
        });
    }
    catch (error) {
        // Rollback transaction in case of error
        yield db_1.pool.query("ROLLBACK");
        console.error("Error saving active team players:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while saving active team players",
        });
    }
});
exports.saveActiveTeamPlayers = saveActiveTeamPlayers;
