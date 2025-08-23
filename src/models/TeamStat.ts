import { pool, executeQuery } from "../config/db";

interface ITeamStat {
  id: number;
  team_id: number;
  total_goals: number;
  total_attempts: number;
  last_updated: Date;
}

export default class TeamStat {
  // Update team statistics by adding goals and attempts
  static async updateStats(
    teamId: number,
    goals: number,
    attempts: number = 5
  ): Promise<ITeamStat | null> {
    try {
      console.log(
        `Updating team stats for team ${teamId}: +${goals} goals, +${attempts} attempts`
      );

      const result = await executeQuery(
        `UPDATE team_stats 
         SET total_goals = total_goals + $1, 
             total_attempts = total_attempts + $2,
             last_updated = NOW()
         WHERE team_id = $3 
         RETURNING *`,
        [goals, attempts, teamId]
      );

      const updatedStats = result.rows[0] || null;
      if (updatedStats) {
        console.log(
          `Team stats updated successfully: ${updatedStats.total_goals} goals, ${updatedStats.total_attempts} attempts`
        );
      }

      return updatedStats;
    } catch (error) {
      console.error("Error updating team stats:", error);
      return null;
    }
  }

  // Get team statistics
  static async getByTeamId(teamId: number): Promise<ITeamStat | null> {
    try {
      const result = await executeQuery(
        "SELECT * FROM team_stats WHERE team_id = $1",
        [teamId]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error getting team stats:", error);
      return null;
    }
  }

  // Initialize team stats if they don't exist
  static async initializeStats(teamId: number): Promise<ITeamStat | null> {
    try {
      // First, check if stats already exist
      const existing = await this.getByTeamId(teamId);
      if (existing) {
        return existing;
      }

      // If not, create new stats
      const result = await executeQuery(
        `INSERT INTO team_stats (team_id, total_goals, total_attempts) 
         VALUES ($1, 0, 0) 
         RETURNING *`,
        [teamId]
      );

      return result.rows[0] || null;
    } catch (error) {
      console.error("Error initializing team stats:", error);
      return null;
    }
  }
}

export { ITeamStat };
