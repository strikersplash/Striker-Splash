import { pool } from "../config/db";

export default class Team {
  static async create(name: string, captainId: number): Promise<any> {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Create team
      const teamResult = await client.query(
        "INSERT INTO teams (name) VALUES ($1) RETURNING *",
        [name]
      );
      const team = teamResult.rows[0];

      // Add captain as first member
      await client.query(
        "INSERT INTO team_members (team_id, player_id, is_captain) VALUES ($1, $2, TRUE)",
        [team.id, captainId]
      );

      // Initialize team stats
      await client.query("INSERT INTO team_stats (team_id) VALUES ($1)", [
        team.id,
      ]);

      await client.query("COMMIT");
      return team;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  static async createWithDetails(
    name: string,
    captainId: number,
    teamSize: number,
    description: string | null,
    slug: string | null,
    isRecruiting: boolean
  ): Promise<any> {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      console.log(
        `Creating team "${name}" for captain ID: ${captainId}, team size: ${teamSize}`
      );

      // Create team with all details
      const teamResult = await client.query(
        `INSERT INTO teams (name, team_size, description, slug, is_recruiting, created_at) 
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP) RETURNING *`,
        [name, teamSize, description, slug, isRecruiting]
      );
      const team = teamResult.rows[0];
      console.log(`Team created with ID: ${team.id}`);

      // Add captain as first member
      await client.query(
        "INSERT INTO team_members (team_id, player_id, is_captain) VALUES ($1, $2, TRUE)",
        [team.id, captainId]
      );
      console.log(`Captain (${captainId}) added as team member`);

      // Initialize team stats
      await client.query("INSERT INTO team_stats (team_id) VALUES ($1)", [
        team.id,
      ]);
      console.log(`Team stats initialized for team ID: ${team.id}`);

      await client.query("COMMIT");
      console.log(`Team creation transaction committed successfully`);
      return team;
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Team creation failed, transaction rolled back:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  static async getById(teamId: number): Promise<any> {
    const result = await pool.query("SELECT * FROM teams WHERE id = $1", [
      teamId,
    ]);
    return result.rows[0];
  }

  static async getAll(): Promise<any[]> {
    // Using DISTINCT ON to avoid duplicates from multiple team_stats entries
    const result = await pool.query(
      `SELECT DISTINCT ON (t.id) t.*, 
              COALESCE(ts.total_goals, 0) as total_goals, 
              COALESCE(ts.total_attempts, 0) as total_attempts,
              (SELECT COUNT(*) FROM team_members tm WHERE tm.team_id = t.id) as current_members
       FROM teams t 
       LEFT JOIN team_stats ts ON t.id = ts.team_id AND ts.competition_id IS NULL
       ORDER BY t.id, t.name`
    );
    return result.rows;
  }

  static async getMembers(teamId: number): Promise<any[]> {
    const result = await pool.query(
      `SELECT tm.*, p.name, p.residence, p.gender, p.age_group,
        (SELECT SUM(gs.goals) FROM game_stats gs WHERE gs.player_id = p.id AND gs.team_play = TRUE) as goals
       FROM team_members tm
       JOIN players p ON tm.player_id = p.id
       WHERE tm.team_id = $1
       ORDER BY tm.is_captain DESC, p.name`,
      [teamId]
    );
    return result.rows;
  }

  static async addMember(teamId: number, playerId: number): Promise<boolean> {
    // Get team's maximum size
    const teamResult = await pool.query(
      "SELECT team_size FROM teams WHERE id = $1",
      [teamId]
    );

    if (teamResult.rows.length === 0) {
      return false; // Team doesn't exist
    }

    const maxMembers = teamResult.rows[0].team_size;

    // Check if team has reached capacity
    const countResult = await pool.query(
      "SELECT COUNT(*) FROM team_members WHERE team_id = $1",
      [teamId]
    );

    if (parseInt(countResult.rows[0].count) >= maxMembers) {
      return false;
    }

    // Check if player is already in a team - REMOVED: Allow multiple team memberships
    // const playerTeamResult = await pool.query(
    //   "SELECT * FROM team_members WHERE player_id = $1",
    //   [playerId]
    // );

    // if (playerTeamResult.rows.length > 0) {
    //   return false;
    // }

    await pool.query(
      "INSERT INTO team_members (team_id, player_id) VALUES ($1, $2)",
      [teamId, playerId]
    );

    return true;
  }

  static async getTeamStats(teamId: number): Promise<any> {
    // Get only global team stats (without competition_id)
    const result = await pool.query(
      "SELECT * FROM team_stats WHERE team_id = $1 AND competition_id IS NULL",
      [teamId]
    );

    // If no global stats exist, calculate from custom_competition_activity
    if (!result.rows.length) {
      const activityResult = await pool.query(
        `SELECT 
          SUM(cca.goals) as total_goals, 
          SUM(cca.kicks_used) as total_attempts 
        FROM custom_competition_activity cca 
        WHERE cca.team_id = $1`,
        [teamId]
      );
      return activityResult.rows[0] || { total_goals: 0, total_attempts: 0 };
    }

    return result.rows[0];
  }

  static async updateTeamStats(teamId: number): Promise<void> {
    // Get all team members
    const membersResult = await pool.query(
      "SELECT player_id FROM team_members WHERE team_id = $1",
      [teamId]
    );

    if (membersResult.rows.length === 0) {
      return;
    }

    const playerIds = membersResult.rows.map((row) => row.player_id);

    // Calculate team stats - only count team_play=true
    const statsResult = await pool.query(
      `SELECT 
        SUM(gs.goals) as total_goals,
        COUNT(gs.id) * 5 as total_attempts
       FROM game_stats gs
       WHERE gs.player_id = ANY($1::int[]) AND gs.team_play = TRUE`,
      [playerIds]
    );

    const stats = statsResult.rows[0];

    // Update team stats
    await pool.query(
      `UPDATE team_stats
       SET total_goals = $1, total_attempts = $2, last_updated = CURRENT_TIMESTAMP
       WHERE team_id = $3`,
      [stats.total_goals || 0, stats.total_attempts || 0, teamId]
    );
  }

  static async getTeamStatsBySession(teamId: number): Promise<any[]> {
    // Since team play no longer creates game_stats entries,
    // and we don't have session-based tracking in team_stats yet,
    // return empty array for now
    return [];
  }

  static async compareTeams(team1Id: number, team2Id: number): Promise<any> {
    // Update stats for both teams
    await this.updateTeamStats(team1Id);
    await this.updateTeamStats(team2Id);

    const result = await pool.query(
      `SELECT 
        t.id, t.name, ts.total_goals, ts.total_attempts,
        CASE WHEN ts.total_attempts = 0 THEN 0
             ELSE ts.total_goals::float / ts.total_attempts
        END as accuracy
       FROM teams t
       JOIN team_stats ts ON t.id = ts.team_id
       WHERE t.id IN ($1, $2)`,
      [team1Id, team2Id]
    );
    return result.rows;
  }

  static async getPlayerTeam(playerId: number): Promise<any> {
    const result = await pool.query(
      `SELECT t.* 
       FROM teams t
       JOIN team_members tm ON t.id = tm.team_id
       WHERE tm.player_id = $1`,
      [playerId]
    );
    return result.rows[0];
  }

  static async getPlayerTeams(playerId: number): Promise<any[]> {
    const result = await pool.query(
      `SELECT t.* 
       FROM teams t
       JOIN team_members tm ON t.id = tm.team_id
       WHERE tm.player_id = $1`,
      [playerId]
    );
    return result.rows;
  }

  static async leaveTeam(playerId: number): Promise<boolean> {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Get team info before leaving
      const teamQuery = await client.query(
        "SELECT team_id FROM team_members WHERE player_id = $1",
        [playerId]
      );

      if (teamQuery.rows.length === 0) {
        await client.query("ROLLBACK");
        return false;
      }

      const teamId = teamQuery.rows[0].team_id;

      // Remove from team_members
      const result = await client.query(
        "DELETE FROM team_members WHERE player_id = $1 RETURNING is_captain",
        [playerId]
      );

      if (result.rows.length === 0) {
        await client.query("ROLLBACK");
        return false;
      }

      // Clean up any existing join requests for this team
      await client.query(
        "DELETE FROM team_join_requests WHERE player_id = $1 AND team_id = $2",
        [playerId, teamId]
      );

      // If player was captain, assign a new captain if there are other members
      if (result.rows[0].is_captain) {
        // Find another member to make captain
        const memberResult = await client.query(
          "SELECT player_id FROM team_members WHERE team_id = $1 LIMIT 1",
          [teamId]
        );

        if (memberResult.rows.length > 0) {
          await client.query(
            "UPDATE team_members SET is_captain = TRUE WHERE player_id = $1",
            [memberResult.rows[0].player_id]
          );
        }
      }

      await client.query("COMMIT");
      return true;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  // Leave a specific team (for multi-team players)
  static async leaveSpecificTeam(playerId: number, teamId: number): Promise<boolean> {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Check if player is actually a member of this specific team
      const membershipQuery = await client.query(
        "SELECT is_captain FROM team_members WHERE player_id = $1 AND team_id = $2",
        [playerId, teamId]
      );

      if (membershipQuery.rows.length === 0) {
        await client.query("ROLLBACK");
        return false;
      }

      const isPlayerCaptain = membershipQuery.rows[0].is_captain;

      // Remove player from this specific team only
      const result = await client.query(
        "DELETE FROM team_members WHERE player_id = $1 AND team_id = $2",
        [playerId, teamId]
      );

      if (result.rowCount === 0) {
        await client.query("ROLLBACK");
        return false;
      }

      // Clean up any existing join requests for this specific team
      await client.query(
        "DELETE FROM team_join_requests WHERE player_id = $1 AND team_id = $2",
        [playerId, teamId]
      );

      // If player was captain of this team, assign a new captain if there are other members
      if (isPlayerCaptain) {
        // Find another member to make captain for this specific team
        const memberResult = await client.query(
          "SELECT player_id FROM team_members WHERE team_id = $1 LIMIT 1",
          [teamId]
        );

        if (memberResult.rows.length > 0) {
          await client.query(
            "UPDATE team_members SET is_captain = TRUE WHERE player_id = $1 AND team_id = $2",
            [memberResult.rows[0].player_id, teamId]
          );
        }
      }

      await client.query("COMMIT");
      return true;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  // Generate URL-friendly slug from team name
  static generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "") // Remove special characters except spaces and hyphens
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-") // Replace multiple hyphens with single
      .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens
  }

  // Get team by slug (generated from name)
  static async getBySlug(slug: string): Promise<any> {
    // First try to find by actual slug column if it exists
    try {
      const result = await pool.query("SELECT * FROM teams WHERE slug = $1", [
        slug,
      ]);
      if (result.rows.length > 0) {
        return result.rows[0];
      }
    } catch (error) {
      // Column might not exist yet, continue with name-based lookup
    }

    // Fallback: find by matching generated slug from name
    const allTeams = await pool.query("SELECT * FROM teams");
    for (const team of allTeams.rows) {
      if (this.generateSlug(team.name) === slug) {
        return team;
      }
    }
    return null;
  }

  // Get team slug (either from database or generated from name)
  static getSlug(team: any): string {
    return team.slug || this.generateSlug(team.name);
  }

  // ===== TEAM MANAGEMENT METHODS =====

  // Check if player is captain of a team
  static async isCaptain(playerId: number, teamId: number): Promise<boolean> {
    const result = await pool.query(
      "SELECT is_captain FROM team_members WHERE player_id = $1 AND team_id = $2",
      [playerId, teamId]
    );
    return result.rows.length > 0 && result.rows[0].is_captain;
  }

  // Transfer captaincy to another team member
  static async transferCaptaincy(
    currentCaptainId: number,
    newCaptainId: number,
    teamId: number
  ): Promise<boolean> {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Verify current captain
      const captainCheck = await client.query(
        "SELECT * FROM team_members WHERE player_id = $1 AND team_id = $2 AND is_captain = TRUE",
        [currentCaptainId, teamId]
      );

      if (captainCheck.rows.length === 0) {
        await client.query("ROLLBACK");
        return false;
      }

      // Verify new captain is a team member
      const memberCheck = await client.query(
        "SELECT * FROM team_members WHERE player_id = $1 AND team_id = $2",
        [newCaptainId, teamId]
      );

      if (memberCheck.rows.length === 0) {
        await client.query("ROLLBACK");
        return false;
      }

      // Remove captaincy from current captain
      await client.query(
        "UPDATE team_members SET is_captain = FALSE WHERE player_id = $1 AND team_id = $2",
        [currentCaptainId, teamId]
      );

      // Give captaincy to new captain
      await client.query(
        "UPDATE team_members SET is_captain = TRUE WHERE player_id = $1 AND team_id = $2",
        [newCaptainId, teamId]
      );

      await client.query("COMMIT");
      return true;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  // Remove member from team (captain only)
  static async removeMember(
    captainId: number,
    memberToRemoveId: number,
    teamId: number
  ): Promise<boolean> {
    const client = await pool.connect();
    try {
      // Verify captain permissions
      const isCaptain = await this.isCaptain(captainId, teamId);
      if (!isCaptain) return false;

      // Don't allow captain to remove themselves (they should transfer captaincy first)
      if (captainId === memberToRemoveId) return false;

      // Remove the member
      const result = await client.query(
        "DELETE FROM team_members WHERE player_id = $1 AND team_id = $2",
        [memberToRemoveId, teamId]
      );

      return result.rowCount > 0;
    } catch (error) {
      throw error;
    } finally {
      client.release();
    }
  }

  // Update team name (captain only)
  static async updateTeamName(
    captainId: number,
    teamId: number,
    newName: string
  ): Promise<boolean> {
    try {
      // Verify captain permissions
      const isCaptain = await this.isCaptain(captainId, teamId);
      if (!isCaptain) return false;

      const result = await pool.query(
        "UPDATE teams SET name = $1 WHERE id = $2",
        [newName, teamId]
      );

      return result.rowCount > 0;
    } catch (error) {
      throw error;
    }
  }

  // Delete team (captain only)
  static async deleteTeam(captainId: number, teamId: number): Promise<boolean> {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Verify captain permissions
      const isCaptain = await this.isCaptain(captainId, teamId);
      if (!isCaptain) {
        await client.query("ROLLBACK");
        return false;
      }

      console.log(`Deleting team ${teamId} by captain ${captainId}`);

      // Delete team join requests
      await client.query("DELETE FROM team_join_requests WHERE team_id = $1", [
        teamId,
      ]);
      console.log(`Deleted join requests for team ${teamId}`);

      // Delete team members
      await client.query("DELETE FROM team_members WHERE team_id = $1", [
        teamId,
      ]);
      console.log(`Deleted team members for team ${teamId}`);

      // Delete team stats
      await client.query("DELETE FROM team_stats WHERE team_id = $1", [teamId]);
      console.log(`Deleted team stats for team ${teamId}`);

      // Delete team's competition entries if any
      try {
        await client.query(
          "DELETE FROM custom_competition_teams WHERE team_id = $1",
          [teamId]
        );
        console.log(`Deleted competition entries for team ${teamId}`);
      } catch (error) {
        console.log(`No competition entries found for team ${teamId}`);
        // Continue if this table doesn't exist or other error
      }

      // Finally delete the team
      const result = await client.query("DELETE FROM teams WHERE id = $1", [
        teamId,
      ]);

      if (result.rowCount === 0) {
        await client.query("ROLLBACK");
        return false;
      }

      await client.query("COMMIT");
      console.log(`Successfully deleted team ${teamId}`);
      return true;
    } catch (error) {
      console.error("Error deleting team:", error);
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  // Update team capacity/size (captain only)
  static async updateTeamSize(
    captainId: number,
    teamId: number,
    newSize: number
  ): Promise<boolean> {
    try {
      // Verify captain permissions
      const isCaptain = await this.isCaptain(captainId, teamId);
      if (!isCaptain) return false;

      // Validate team size
      const validSizes = [3, 5, 10, 11, 18, 23];
      if (!validSizes.includes(newSize)) return false;

      const result = await pool.query(
        "UPDATE teams SET team_size = $1 WHERE id = $2",
        [newSize, teamId]
      );

      return result.rowCount > 0;
    } catch (error) {
      console.error("Error updating team size:", error);
      throw error;
    }
  }

  // ===== JOIN REQUEST METHODS =====

  // Create a join request
  static async createJoinRequest(
    playerId: number,
    teamId: number,
    message?: string
  ): Promise<boolean> {
    try {
      // Check if player is already in a team - REMOVED: Allow multiple team memberships
      // const existingTeam = await this.getPlayerTeam(playerId);
      // if (existingTeam) return false;

      // Check if request already exists (any status)
      const existingRequest = await pool.query(
        "SELECT * FROM team_join_requests WHERE player_id = $1 AND team_id = $2",
        [playerId, teamId]
      );

      if (existingRequest.rows.length > 0) return false;

      await pool.query(
        "INSERT INTO team_join_requests (player_id, team_id, message) VALUES ($1, $2, $3)",
        [playerId, teamId, message || null]
      );

      return true;
    } catch (error: any) {
      // Handle duplicate key constraint specifically
      if (
        error.code === "23505" &&
        error.constraint === "team_join_requests_team_id_player_id_key"
      ) {
        return false; // Duplicate request, return false instead of throwing
      }
      throw error;
    }
  }

  // Get pending join requests for a team
  static async getJoinRequests(teamId: number): Promise<any[]> {
    const result = await pool.query(
      `SELECT tjr.*, p.name, p.residence, p.gender, p.age_group,
        (SELECT SUM(gs.goals) FROM game_stats gs WHERE gs.player_id = p.id) as total_goals,
        (SELECT COUNT(*) FROM game_stats gs WHERE gs.player_id = p.id) as total_games
       FROM team_join_requests tjr
       JOIN players p ON tjr.player_id = p.id
       WHERE tjr.team_id = $1 AND tjr.status = 'pending'
       ORDER BY tjr.created_at ASC`,
      [teamId]
    );
    return result.rows;
  }

  // Approve or reject join request
  static async handleJoinRequest(
    captainId: number,
    requestId: number,
    action: "approve" | "reject"
  ): Promise<boolean> {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Get the request details
      const requestResult = await client.query(
        "SELECT * FROM team_join_requests WHERE id = $1 AND status = 'pending'",
        [requestId]
      );

      if (requestResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return false;
      }

      const request = requestResult.rows[0];

      // Verify captain permissions
      const isCaptain = await this.isCaptain(captainId, request.team_id);
      if (!isCaptain) {
        await client.query("ROLLBACK");
        return false;
      }

      if (action === "approve") {
        // Check team capacity
        const memberCount = await client.query(
          "SELECT COUNT(*) FROM team_members WHERE team_id = $1",
          [request.team_id]
        );

        if (parseInt(memberCount.rows[0].count) >= 5) {
          await client.query("ROLLBACK");
          return false;
        }

        // Add player to team
        await client.query(
          "INSERT INTO team_members (team_id, player_id) VALUES ($1, $2)",
          [request.team_id, request.player_id]
        );
      }

      // Update request status
      await client.query(
        "UPDATE team_join_requests SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
        [action === "approve" ? "approved" : "rejected", requestId]
      );

      await client.query("COMMIT");
      return true;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}
