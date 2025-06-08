import { Request, Response } from 'express';
import Player from '../../models/Player';
import GameStat from '../../models/GameStat';
import QueueTicket from '../../models/QueueTicket';
import { generateQRCode } from '../../services/qrService';

// Display referee interface
export const getRefereeInterface = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only allow staff to access this page
    if (!req.session.user || (req.session.user.role !== 'admin' && req.session.user.role !== 'staff')) {
      req.flash('error_msg', 'Unauthorized access');
      return res.redirect('/auth/login');
    }
    
    // Get competition types
    const competitionTypesResult = await Player.query(
      'SELECT * FROM competition_types WHERE active = TRUE',
      []
    );
    
    const competitionTypes = competitionTypesResult.rows;
    
    // Get current queue position
    const currentQueuePosition = await QueueTicket.getCurrentQueuePosition();
    
    res.render('referee/interface', {
      title: 'Referee Interface',
      competitionTypes,
      currentQueuePosition
    });
  } catch (error) {
    console.error('Referee interface error:', error);
    req.flash('error_msg', 'An error occurred while loading the referee interface');
    res.redirect('/');
  }
};

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
    
    // Find player by QR hash
    const player = await Player.findById(parsedData.playerId);
    
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
    
    res.json({
      success: true,
      player: {
        id: player.id,
        name: player.name,
        phone: player.phone,
        email: player.email,
        residence: player.residence,
        age_group: player.age_group,
        photo_path: player.photo_path,
        kicks_balance: player.kicks_balance
      },
      activeTickets,
      todayKicks
    });
  } catch (error) {
    console.error('QR scan error:', error);
    res.status(500).json({ success: false, message: 'An error occurred while processing QR code' });
  }
};

// Search player by phone
export const searchPlayerByPhone = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only allow staff to access this API
    if (!req.session.user || (req.session.user.role !== 'admin' && req.session.user.role !== 'staff')) {
      res.status(401).json({ success: false, message: 'Unauthorized access' });
      return;
    }
    
    const { phone } = req.query;
    
    if (!phone || typeof phone !== 'string') {
      res.status(400).json({ success: false, message: 'Phone number is required' });
      return;
    }
    
    // Find player by phone
    const player = await Player.findByPhone(phone);
    
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
    
    res.json({
      success: true,
      player: {
        id: player.id,
        name: player.name,
        phone: player.phone,
        email: player.email,
        residence: player.residence,
        age_group: player.age_group,
        photo_path: player.photo_path,
        kicks_balance: player.kicks_balance
      },
      activeTickets,
      todayKicks
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
    
    const { playerId, ticketId, goals, location, competitionType, requeue } = req.body;
    
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
    
    // Log goals
    const gameStat = await GameStat.create({
      player_id: player.id,
      goals: parseInt(goals),
      staff_id: parseInt(req.session.user.id),
      location: location || 'Unknown',
      competition_type: competitionType || ticket.competition_type,
      queue_ticket_id: ticket.id,
      requeued: requeue === true
    });
    
    if (!gameStat) {
      res.status(500).json({ success: false, message: 'Failed to log goals' });
      return;
    }
    
    // Handle requeue if requested
    let newTicket = null;
    if (requeue) {
      // Check if player has enough kicks balance
      if (player.kicks_balance < 5) {
        res.status(400).json({ 
          success: false, 
          message: 'Not enough kicks balance for requeue',
          gameStat
        });
        return;
      }
      
      // Deduct 5 kicks from balance
      const updatedPlayer = await Player.updateKicksBalance(player.id, -5);
      
      if (!updatedPlayer) {
        res.status(500).json({ 
          success: false, 
          message: 'Failed to update player kicks balance for requeue',
          gameStat
        });
        return;
      }
      
      // Create new queue ticket
      newTicket = await QueueTicket.create({
        player_id: player.id,
        competition_type: competitionType || ticket.competition_type
      });
      
      if (!newTicket) {
        // Refund kicks if ticket creation fails
        await Player.updateKicksBalance(player.id, 5);
        res.status(500).json({ 
          success: false, 
          message: 'Failed to create new queue ticket',
          gameStat
        });
        return;
      }
    }
    
    // Get current queue position
    const currentQueuePosition = await QueueTicket.getCurrentQueuePosition();
    
    res.json({
      success: true,
      gameStat,
      newTicket,
      currentQueuePosition
    });
  } catch (error) {
    console.error('Log goals error:', error);
    res.status(500).json({ success: false, message: 'An error occurred while logging goals' });
  }
};

// Update player name (referee only, once per player)
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
    
    // Check if name is already locked
    if (player.name_locked) {
      res.status(400).json({ success: false, message: 'Player name is locked and cannot be changed' });
      return;
    }
    
    // Update player name and lock it
    const updatedPlayer = await Player.update(player.id, { name, name_locked: true });
    
    if (!updatedPlayer) {
      res.status(500).json({ success: false, message: 'Failed to update player name' });
      return;
    }
    
    res.json({
      success: true,
      player: updatedPlayer
    });
  } catch (error) {
    console.error('Update player name error:', error);
    res.status(500).json({ success: false, message: 'An error occurred while updating player name' });
  }
};