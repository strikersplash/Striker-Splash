import { Request, Response } from 'express';
import Player from '../../models/Player';
import Shot from '../../models/Shot';
import QueueTicket from '../../models/QueueTicket';
import { pool } from '../../config/db';

// Display cashier interface
export const getCashierInterface = async (req: Request, res: Response): Promise<void> => {
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
    
    // Get next ticket number
    const nextTicketQuery = `
      SELECT value as next_ticket
      FROM global_counters
      WHERE id = 'next_queue_number'
    `;
    
    const nextTicketResult = await pool.query(nextTicketQuery);
    const nextTicket = nextTicketResult.rows[0]?.next_ticket || 1000;
    
    res.render('cashier/interface', {
      title: 'Cashier Interface',
      competitionTypes,
      nextTicket
    });
  } catch (error) {
    console.error('Cashier interface error:', error);
    req.flash('error_msg', 'An error occurred while loading the cashier interface');
    res.redirect('/');
  }
};

// Search player
export const searchPlayer = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only allow staff to access this API
    if (!req.session.user || (req.session.user.role !== 'admin' && req.session.user.role !== 'staff')) {
      res.status(401).json({ success: false, message: 'Unauthorized access' });
      return;
    }
    
    const { query } = req.query;
    
    if (!query || typeof query !== 'string') {
      res.status(400).json({ success: false, message: 'Search query is required' });
      return;
    }
    
    const players = await Player.search(query);
    
    res.json({ success: true, players });
  } catch (error) {
    console.error('Player search error:', error);
    res.status(500).json({ success: false, message: 'An error occurred while searching for players' });
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
    
    // Get next ticket number
    const nextTicketQuery = `
      SELECT value as next_ticket
      FROM global_counters
      WHERE id = 'next_queue_number'
    `;
    
    const nextTicketResult = await pool.query(nextTicketQuery);
    const nextTicket = nextTicketResult.rows[0]?.next_ticket || 1000;
    
    res.json({
      success: true,
      player: {
        id: player.id,
        name: player.name,
        phone: player.phone,
        email: player.email,
        residence: player.residence,
        age_group: player.age_group,
        gender: player.gender,
        photo_path: player.photo_path,
        kicks_balance: player.kicks_balance || 0
      },
      activeTickets,
      nextTicket
    });
  } catch (error) {
    console.error('QR scan error:', error);
    res.status(500).json({ success: false, message: 'An error occurred while processing QR code' });
  }
};

// Process kicks purchase
export const processKicksPurchase = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only allow staff to access this API
    if (!req.session.user || (req.session.user.role !== 'admin' && req.session.user.role !== 'staff')) {
      res.status(401).json({ success: false, message: 'Unauthorized access' });
      return;
    }
    
    const { playerId, kicksQuantity, purchaseType, competitionType } = req.body;
    
    // Validate input
    if (!playerId || !kicksQuantity || kicksQuantity < 1) {
      res.status(400).json({ success: false, message: 'Player ID and kicks quantity are required' });
      return;
    }
    
    // Find player
    const player = await Player.findById(parseInt(playerId));
    
    if (!player) {
      res.status(404).json({ success: false, message: 'Player not found' });
      return;
    }
    
    // Calculate amount ($1 per kick)
    const amount = parseInt(kicksQuantity);
    
    // Create shot transaction
    const shot = await Shot.create({
      player_id: player.id,
      amount,
      shots_quantity: kicksQuantity,
      payment_status: 'completed',
      payment_reference: `PAY-${Date.now()}`
    });
    
    if (!shot) {
      res.status(500).json({ success: false, message: 'Failed to create transaction' });
      return;
    }
    
    // Update player's kicks balance
    const updatedPlayer = await Player.updateKicksBalance(player.id, kicksQuantity);
    
    if (!updatedPlayer) {
      res.status(500).json({ success: false, message: 'Failed to update player kicks balance' });
      return;
    }
    
    // Handle different purchase types
    let tickets = [];
    let remainingKicks = updatedPlayer.kicks_balance;
    
    if (purchaseType === 'queue') {
      // Create queue ticket (5 kicks per ticket)
      const ticketsToCreate = Math.min(Math.floor(kicksQuantity / 5), 1); // Max 1 ticket per transaction
      
      if (ticketsToCreate > 0) {
        // Deduct kicks from balance
        await Player.updateKicksBalance(player.id, -(ticketsToCreate * 5));
        remainingKicks = updatedPlayer.kicks_balance - (ticketsToCreate * 5);
        
        // Create ticket
        const ticket = await QueueTicket.create({
          player_id: player.id,
          competition_type: competitionType || 'accuracy',
          official: true
        });
        
        if (ticket) {
          tickets.push(ticket);
        }
      }
    }
    
    // Get next ticket number
    const nextTicketQuery = `
      SELECT value as next_ticket
      FROM global_counters
      WHERE id = 'next_queue_number'
    `;
    
    const nextTicketResult = await pool.query(nextTicketQuery);
    const nextTicket = nextTicketResult.rows[0]?.next_ticket || 1000;
    
    res.json({
      success: true,
      player: {
        ...updatedPlayer,
        kicks_balance: remainingKicks
      },
      transaction: shot,
      tickets,
      nextTicket
    });
  } catch (error) {
    console.error('Kicks purchase error:', error);
    res.status(500).json({ success: false, message: 'An error occurred while processing kicks purchase' });
  }
};

// Process re-queue
export const processReQueue = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only allow staff to access this API
    if (!req.session.user || (req.session.user.role !== 'admin' && req.session.user.role !== 'staff')) {
      res.status(401).json({ success: false, message: 'Unauthorized access' });
      return;
    }
    
    const { playerId, competitionType } = req.body;
    
    // Validate input
    if (!playerId) {
      res.status(400).json({ success: false, message: 'Player ID is required' });
      return;
    }
    
    // Find player
    const player = await Player.findById(parseInt(playerId));
    
    if (!player) {
      res.status(404).json({ success: false, message: 'Player not found' });
      return;
    }
    
    // Check if player has enough kicks
    if (player.kicks_balance < 5) {
      res.status(400).json({ 
        success: false, 
        message: 'Not enough kicks balance. Player needs to purchase more kicks.',
        kicksBalance: player.kicks_balance
      });
      return;
    }
    
    // Deduct 5 kicks from balance
    const updatedPlayer = await Player.updateKicksBalance(player.id, -5);
    
    if (!updatedPlayer) {
      res.status(500).json({ success: false, message: 'Failed to update player kicks balance' });
      return;
    }
    
    // Create queue ticket
    const ticket = await QueueTicket.create({
      player_id: player.id,
      competition_type: competitionType || 'accuracy',
      official: true
    });
    
    if (!ticket) {
      // Refund kicks if ticket creation fails
      await Player.updateKicksBalance(player.id, 5);
      res.status(500).json({ success: false, message: 'Failed to create queue ticket' });
      return;
    }
    
    // Get current queue position
    const currentQueuePosition = await QueueTicket.getCurrentQueuePosition();
    
    // Get next ticket number
    const nextTicketQuery = `
      SELECT value as next_ticket
      FROM global_counters
      WHERE id = 'next_queue_number'
    `;
    
    const nextTicketResult = await pool.query(nextTicketQuery);
    const nextTicket = nextTicketResult.rows[0]?.next_ticket || 1000;
    
    res.json({
      success: true,
      player: updatedPlayer,
      ticket,
      currentQueuePosition,
      nextTicket
    });
  } catch (error) {
    console.error('Re-queue error:', error);
    res.status(500).json({ success: false, message: 'An error occurred while processing re-queue' });
  }
};

// Process credit transfer
export const processCreditTransfer = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only allow staff to access this API
    if (!req.session.user || (req.session.user.role !== 'admin' && req.session.user.role !== 'staff')) {
      res.status(401).json({ success: false, message: 'Unauthorized access' });
      return;
    }
    
    const { fromPlayerId, toPlayerId, amount } = req.body;
    
    // Validate input
    if (!toPlayerId || !amount || amount < 1) {
      res.status(400).json({ success: false, message: 'Recipient player ID and amount are required' });
      return;
    }
    
    // Find recipient player
    const toPlayer = await Player.findById(parseInt(toPlayerId));
    
    if (!toPlayer) {
      res.status(404).json({ success: false, message: 'Recipient player not found' });
      return;
    }
    
    // Record credit transfer
    await Player.query(
      'INSERT INTO credit_transfers (from_player_id, to_player_id, amount, staff_id) VALUES ($1, $2, $3, $4)',
      [fromPlayerId || null, toPlayerId, amount, req.session.user.id]
    );
    
    // Update recipient's kicks balance
    const updatedPlayer = await Player.updateKicksBalance(toPlayer.id, amount);
    
    if (!updatedPlayer) {
      res.status(500).json({ success: false, message: 'Failed to update recipient kicks balance' });
      return;
    }
    
    res.json({
      success: true,
      player: updatedPlayer
    });
  } catch (error) {
    console.error('Credit transfer error:', error);
    res.status(500).json({ success: false, message: 'An error occurred while processing credit transfer' });
  }
};