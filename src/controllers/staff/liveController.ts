import { Request, Response } from "express";
import { KickLog } from "../../models/KickLog";
import { Match } from "../../models/Match";
import { SoloCompetition } from "../../models/SoloCompetition";
import { pool } from "../../config/db";

// Log kicks in match competition
export const logMatchKick = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Only allow staff/admin to log kicks
    if (
      !(req.session as any).user ||
      !["admin", "staff"].includes((req.session as any).user.role)
    ) {
      res.status(401).json({ success: false, message: "Unauthorized access" });
      return;
    }

    const {
      matchId,
      playerId,
      teamId,
      goals,
      kicksUsed,
      location,
      consecutiveKicks,
      notes,
    } = req.body;

    // Validate required fields
    if (!matchId || !playerId || !teamId || goals === undefined || !kicksUsed) {
      res.status(400).json({
        success: false,
        message:
          "Match ID, player ID, team ID, goals, and kicks used are required",
      });
      return;
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Check if match exists and is active
      const match = await Match.findById(parseInt(matchId));
      if (!match) {
        await client.query("ROLLBACK");
        res.status(404).json({
          success: false,
          message: "Match not found",
        });
        return;
      }

      if (match.status !== "active") {
        await client.query("ROLLBACK");
        res.status(400).json({
          success: false,
          message: "Match is not currently active",
        });
        return;
      }

      // Check if player has kicks remaining
      const participantQuery = `
        SELECT kicks_remaining, total_kicks_used, is_active 
        FROM match_participants 
        WHERE match_id = $1 AND player_id = $2 AND is_active = true
      `;

      const participantResult = await client.query(participantQuery, [
        matchId,
        playerId,
      ]);

      if (participantResult.rows.length === 0) {
        await client.query("ROLLBACK");
        res.status(400).json({
          success: false,
          message: "Player is not an active participant in this match",
        });
        return;
      }

      const participant = participantResult.rows[0];

      if (participant.kicks_remaining < parseInt(kicksUsed)) {
        await client.query("ROLLBACK");
        res.status(400).json({
          success: false,
          message: `Player only has ${participant.kicks_remaining} kicks remaining`,
        });
        return;
      }

      // Log the kick
      const kickLogData = {
        player_id: parseInt(playerId),
        staff_id: (req.session as any).user.id,
        competition_type: "match" as const,
        match_id: parseInt(matchId),
        goals: parseInt(goals),
        kicks_used: parseInt(kicksUsed),
        location,
        team_id: parseInt(teamId),
        consecutive_kicks: consecutiveKicks
          ? parseInt(consecutiveKicks)
          : undefined,
        notes,
      };

      const kickLog = await KickLog.create(kickLogData);

      // Update participant kicks
      await Match.updateParticipantKicks(
        parseInt(matchId),
        parseInt(playerId),
        parseInt(kicksUsed)
      );

      // Update match scores
      const updateScoreQuery = `
        INSERT INTO match_scores (match_id, team_id, total_goals, total_kicks, accuracy_percentage)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (match_id, team_id) 
        DO UPDATE SET 
          total_goals = match_scores.total_goals + $3,
          total_kicks = match_scores.total_kicks + $4,
          accuracy_percentage = CASE 
            WHEN (match_scores.total_kicks + $4) > 0 
            THEN ROUND(((match_scores.total_goals + $3)::DECIMAL / (match_scores.total_kicks + $4)) * 100, 2)
            ELSE 0 
          END,
          updated_at = CURRENT_TIMESTAMP
      `;

      await client.query(updateScoreQuery, [
        matchId,
        teamId,
        parseInt(goals),
        parseInt(kicksUsed),
        parseInt(kicksUsed) > 0
          ? Math.round((parseInt(goals) / parseInt(kicksUsed)) * 100 * 100) /
            100
          : 0,
      ]);

      await client.query("COMMIT");

      // Check if player has reached the 5-kick limit
      const updatedParticipantResult = await client.query(participantQuery, [
        matchId,
        playerId,
      ]);
      const updatedParticipant = updatedParticipantResult.rows[0];

      const isPlayerFinished = updatedParticipant.kicks_remaining <= 0;

      res.json({
        success: true,
        message: "Kick logged successfully",
        kickLog,
        isPlayerFinished,
        remainingKicks: updatedParticipant.kicks_remaining,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error logging match kick:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while logging the kick",
    });
  }
};

// Log kicks in solo competition
export const logSoloKick = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Only allow staff/admin to log kicks
    if (
      !(req.session as any).user ||
      !["admin", "staff"].includes((req.session as any).user.role)
    ) {
      res.status(401).json({ success: false, message: "Unauthorized access" });
      return;
    }

    const {
      competitionId,
      playerId,
      goals,
      kicksUsed,
      location,
      consecutiveKicks,
      notes,
    } = req.body;

    // Validate required fields
    if (!competitionId || !playerId || goals === undefined || !kicksUsed) {
      res.status(400).json({
        success: false,
        message:
          "Competition ID, player ID, goals, and kicks used are required",
      });
      return;
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Check if competition exists and is active
      const competition = await SoloCompetition.findById(
        parseInt(competitionId)
      );
      if (!competition) {
        await client.query("ROLLBACK");
        res.status(404).json({
          success: false,
          message: "Solo competition not found",
        });
        return;
      }

      if (competition.status !== "active") {
        await client.query("ROLLBACK");
        res.status(400).json({
          success: false,
          message: "Solo competition is not currently active",
        });
        return;
      }

      // Check if player has kicks remaining
      const participantQuery = `
        SELECT kicks_remaining, total_kicks_used, is_active 
        FROM solo_participants 
        WHERE solo_competition_id = $1 AND player_id = $2 AND is_active = true
      `;

      const participantResult = await client.query(participantQuery, [
        competitionId,
        playerId,
      ]);

      if (participantResult.rows.length === 0) {
        await client.query("ROLLBACK");
        res.status(400).json({
          success: false,
          message:
            "Player is not an active participant in this solo competition",
        });
        return;
      }

      const participant = participantResult.rows[0];

      if (participant.kicks_remaining < parseInt(kicksUsed)) {
        await client.query("ROLLBACK");
        res.status(400).json({
          success: false,
          message: `Player only has ${participant.kicks_remaining} kicks remaining`,
        });
        return;
      }

      // Log the kick
      const kickLogData = {
        player_id: parseInt(playerId),
        staff_id: (req.session as any).user.id,
        competition_type: "solo" as const,
        solo_competition_id: parseInt(competitionId),
        goals: parseInt(goals),
        kicks_used: parseInt(kicksUsed),
        location,
        consecutive_kicks: consecutiveKicks
          ? parseInt(consecutiveKicks)
          : undefined,
        notes,
      };

      const kickLog = await KickLog.create(kickLogData);

      // Update participant kicks
      await SoloCompetition.updateParticipantKicks(
        parseInt(competitionId),
        parseInt(playerId),
        parseInt(kicksUsed)
      );

      await client.query("COMMIT");

      // Check if player has reached the 5-kick limit
      const updatedParticipantResult = await client.query(participantQuery, [
        competitionId,
        playerId,
      ]);
      const updatedParticipant = updatedParticipantResult.rows[0];

      const isPlayerFinished = updatedParticipant.kicks_remaining <= 0;

      res.json({
        success: true,
        message: "Kick logged successfully",
        kickLog,
        isPlayerFinished,
        remainingKicks: updatedParticipant.kicks_remaining,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error logging solo kick:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while logging the kick",
    });
  }
};

// Get live match data for staff console
export const getLiveMatchData = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const match = await Match.findById(parseInt(id));

    if (!match) {
      res.status(404).json({
        success: false,
        message: "Match not found",
      });
      return;
    }

    // Get participants with current kick status
    const participants = await Match.getParticipants(match.id);

    // Get match statistics
    const stats = await KickLog.getMatchStats(match.id);

    // Get recent kicks (last 10)
    const recentKicks = await KickLog.findByMatch(match.id);

    res.json({
      success: true,
      match,
      participants,
      stats,
      recentKicks: recentKicks.slice(0, 10),
    });
  } catch (error) {
    console.error("Error fetching live match data:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching live match data",
    });
  }
};

// Get live solo competition data for staff console
export const getLiveSoloData = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const competition = await SoloCompetition.findById(parseInt(id));

    if (!competition) {
      res.status(404).json({
        success: false,
        message: "Solo competition not found",
      });
      return;
    }

    // Get participants with current kick status
    const participants = await SoloCompetition.getParticipants(competition.id);

    // Get competition statistics/leaderboard
    const leaderboard = await KickLog.getSoloCompetitionStats(competition.id);

    // Get recent kicks (last 10)
    const recentKicks = await KickLog.findBySoloCompetition(competition.id);

    res.json({
      success: true,
      competition,
      participants,
      leaderboard,
      recentKicks: recentKicks.slice(0, 10),
    });
  } catch (error) {
    console.error("Error fetching live solo competition data:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching live solo competition data",
    });
  }
};

// Get today's activity for staff dashboard
export const getTodaysActivity = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const activity = await KickLog.getActivity(todayStart, todayEnd);

    res.json({
      success: true,
      activity,
    });
  } catch (error) {
    console.error("Error fetching today's activity:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching today's activity",
    });
  }
};

// ===== UNIFIED KICK LOGGING =====

export const logKick = async (req: Request, res: Response): Promise<void> => {
  try {
    const { match_id, solo_comp_id, player_id, successful } = req.body;

    // Validate that we have either match_id or solo_comp_id, but not both
    if ((!match_id && !solo_comp_id) || (match_id && solo_comp_id)) {
      res.status(400).json({
        success: false,
        message: "Must specify either match_id or solo_comp_id, but not both",
      });
      return;
    }

    if (match_id) {
      // Use existing match kick logging
      req.body = { player_id, successful };
      req.params = { id: match_id.toString() };
      await logMatchKick(req, res);
    } else if (solo_comp_id) {
      // Use existing solo kick logging
      req.body = { player_id, successful };
      req.params = { id: solo_comp_id.toString() };
      await logSoloKick(req, res);
    }
  } catch (error) {
    console.error("Error logging kick:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while logging the kick",
    });
  }
};

export const getMatchKicks = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const kicksResult = await pool.query(
      `
      SELECT 
        kl.*,
        p.first_name || ' ' || p.last_name as player_name,
        t.name as team_name
      FROM kick_log kl
      JOIN players p ON kl.player_id = p.id
      LEFT JOIN teams t ON p.team_id = t.id
      WHERE kl.match_id = $1
      ORDER BY kl.created_at DESC
    `,
      [id]
    );

    res.json(kicksResult.rows);
  } catch (error) {
    console.error("Error fetching match kicks:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch match kicks",
    });
  }
};

export const getSoloKicks = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const kicksResult = await pool.query(
      `
      SELECT 
        kl.*,
        p.first_name || ' ' || p.last_name as player_name
      FROM kick_log kl
      JOIN players p ON kl.player_id = p.id
      WHERE kl.solo_comp_id = $1
      ORDER BY kl.created_at DESC
    `,
      [id]
    );

    res.json(kicksResult.rows);
  } catch (error) {
    console.error("Error fetching solo kicks:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch solo kicks",
    });
  }
};

export const deleteKick = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    // Only allow staff/admin to delete kicks
    if (
      !(req.session as any).user ||
      !["admin", "staff"].includes((req.session as any).user.role)
    ) {
      res.status(401).json({ success: false, message: "Unauthorized access" });
      return;
    }

    const client = await pool.connect();
    try {
      // Get kick details before deleting for score updates
      const kickResult = await client.query(
        "SELECT * FROM kick_log WHERE id = $1",
        [id]
      );

      if (kickResult.rows.length === 0) {
        res.status(404).json({ success: false, message: "Kick not found" });
        return;
      }

      const kick = kickResult.rows[0];

      // Delete the kick
      await client.query("DELETE FROM kick_log WHERE id = $1", [id]);

      // Update scores if the kick was successful
      if (kick.successful) {
        if (kick.match_id) {
          // Update team score in match
          await client.query(
            `
            UPDATE match_participants 
            SET score = GREATEST(0, score - 1) 
            WHERE match_id = $1 AND team_id = (
              SELECT team_id FROM players WHERE id = $2
            )
          `,
            [kick.match_id, kick.player_id]
          );
        } else if (kick.solo_comp_id) {
          // Update player score in solo competition
          await client.query(
            `
            UPDATE solo_participants 
            SET score = GREATEST(0, score - 1) 
            WHERE solo_comp_id = $1 AND player_id = $2
          `,
            [kick.solo_comp_id, kick.player_id]
          );
        }
      }

      res.json({ success: true, message: "Kick deleted successfully" });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error deleting kick:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while deleting the kick",
    });
  }
};
