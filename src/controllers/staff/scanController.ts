import { Request, Response } from 'express';
import Player from '../../models/Player';
import GameStat from '../../models/GameStat';
import QueueTicket from '../../models/QueueTicket';
import { pool } from '../../config/db';

// Process QR code scan
export const processQRScan = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only allow staff to access this API
    if (!req.session.user || (req.session.user.role !== 'admin' && req.session.user.role !== 'staff')) {
      res.status(401).json({ success: false, message: 'Unauthorized access' });
      return;
    }
    
    const { qrData } = req.body;
    
    if (!qrData) {
      res.status(400).json({ success: false, message: 'QR data is required' });
      return;
    }
    
    // Parse QR data
    let parsedData;
    try {
      parsedData = JSON.parse(qrData);
    } catch (error) {
      res.status(400).json({ success: false, message: 'Invalid QR code format' });
      return;
    }
    
    // Find player by QR hash or ID
    let player;
    if (parsedData.hash) {
      player = await Player.findByQRHash(parsedData.hash);
    } else if (parsedData.playerId) {
      player = await Player.findById(parsedData.playerId);
    }
    
    if (!player) {
      res.status(404).json({ success: false, message: 'Player not found' });
      return;
    }
    
    // Get active queue tickets
    const activeTickets = await QueueTicket.findActiveByPlayerId(player.id);
    
    // Get today's kicks count
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const kicksResult = await Player.query(
      `SELECT SUM(gs.goals) as total_kicks
       FROM game_stats gs
       WHERE gs.player_id = $1 AND gs.timestamp >= $2`,
      [player.id, today]
    );
    
    const todayKicks = parseInt(kicksResult.rows[0]?.total_kicks || '0');
    
    // Get today's first five kicks status
    const firstFiveQuery = `
      SELECT COUNT(*) as count
      FROM game_stats
      WHERE player_id = $1 
      AND timestamp >= $2
      AND first_five_kicks = true
    `;
    
    const firstFiveResult = await pool.query(firstFiveQuery, [player.id, today]);
    const hasFirstFiveToday = parseInt(firstFiveResult.rows[0].count) > 0;
    
    res.json({
      success: true,
      player: {
        id: player.id,
        name: player.name,
        phone: player.phone,
        email: player.email,
        residence: player.residence,
        gender: player.gender || 'unknown',
        age_group: player.age_group,
        photo_path: player.photo_path,
        kicks_balance: player.kicks_balance || 0,
        name_locked: player.name_locked || false
      },
      activeTickets,
      todayKicks,
      hasFirstFiveToday
    });
  } catch (error) {
    console.error('QR scan error:', error);
    res.status(500).json({ success: false, message: 'An error occurred while processing QR code' });
  }
};

// Search player by name
export const searchPlayerByName = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only allow staff to access this API
    if (!req.session.user || (req.session.user.role !== 'admin' && req.session.user.role !== 'staff')) {
      res.status(401).json({ success: false, message: 'Unauthorized access' });
      return;
    }
    
    const { name } = req.query;
    
    if (!name || typeof name !== 'string') {
      res.status(400).json({ success: false, message: 'Name is required' });
      return;
    }
    
    // Find players by name
    const players = await Player.search(name);
    
    if (players.length === 0) {
      res.status(404).json({ success: false, message: 'No players found with that name' });
      return;
    }
    
    res.json({
      success: true,
      players
    });
  } catch (error) {
    console.error('Player search error:', error);
    res.status(500).json({ success: false, message: 'An error occurred while searching for player' });
  }
};

// Log goals
export const logGoals = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only allow staff to access this API
    if (!req.session.user || (req.session.user.role !== 'admin' && req.session.user.role !== 'staff')) {
      res.status(401).json({ success: false, message: 'Unauthorized access' });
      return;
    }
    
    const { playerId, ticketId, goals, location, competitionType } = req.body;
    
    // Validate input
    if (!playerId || !ticketId || goals === undefined || goals < 0 || goals > 5) {
      res.status(400).json({ success: false, message: 'Player ID, ticket ID, and valid goals count (0-5) are required' });
      return;
    }
    
    // Find player
    const player = await Player.findById(parseInt(playerId));
    
    if (!player) {
      res.status(404).json({ success: false, message: 'Player not found' });
      return;
    }
    
    // Find ticket
    const ticket = await QueueTicket.findById(parseInt(ticketId));
    
    if (!ticket) {
      res.status(404).json({ success: false, message: 'Queue ticket not found' });
      return;
    }
    
    if (ticket.status !== 'in-queue') {
      res.status(400).json({ success: false, message: 'Queue ticket is not active' });
      return;
    }
    
    // Mark ticket as played
    const updatedTicket = await QueueTicket.updateStatus(ticket.id, 'played');
    
    if (!updatedTicket) {
      res.status(500).json({ success: false, message: 'Failed to update ticket status' });
      return;
    }
    
    // Check if this is the first five kicks today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const firstFiveQuery = `
      SELECT COUNT(*) as count
      FROM game_stats
      WHERE player_id = $1 
      AND timestamp >= $2
      AND first_five_kicks = true
    `;
    
    const firstFiveResult = await pool.query(firstFiveQuery, [player.id, today]);
    const isFirstFive = parseInt(firstFiveResult.rows[0].count) === 0;
    
    // Log goals
    const gameStat = await GameStat.create({
      player_id: player.id,
      goals: parseInt(goals.toString()),
      staff_id: parseInt(req.session.user.id),
      location: location || 'Unknown',
      competition_type: competitionType || ticket.competition_type,
      queue_ticket_id: ticket.id,
      requeued: false,
      first_five_kicks: isFirstFive,
      player_gender: player.gender,
      player_age_bracket: player.age_group
    });
    
    if (!gameStat) {
      res.status(500).json({ success: false, message: 'Failed to log goals' });
      return;
    }
    
    // Get current queue position
    const currentQueuePosition = await QueueTicket.getCurrentQueuePosition();
    
    res.json({
      success: true,
      gameStat,
      currentQueuePosition,
      isFirstFive
    });
  } catch (error) {
    console.error('Log goals error:', error);
    res.status(500).json({ success: false, message: 'An error occurred while logging goals' });
  }
};

// Skip current queue position
export const skipCurrentQueue = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only allow staff to access this API
    if (!req.session.user || (req.session.user.role !== 'admin' && req.session.user.role !== 'staff')) {
      res.status(401).json({ success: false, message: 'Unauthorized access' });
      return;
    }
    
    // Get current queue position
    const currentQueuePosition = await QueueTicket.getCurrentQueuePosition();
    
    if (!currentQueuePosition) {
      res.status(400).json({ success: false, message: 'No active tickets in queue' });
      return;
    }
    
    // Find ticket with current queue position
    const ticketQuery = `
      SELECT * FROM queue_tickets
      WHERE ticket_number = $1 AND status = 'in-queue'
      LIMIT 1
    `;
    
    const ticketResult = await pool.query(ticketQuery, [currentQueuePosition]);
    
    if (ticketResult.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Current queue ticket not found' });
      return;
    }
    
    const ticket = ticketResult.rows[0];
    
    // Mark ticket as expired
    const updatedTicket = await QueueTicket.updateStatus(ticket.id, 'expired');
    
    if (!updatedTicket) {
      res.status(500).json({ success: false, message: 'Failed to update ticket status' });
      return;
    }
    
    // Get new queue position
    const newQueuePosition = await QueueTicket.getCurrentQueuePosition();
    
    res.json({
      success: true,
      message: `Skipped ticket #${currentQueuePosition}`,
      previousQueuePosition: currentQueuePosition,
      currentQueuePosition: newQueuePosition
    });
  } catch (error) {
    console.error('Skip queue error:', error);
    res.status(500).json({ success: false, message: 'An error occurred while skipping queue position' });
  }
};

// Update player name (referee only, up to 2 times per player)
export const updatePlayerName = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only allow staff to access this API
    if (!req.session.user || (req.session.user.role !== 'admin' && req.session.user.role !== 'staff')) {
      res.status(401).json({ success: false, message: 'Unauthorized access' });
      return;
    }
    
    const { playerId, name } = req.body;
    
    // Validate input
    if (!playerId || !name) {
      res.status(400).json({ success: false, message: 'Player ID and name are required' });
      return;
    }
    
    // Find player
    const player = await Player.findById(parseInt(playerId));
    
    if (!player) {
      res.status(404).json({ success: false, message: 'Player not found' });
      return;
    }
    
    // Check if name change count is already at 2
    const nameChangeCount = player.name_change_count || 0;
    if (nameChangeCount >= 2) {
      res.status(400).json({ success: false, message: 'Player name has already been changed twice and cannot be changed again' });
      return;
    }
    
    // Update player name and increment change count
    const updatedPlayer = await Player.update(player.id, { 
      name, 
      name_locked: nameChangeCount === 1, // Lock after second change
      name_change_count: nameChangeCount + 1
    });
    
    if (!updatedPlayer) {
      res.status(500).json({ success: false, message: 'Failed to update player name' });
      return;
    }
    
    res.json({
      success: true,
      player: updatedPlayer,
      remainingChanges: 2 - (nameChangeCount + 1)
    });
  } catch (error) {
    console.error('Update player name error:', error);
    res.status(500).json({ success: false, message: 'An error occurred while updating player name' });
  }
};