import { Request, Response } from 'express';
import { pool } from '../../config/db';
import QueueTicket from '../../models/QueueTicket';

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
        gs.competition_type,
        gs.requeued,
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

// Get current queue position
export const getCurrentQueuePosition = async (req: Request, res: Response): Promise<void> => {
  try {
    const currentQueuePosition = await QueueTicket.getCurrentQueuePosition();
    
    res.json({ currentQueuePosition });
  } catch (error) {
    console.error('Error getting current queue position:', error);
    res.status(500).json({ error: 'An error occurred while getting current queue position' });
  }
};

// Expire all tickets at end of day
export const expireEndOfDay = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only allow admin to access this API
    if (!req.session.user || req.session.user.role !== 'admin') {
      res.status(401).json({ success: false, message: 'Unauthorized access' });
      return;
    }
    
    const expiredCount = await QueueTicket.expireEndOfDay();
    
    res.json({ success: true, expiredCount });
  } catch (error) {
    console.error('Error expiring tickets:', error);
    res.status(500).json({ success: false, message: 'An error occurred while expiring tickets' });
  }
};