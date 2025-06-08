import { Request, Response } from 'express';
import Player from '../../models/Player';
import Shot from '../../models/Shot';
import GameStat from '../../models/GameStat';
import { pool } from '../../config/db';

// Get player by ID
export const getPlayerById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    if (!id) {
      res.status(400).json({ error: 'Player ID is required' });
      return;
    }
    
    const player = await Player.findById(parseInt(id));
    
    if (!player) {
      res.status(404).json({ error: 'Player not found' });
      return;
    }
    
    res.json(player);
  } catch (error) {
    console.error('Error getting player:', error);
    res.status(500).json({ error: 'An error occurred while getting player' });
  }
};

// Get available shots for player
export const getAvailableShots = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    if (!id) {
      res.status(400).json({ error: 'Player ID is required' });
      return;
    }
    
    // Get total shots purchased
    const shotsQuery = 'SELECT SUM(shots_quantity) as total_shots FROM shots WHERE player_id = $1 AND payment_status = $2';
    const shotsResult = await pool.query(shotsQuery, [id, 'completed']);
    const totalShots = parseInt(shotsResult.rows[0]?.total_shots || '0');
    
    // Get total goals logged
    const goalsQuery = 'SELECT SUM(goals) as total_goals FROM game_stats WHERE player_id = $1';
    const goalsResult = await pool.query(goalsQuery, [id]);
    const totalGoals = parseInt(goalsResult.rows[0]?.total_goals || '0');
    
    // Calculate available shots
    const availableShots = Math.max(0, totalShots - totalGoals);
    
    res.json({ 
      playerId: parseInt(id),
      totalShots,
      totalGoals,
      availableShots
    });
  } catch (error) {
    console.error('Error getting available shots:', error);
    res.status(500).json({ error: 'An error occurred while getting available shots' });
  }
};

// Get today's activity
export const getTodaysActivity = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get today's game stats with player names
    const query = `
      SELECT 
        gs.id,
        gs.player_id,
        p.name as "playerName",
        gs.goals,
        gs.staff_id,
        s.name as "staffName",
        gs.location,
        gs.timestamp
      FROM 
        game_stats gs
      JOIN 
        players p ON gs.player_id = p.id
      JOIN 
        staff s ON gs.staff_id = s.id
      WHERE 
        gs.timestamp >= $1
      ORDER BY 
        gs.timestamp DESC
    `;
    
    const result = await pool.query(query, [today]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting today\'s activity:', error);
    res.status(500).json({ error: 'An error occurred while getting today\'s activity' });
  }
};