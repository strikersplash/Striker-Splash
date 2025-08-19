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
exports.getCompetitions = exports.createCompetition = void 0;
const db_1 = require("../../config/db");
/**
 * Create a new competition            // Create transaction for each team member
            for (const member of membersResult.rows) {
              await client.query(
                `INSERT INTO transactions (player_id, staff_id, amount, kicks, team_play, created_at)
                 VALUES ($1, $2, $3, $4, true, (NOW() AT TIME ZONE 'America/Belize')::timestamp)`,
                [member.player_id, staffId, cost || 0, kicks_per_player || 0]
              );
            }te POST /api/competitions
 */
const createCompetition = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        console.log("Request body:", JSON.stringify(req.body, null, 2));
        const { type, name, team_size, cost, kicks_per_player, max_teams, description, teams, selected_players, participants, // Added participants for individual competitions
         } = req.body;
        console.log("- Type:", type);
        console.log("- Name:", name);
        console.log("- Teams:", teams);
        console.log("- Participants:", participants);
        // Start a transaction
        const client = yield db_1.pool.connect();
        try {
            yield client.query("BEGIN");
            // Insert competition record
            const competitionResult = yield client.query(`INSERT INTO competitions (
          name, 
          type, 
          team_size, 
          cost, 
          kicks_per_player, 
          max_teams, 
          description,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        RETURNING id`, [name, type, team_size, cost, kicks_per_player, max_teams, description]);
            const competitionId = competitionResult.rows[0].id;
            console.log("Created competition with ID:", competitionId);
            // Get staff ID from session for sales tracking
            const staffId = (_b = (_a = req.session) === null || _a === void 0 ? void 0 : _a.user) === null || _b === void 0 ? void 0 : _b.id;
            console.log("Staff ID for sales tracking:", staffId);
            // Handle individual competition participants
            if (type === "individual" && participants && participants.length > 0) {
                console.log("Adding individual participants:", participants);
                for (const participantId of participants) {
                    console.log(`Inserting participant ${participantId} into competition ${competitionId}`);
                    yield client.query(`INSERT INTO competition_players (competition_id, player_id, goals, kicks_taken)
             VALUES ($1, $2, 0, 0)`, [competitionId, participantId]);
                    // Create transaction for sales tracking (individual competition)
                    if (staffId) {
                        yield client.query(`INSERT INTO transactions (player_id, staff_id, amount, kicks, team_play, created_at)
               VALUES ($1, $2, $3, $4, false, (NOW() AT TIME ZONE 'America/Belize')::timestamp)`, [participantId, staffId, cost || 0, kicks_per_player || 0]);
                        console.log(`✅ Transaction created for participant ${participantId}, amount: ${cost}`);
                    }
                }
                console.log("✅ All individual participants added successfully");
            }
            // If it's a team competition, add teams to the competition_teams table
            if (type === "team" && teams && teams.length > 0) {
                console.log("Adding team participants:", teams);
                const insertTeamValues = teams
                    .map((teamId) => `(${competitionId}, ${teamId})`)
                    .join(", ");
                yield client.query(`
          INSERT INTO competition_teams (competition_id, team_id)
          VALUES ${insertTeamValues}
        `);
                // Create transactions for team competition sales tracking
                if (staffId) {
                    for (const teamId of teams) {
                        // Get team member count to calculate individual transactions
                        const teamMembersResult = yield client.query(`SELECT COUNT(*) as member_count FROM team_members WHERE team_id = $1`, [teamId]);
                        const memberCount = parseInt(teamMembersResult.rows[0].member_count);
                        console.log(`Team ${teamId} has ${memberCount} members`);
                        // Get team members for individual transactions
                        const membersResult = yield client.query(`SELECT tm.player_id FROM team_members tm 
               JOIN players p ON tm.player_id = p.id 
               WHERE tm.team_id = $1 AND p.deleted_at IS NULL`, [teamId]);
                        // Create transaction for each team member
                        for (const member of membersResult.rows) {
                            yield client.query(`INSERT INTO transactions (player_id, staff_id, amount, kicks, team_play, created_at, competition_id)
                 VALUES ($1, $2, $3, $4, true, (NOW() AT TIME ZONE 'America/Belize')::timestamp, $5)`, [
                                member.player_id,
                                staffId,
                                cost || 0,
                                kicks_per_player || 0,
                                competitionId,
                            ]);
                        }
                        console.log(`✅ Created ${memberCount} transactions for team ${teamId}, amount each: ${cost}`);
                    }
                }
                console.log("✅ All teams added successfully");
            }
            // If selected players are provided, add them to the competition_players table
            if (selected_players) {
                for (const [teamId, playerIds] of Object.entries(selected_players)) {
                    if (Array.isArray(playerIds) && playerIds.length > 0) {
                        const insertPlayerValues = playerIds
                            .map((playerId) => `(${competitionId}, ${playerId}, ${teamId})`)
                            .join(", ");
                        yield client.query(`
              INSERT INTO competition_players (competition_id, player_id, team_id)
              VALUES ${insertPlayerValues}
            `);
                    }
                }
            }
            yield client.query("COMMIT");
            res.status(201).json({
                success: true,
                data: {
                    id: competitionId,
                    name,
                    type,
                },
                message: "Competition created successfully",
            });
        }
        catch (error) {
            yield client.query("ROLLBACK");
            console.error("Error in transaction:", error);
            res.status(500).json({
                success: false,
                message: "Server error during competition creation",
            });
        }
        finally {
            client.release();
        }
    }
    catch (error) {
        console.error("Error creating competition:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
});
exports.createCompetition = createCompetition;
/**
 * Get all competitions
 * @route GET /api/competitions
 */
const getCompetitions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield db_1.pool.query(`
      SELECT * FROM competitions
      ORDER BY created_at DESC
    `);
        res.status(200).json({
            success: true,
            data: result.rows,
        });
    }
    catch (error) {
        console.error("Error fetching competitions:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
});
exports.getCompetitions = getCompetitions;
