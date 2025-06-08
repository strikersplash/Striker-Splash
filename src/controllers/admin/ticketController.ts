import { Request, Response } from 'express';
import { pool } from '../../config/db';

// Display ticket management page
export const getTicketManagement = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only allow admin to access this page
    if (!req.session.user || req.session.user.role !== 'admin') {
      req.flash('error_msg', 'Unauthorized access');
      return res.redirect('/auth/login');
    }
    
    // Get current ticket range
    let ticketRange = {
      min_ticket: 0,
      max_ticket: 0,
      total_tickets: 0
    };
    
    try {
      const ticketQuery = `
        SELECT 
          MIN(ticket_number) as min_ticket,
          MAX(ticket_number) as max_ticket,
          COUNT(*) as total_tickets
        FROM 
          queue_tickets
      `;
      
      const ticketResult = await pool.query(ticketQuery);
      ticketRange = ticketResult.rows[0];
    } catch (e) {
      console.error('Error getting ticket range:', e);
    }
    
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
      
      // Create global_counters table if it doesn't exist
      try {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS global_counters (
            id VARCHAR(50) PRIMARY KEY,
            value INTEGER NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        
        // Insert next_queue_number if it doesn't exist
        await pool.query(`
          INSERT INTO global_counters (id, value)
          VALUES ('next_queue_number', 1000)
          ON CONFLICT (id) DO NOTHING
        `);
      } catch (tableError) {
        console.error('Error creating global_counters table:', tableError);
      }
    }
    
    // Get ticket range settings
    let ticketRangeSettings = null;
    try {
      // Create ticket_ranges table if it doesn't exist
      await pool.query(`
        CREATE TABLE IF NOT EXISTS ticket_ranges (
          id SERIAL PRIMARY KEY,
          start_ticket INTEGER NOT NULL,
          end_ticket INTEGER NOT NULL,
          created_by INTEGER NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      const rangeQuery = `
        SELECT * FROM ticket_ranges
        ORDER BY created_at DESC
        LIMIT 1
      `;
      
      const rangeResult = await pool.query(rangeQuery);
      ticketRangeSettings = rangeResult.rows[0];
    } catch (e) {
      console.error('Error getting ticket range settings:', e);
    }
    
    res.render('admin/ticket-management', {
      title: 'Ticket Management',
      ticketRange,
      nextTicket,
      ticketRangeSettings,
      activePage: 'tickets'
    });
  } catch (error) {
    console.error('Ticket management error:', error);
    req.flash('error_msg', 'An error occurred while loading ticket management');
    res.redirect('/admin/dashboard');
  }
};

// Update next ticket number
export const updateNextTicket = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only allow admin to access this API
    if (!req.session.user || req.session.user.role !== 'admin') {
      res.status(401).json({ success: false, message: 'Unauthorized access' });
      return;
    }
    
    const { nextTicket } = req.body;
    
    // Validate input
    if (!nextTicket || isNaN(parseInt(nextTicket))) {
      res.status(400).json({ success: false, message: 'Valid next ticket number is required' });
      return;
    }
    
    // Create global_counters table if it doesn't exist
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS global_counters (
          id VARCHAR(50) PRIMARY KEY,
          value INTEGER NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    } catch (e) {
      console.error('Error creating global_counters table:', e);
    }
    
    // Update next ticket number
    await pool.query(
      'INSERT INTO global_counters (id, value) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET value = $2',
      ['next_queue_number', parseInt(nextTicket)]
    );
    
    res.json({
      success: true,
      message: 'Next ticket number updated successfully',
      nextTicket: parseInt(nextTicket)
    });
  } catch (error) {
    console.error('Update next ticket error:', error);
    res.status(500).json({ success: false, message: 'An error occurred while updating next ticket number' });
  }
};

// Set ticket range
export const setTicketRange = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only allow admin to access this API
    if (!req.session.user || req.session.user.role !== 'admin') {
      res.status(401).json({ success: false, message: 'Unauthorized access' });
      return;
    }
    
    const { startTicket, endTicket } = req.body;
    
    // Validate input
    if (!startTicket || !endTicket || isNaN(parseInt(startTicket)) || isNaN(parseInt(endTicket))) {
      res.status(400).json({ success: false, message: 'Valid start and end ticket numbers are required' });
      return;
    }
    
    if (parseInt(startTicket) >= parseInt(endTicket)) {
      res.status(400).json({ success: false, message: 'End ticket number must be greater than start ticket number' });
      return;
    }
    
    // Create ticket_ranges table if it doesn't exist
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS ticket_ranges (
          id SERIAL PRIMARY KEY,
          start_ticket INTEGER NOT NULL,
          end_ticket INTEGER NOT NULL,
          created_by INTEGER NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    } catch (e) {
      console.error('Error creating ticket_ranges table:', e);
    }
    
    // Insert new ticket range
    await pool.query(
      'INSERT INTO ticket_ranges (start_ticket, end_ticket, created_by) VALUES ($1, $2, $3)',
      [parseInt(startTicket), parseInt(endTicket), req.session.user.id]
    );
    
    // Update next ticket number if it's less than start ticket
    try {
      const nextTicketQuery = `
        SELECT value as next_ticket
        FROM global_counters
        WHERE id = 'next_queue_number'
      `;
      
      const nextTicketResult = await pool.query(nextTicketQuery);
      const nextTicket = nextTicketResult.rows[0]?.next_ticket || 0;
      
      if (nextTicket < parseInt(startTicket)) {
        await pool.query(
          'UPDATE global_counters SET value = $1 WHERE id = $2',
          [parseInt(startTicket), 'next_queue_number']
        );
      }
    } catch (e) {
      console.error('Error updating next ticket number:', e);
    }
    
    res.json({
      success: true,
      message: 'Ticket range set successfully'
    });
  } catch (error) {
    console.error('Set ticket range error:', error);
    res.status(500).json({ success: false, message: 'An error occurred while setting ticket range' });
  }
};