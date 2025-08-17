import { Request, Response } from 'express';
import { pool } from '../../config/db';
import QueueTicket from '../../models/QueueTicket';

// Display referee interface
export const getRefereeInterface = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only allow staff to access this page
    if (!(req.session as any).user || ((req.session as any).user.role !== 'admin' && (req.session as any).user.role !== 'staff')) {
      req.flash('error_msg', 'Unauthorized access');
      return res.redirect('/auth/login');
    }
    
    // Get current queue position
    const currentQueuePosition = await QueueTicket.getCurrentQueuePosition();
    
    res.render('referee/interface', {
      title: 'Referee Interface',
      currentQueuePosition
    });
  } catch (error) {
    console.error('Referee interface error:', error);
    req.flash('error_msg', 'An error occurred while loading the referee interface');
    res.redirect('/staff/interface');
  }
};

// Log goal
export const logGoal = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only allow staff to access this API
    if (!(req.session as any).user || ((req.session as any).user.role !== 'admin' && (req.session as any).user.role !== 'staff')) {
      res.status(401).json({ success: false, message: 'Unauthorized access' });
      return;
    }
    
    const { playerId, ticketId, goals, location, teamPlay } = req.body;
    
    // Validate input
    if (!playerId || !ticketId || goals === undefined || !location) {
      res.status(400).json({ success: false, message: 'Player ID, ticket ID, goals, and location are required' });
      return;
    }
    
    // Check if ticket is valid
    const ticketQuery = 'SELECT * FROM queue_tickets WHERE id = $1';
    const ticketResult = await pool.query(ticketQuery, [ticketId]);
    
    if (ticketResult.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Ticket not found' });
      return;
    }
    
    const ticket = ticketResult.rows[0];
    
    if (ticket.status !== 'in-queue') {
      res.status(400).json({ success: false, message: 'Ticket is not in queue' });
      return;
    }
    
    if (parseInt(ticket.player_id) !== parseInt(playerId)) {
      res.status(400).json({ success: false, message: 'Ticket does not belong to this player' });
      return;
    }
    
    // Insert game stats
    const insertQuery = `
      INSERT INTO game_stats (player_id, staff_id, goals, location, queue_ticket_id, team_play, session_date)
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE)
      RETURNING *
    `;
    
    const insertResult = await pool.query(insertQuery, [
      playerId,
      (req.session as any).user.id,
      goals,
      location,
      ticketId,
      teamPlay === 'true' || teamPlay === true
    ]);
    
    const gameStat = insertResult.rows[0];
    
    // Update ticket status
    const updateQuery = `
      UPDATE queue_tickets
      SET status = 'played', played_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
    
    await pool.query(updateQuery, [ticketId]);
    
    // Get current queue position
    const currentQueuePosition = await QueueTicket.getCurrentQueuePosition();
    
    res.json({
      success: true,
      gameStat,
      currentQueuePosition
    });
  } catch (error) {
    console.error('Log goal error:', error);
    res.status(500).json({ success: false, message: 'An error occurred while logging goal' });
  }
};

// Skip queue
export const skipQueue = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only allow staff to access this API
    if (!(req.session as any).user || ((req.session as any).user.role !== 'admin' && (req.session as any).user.role !== 'staff')) {
      res.status(401).json({ success: false, message: 'Unauthorized access' });
      return;
    }
    
    // Get current queue position
    const currentQueuePosition = await QueueTicket.getCurrentQueuePosition();
    
    if (!currentQueuePosition) {
      res.status(400).json({ success: false, message: 'No active tickets in queue' });
      return;
    }
    
    // Get ticket ID
    const ticketQuery = `
      SELECT id
      FROM queue_tickets
      WHERE ticket_number = $1 AND status = 'in-queue'
    `;
    
    const ticketResult = await pool.query(ticketQuery, [currentQueuePosition]);
    
    if (ticketResult.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Ticket not found' });
      return;
    }
    
    const ticketId = ticketResult.rows[0].id;
    
    // Update ticket status
    const updateQuery = `
      UPDATE queue_tickets
      SET status = 'skipped', played_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
    
    await pool.query(updateQuery, [ticketId]);
    
    // Get new current queue position
    const newQueuePosition = await QueueTicket.getCurrentQueuePosition();
    
    res.json({
      success: true,
      message: 'Queue position skipped successfully',
      currentQueuePosition: newQueuePosition
    });
  } catch (error) {
    console.error('Skip queue error:', error);
    res.status(500).json({ success: false, message: 'An error occurred while skipping queue' });
  }
};