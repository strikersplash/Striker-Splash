import Player from '../models/Player';
import GameStat from '../models/GameStat';
import { pool } from '../config/db';

interface LeaderboardEntry {
  playerId: string;
  playerName: string;
  ageGroup: string;
  residence: string;
  totalGoals: number;
}

// Get top players by age group and/or location
export const getLeaderboard = async (
  ageGroup?: string,
  location?: string,
  limit: number = 10
): Promise<LeaderboardEntry[]> => {
  try {
    let query = `
      SELECT 
        p.id as "playerId",
        p.name as "playerName",
        p.age_group as "ageGroup",
        p.residence,
        SUM(gs.goals) as "totalGoals"
      FROM 
        game_stats gs
      JOIN 
        players p ON gs.player_id = p.id
    `;
    
    const values: any[] = [];
    const conditions: string[] = [];
    
    if (ageGroup && ageGroup !== 'all') {
      conditions.push(`p.age_group = $${values.length + 1}`);
      values.push(ageGroup);
    }
    
    if (location && location !== 'all') {
      conditions.push(`p.residence ILIKE $${values.length + 1}`);
      values.push(`%${location}%`);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += `
      GROUP BY 
        p.id, p.name, p.age_group, p.residence
      ORDER BY 
        "totalGoals" DESC
      LIMIT $${values.length + 1}
    `;
    
    values.push(limit);
    
    const result = await pool.query(query, values);
    
  return result.rows.map((row: any) => ({
      playerId: row.playerId.toString(),
      playerName: row.playerName,
      ageGroup: row.ageGroup,
      residence: row.residence,
      totalGoals: parseInt(row.totalGoals)
    }));
  } catch (error) {
    console.error('Leaderboard error:', error);
    throw new Error('Failed to retrieve leaderboard data');
  }
};