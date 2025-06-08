import { pool } from '../config/db';

export default class Team {
  static async create(name: string, captainId: number): Promise<any> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Create team
      const teamResult = await client.query(
        'INSERT INTO teams (name) VALUES ($1) RETURNING *',
        [name]
      );
      const team = teamResult.rows[0];
      
      // Add captain as first member
      await client.query(
        'INSERT INTO team_members (team_id, player_id, is_captain) VALUES ($1, $2, TRUE)',
        [team.id, captainId]
      );
      
      // Initialize team stats
      await client.query(
        'INSERT INTO team_stats (team_id) VALUES ($1)',
        [team.id]
      );
      
      await client.query('COMMIT');
      return team;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async getById(teamId: number): Promise<any> {
    const result = await pool.query(
      'SELECT * FROM teams WHERE id = $1',
      [teamId]
    );
    return result.rows[0];
  }

  static async getAll(): Promise<any[]> {
    const result = await pool.query(
      'SELECT t.*, ts.total_goals, ts.total_attempts FROM teams t JOIN team_stats ts ON t.id = ts.team_id ORDER BY t.name'
    );
    return result.rows;
  }

  static async getMembers(teamId: number): Promise<any[]> {
    const result = await pool.query(
      `SELECT tm.*, p.name, p.residence, p.gender, p.age_group,
        (SELECT SUM(gs.goals) FROM game_stats gs WHERE gs.player_id = p.id) as goals
       FROM team_members tm
       JOIN players p ON tm.player_id = p.id
       WHERE tm.team_id = $1
       ORDER BY tm.is_captain DESC, p.name`,
      [teamId]
    );
    return result.rows;
  }

  static async addMember(teamId: number, playerId: number): Promise<boolean> {
    // Check if team has less than 5 members
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM team_members WHERE team_id = $1',
      [teamId]
    );
    
    if (parseInt(countResult.rows[0].count) >= 5) {
      return false;
    }
    
    // Check if player is already in a team
    const playerTeamResult = await pool.query(
      'SELECT * FROM team_members WHERE player_id = $1',
      [playerId]
    );
    
    if (playerTeamResult.rows.length > 0) {
      return false;
    }
    
    await pool.query(
      'INSERT INTO team_members (team_id, player_id) VALUES ($1, $2)',
      [teamId, playerId]
    );
    
    return true;
  }

  static async getTeamStats(teamId: number): Promise<any> {
    // Update team stats first
    await this.updateTeamStats(teamId);
    
    const result = await pool.query(
      'SELECT * FROM team_stats WHERE team_id = $1',
      [teamId]
    );
    return result.rows[0];
  }

  static async updateTeamStats(teamId: number): Promise<void> {
    // Get all team members
    const membersResult = await pool.query(
      'SELECT player_id FROM team_members WHERE team_id = $1',
      [teamId]
    );
    
    if (membersResult.rows.length === 0) {
      return;
    }
    
    const playerIds = membersResult.rows.map(row => row.player_id);
    
    // Calculate team stats - only count team_play=true
    const statsResult = await pool.query(
      `SELECT 
        SUM(gs.goals) as total_goals,
        COUNT(DISTINCT gs.id) as total_attempts
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
    // Get all team members
    const membersResult = await pool.query(
      'SELECT player_id FROM team_members WHERE team_id = $1',
      [teamId]
    );
    
    if (membersResult.rows.length === 0) {
      return [];
    }
    
    const playerIds = membersResult.rows.map(row => row.player_id);
    
    // Get stats grouped by session date
    const result = await pool.query(
      `SELECT 
        session_date,
        SUM(gs.goals) as total_goals,
        COUNT(DISTINCT gs.id) as total_attempts,
        CASE WHEN COUNT(DISTINCT gs.id) = 0 THEN 0
             ELSE SUM(gs.goals)::float / COUNT(DISTINCT gs.id)
        END as accuracy
       FROM game_stats gs
       WHERE gs.player_id = ANY($1::int[]) AND gs.team_play = TRUE
       GROUP BY session_date
       ORDER BY session_date DESC`,
      [playerIds]
    );
    
    return result.rows;
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

  static async leaveTeam(playerId: number): Promise<boolean> {
    const result = await pool.query(
      'DELETE FROM team_members WHERE player_id = $1 RETURNING is_captain',
      [playerId]
    );
    
    if (result.rows.length === 0) {
      return false;
    }
    
    // If player was captain, assign a new captain if there are other members
    if (result.rows[0].is_captain) {
      const teamResult = await pool.query(
        'SELECT team_id FROM team_members WHERE player_id = $1',
        [playerId]
      );
      
      if (teamResult.rows.length > 0) {
        const teamId = teamResult.rows[0].team_id;
        
        // Find another member to make captain
        const memberResult = await pool.query(
          'SELECT player_id FROM team_members WHERE team_id = $1 LIMIT 1',
          [teamId]
        );
        
        if (memberResult.rows.length > 0) {
          await pool.query(
            'UPDATE team_members SET is_captain = TRUE WHERE player_id = $1',
            [memberResult.rows[0].player_id]
          );
        }
      }
    }
    
    return true;
  }
}