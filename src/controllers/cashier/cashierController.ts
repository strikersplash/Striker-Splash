import { Request, Response } from 'express';
import { pool } from '../../config/db';
import QueueTicket from '../../models/QueueTicket';

// Display cashier interface
export const getCashierInterface = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only allow staff to access this page
    if (!req.session.user || (req.session.user.role !== 'admin' && req.session.user.role !== 'staff')) {
      req.flash('error_msg', 'Unauthorized access');
      return res.redirect('/auth/login');
    }
    
    // Get current queue position
    const currentQueuePosition = await QueueTicket.getCurrentQueuePosition();
    
    // Get next ticket number
    let nextTicket = 1000;
    try {
      const nextTicketQuery = `
        SELECT value as next_ticket
        FROM global_counters
        WHERE id = 'next_queue_number'
      `;
      
      const nextTicketResult = await pool.query(nextTicketQuery);
      nextTicket = nextTicketResult.rows[0]?.next_ticket || 1000;
    } catch (e) {
      console.error('Error getting next ticket number:', e);
    }
    
    res.render('cashier/interface', {
      title: 'Cashier Interface',
      currentQueuePosition,
      nextTicket
    });
  } catch (error) {
    console.error('Cashier interface error:', error);
    req.flash('error_msg', 'An error occurred while loading the cashier interface');
    res.redirect('/staff/interface');
  }
};

// Sell kicks - ultra minimal version
export const sellKicks = async (req: Request, res: Response): Promise<void> => {
  try {
    // Update player kicks balance
    await pool.query(
      'UPDATE players SET kicks_balance = kicks_balance + $1 WHERE id = $2',
      [parseInt(req.body.kicks), parseInt(req.body.playerId)]
    );
    
    // Add to queue if requested
    let ticketNumber = null;
    if (req.body.addToQueue) {
      // Get next ticket number
      const ticketResult = await pool.query('SELECT value FROM global_counters WHERE id = $1', ['next_queue_number']);
      ticketNumber = ticketResult.rows[0]?.value || 1000;
      
      // Create queue ticket
      await pool.query(
        'INSERT INTO queue_tickets (player_id, ticket_number, official) VALUES ($1, $2, $3)',
        [parseInt(req.body.playerId), ticketNumber, req.body.officialEntry]
      );
      
      // Increment counter
      await pool.query('UPDATE global_counters SET value = value + 1 WHERE id = $1', ['next_queue_number']);
    }
    
    res.json({
      success: true,
      ticketNumber
    });
  } catch (error) {
    console.error('Sell kicks error:', error);
    res.status(500).json({ success: false, message: 'An error occurred while selling kicks' });
  }
};