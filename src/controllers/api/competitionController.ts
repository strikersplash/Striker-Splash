import { Request, Response } from "express";
import { pool } from "../../config/db";

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
export const createCompetition = async (req: Request, res: Response) => {
  try {
    console.log("=== API COMPETITION CREATION DEBUG ===");
    console.log("Request body:", JSON.stringify(req.body, null, 2));

    const {
      type,
      name,
      team_size,
      cost,
      kicks_per_player,
      max_teams,
      description,
      teams,
      selected_players,
      participants, // Added participants for individual competitions
    } = req.body;

    console.log("Parsed data:");
    console.log("- Type:", type);
    console.log("- Name:", name);
    console.log("- Teams:", teams);
    console.log("- Participants:", participants);
    console.log("- Selected players:", selected_players);

    // Start a transaction
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Insert competition record
      const competitionResult = await client.query(
        `INSERT INTO competitions (
          name, 
          type, 
          team_size, 
          cost, 
          kicks_per_player, 
          max_teams, 
          description,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        RETURNING id`,
        [name, type, team_size, cost, kicks_per_player, max_teams, description]
      );

      const competitionId = competitionResult.rows[0].id;
      console.log("Created competition with ID:", competitionId);

      // Get staff ID from session for sales tracking
      const staffId = (req.session as any)?.user?.id;
      console.log("Staff ID for sales tracking:", staffId);

      // Handle individual competition participants
      if (type === "individual" && participants && participants.length > 0) {
        console.log("Adding individual participants:", participants);

        for (const participantId of participants) {
          console.log(
            `Inserting participant ${participantId} into competition ${competitionId}`
          );
          await client.query(
            `INSERT INTO competition_players (competition_id, player_id, goals, kicks_taken)
             VALUES ($1, $2, 0, 0)`,
            [competitionId, participantId]
          );

          // Create transaction for sales tracking (individual competition)
          if (staffId) {
            await client.query(
              `INSERT INTO transactions (player_id, staff_id, amount, kicks, team_play, created_at)
               VALUES ($1, $2, $3, $4, false, (NOW() AT TIME ZONE 'America/Belize')::timestamp)`,
              [participantId, staffId, cost || 0, kicks_per_player || 0]
            );
            console.log(
              `✅ Transaction created for participant ${participantId}, amount: ${cost}`
            );
          }
        }

        console.log("✅ All individual participants added successfully");
      }

      // If it's a team competition, add teams to the competition_teams table
      if (type === "team" && teams && teams.length > 0) {
        console.log("Adding team participants:", teams);
        const insertTeamValues = teams
          .map((teamId: number) => `(${competitionId}, ${teamId})`)
          .join(", ");

        await client.query(`
          INSERT INTO competition_teams (competition_id, team_id)
          VALUES ${insertTeamValues}
        `);

        // Create transactions for team competition sales tracking
        if (staffId) {
          for (const teamId of teams) {
            // Get team member count to calculate individual transactions
            const teamMembersResult = await client.query(
              `SELECT COUNT(*) as member_count FROM team_members WHERE team_id = $1`,
              [teamId]
            );
            const memberCount = parseInt(
              teamMembersResult.rows[0].member_count
            );
            console.log(`Team ${teamId} has ${memberCount} members`);

            // Get team members for individual transactions
            const membersResult = await client.query(
              `SELECT player_id FROM team_members WHERE team_id = $1`,
              [teamId]
            );

            // Create transaction for each team member
            for (const member of membersResult.rows) {
              await client.query(
                `INSERT INTO transactions (player_id, staff_id, amount, kicks, team_play, created_at, competition_id)
                 VALUES ($1, $2, $3, $4, true, (NOW() AT TIME ZONE 'America/Belize')::timestamp, $5)`,
                [
                  member.player_id,
                  staffId,
                  cost || 0,
                  kicks_per_player || 0,
                  competitionId,
                ]
              );
            }
            console.log(
              `✅ Created ${memberCount} transactions for team ${teamId}, amount each: ${cost}`
            );
          }
        }

        console.log("✅ All teams added successfully");
      }

      // If selected players are provided, add them to the competition_players table
      if (selected_players) {
        console.log("Adding selected players for teams:", selected_players);
        for (const [teamId, playerIds] of Object.entries(selected_players)) {
          if (Array.isArray(playerIds) && playerIds.length > 0) {
            const insertPlayerValues = playerIds
              .map(
                (playerId: number) =>
                  `(${competitionId}, ${playerId}, ${teamId})`
              )
              .join(", ");

            await client.query(`
              INSERT INTO competition_players (competition_id, player_id, team_id)
              VALUES ${insertPlayerValues}
            `);
          }
        }
        console.log("✅ All selected players added successfully");
      }

      await client.query("COMMIT");

      res.status(201).json({
        success: true,
        data: {
          id: competitionId,
          name,
          type,
        },
        message: "Competition created successfully",
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error in transaction:", error);
      res.status(500).json({
        success: false,
        message: "Server error during competition creation",
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error creating competition:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * Get all competitions
 * @route GET /api/competitions
 */
export const getCompetitions = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT * FROM competitions
      ORDER BY created_at DESC
    `);

    res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error fetching competitions:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
