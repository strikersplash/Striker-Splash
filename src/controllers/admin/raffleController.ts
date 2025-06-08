import { Request, Response } from 'express';
import { pool } from '../../config/db';
import QueueTicket from '../../models/QueueTicket';

// Display raffle interface
export const getRaffleInterface = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only allow admin to access this page
    if (!req.session.user || req.session.user.role !== 'admin') {
      req.flash('error_msg', 'Unauthorized access');
      return res.redirect('/auth/login');
    }
    
    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get today's tickets
    const ticketsQuery = `
      SELECT 
        MIN(ticket_number) as min_ticket,
        MAX(ticket_number) as max_ticket,
        COUNT(*) as total_tickets
      FROM 
        queue_tickets
      WHERE 
        created_at >= $1
        AND status = 'played'
    `;
    
    const ticketsResult = await pool.query(ticketsQuery, [today]);
    const ticketRange = ticketsResult.rows[0];
    
    // Check if raffle already drawn today
    const raffleQuery = `
      SELECT * FROM daily_raffles
      WHERE raffle_date = $1
    `;
    
    const raffleResult = await pool.query(raffleQuery, [today.toISOString().split('T')[0]]);
    const existingRaffle = raffleResult.rows[0];
    
    // Get winner details if raffle already drawn
    let winner = null;
    if (existingRaffle && existingRaffle.winner_id) {
      const winnerQuery = `
        SELECT 
          p.id, p.name, p.phone, p.email, p.residence, p.gender, p.age_group,
          qt.ticket_number
        FROM 
          players p
        JOIN
          queue_tickets qt ON qt.player_id = p.id
        WHERE 
          p.id = $1
          AND qt.ticket_number = $2
      `;
      
      const winnerResult = await pool.query(winnerQuery, [existingRaffle.winner_id, existingRaffle.winning_ticket]);
      winner = winnerResult.rows[0];
    }
    
    res.render('admin/raffle', {
      title: 'Daily Raffle',
      ticketRange,
      existingRaffle,
      winner,
      today: today.toISOString().split('T')[0]
    });
  } catch (error) {
    console.error('Raffle interface error:', error);
    req.flash('error_msg', 'An error occurred while loading the raffle interface');
    res.redirect('/admin/dashboard');
  }
};

// Draw raffle winner
export const drawRaffleWinner = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only allow admin to access this API
    if (!req.session.user || req.session.user.role !== 'admin') {
      res.status(401).json({ success: false, message: 'Unauthorized access' });
      return;
    }
    
    const { date } = req.body;
    
    // Validate input
    if (!date) {
      res.status(400).json({ success: false, message: 'Date is required' });
      return;
    }
    
    // Check if raffle already drawn for this date
    const existingRaffleQuery = `
      SELECT * FROM daily_raffles
      WHERE raffle_date = $1
    `;
    
    const existingRaffleResult = await pool.query(existingRaffleQuery, [date]);
    const existingRaffle = existingRaffleResult.rows[0];
    
    if (existingRaffle && existingRaffle.winning_ticket) {
      res.status(400).json({ success: false, message: 'Raffle already drawn for this date' });
      return;
    }
    
    // Get tickets for the date
    const targetDate = new Date(date);
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);
    
    const ticketsQuery = `
      SELECT 
        qt.id, qt.ticket_number, qt.player_id,
        p.name, p.phone, p.email, p.residence, p.gender, p.age_group
      FROM 
        queue_tickets qt
      JOIN
        players p ON qt.player_id = p.id
      WHERE 
        qt.created_at >= $1
        AND qt.created_at < $2
        AND qt.status = 'played'
    `;
    
    const ticketsResult = await pool.query(ticketsQuery, [targetDate, nextDate]);
    const eligibleTickets = ticketsResult.rows;
    
    if (eligibleTickets.length === 0) {
      res.status(400).json({ success: false, message: 'No eligible tickets for this date' });
      return;
    }
    
    // Select random winner
    const randomIndex = Math.floor(Math.random() * eligibleTickets.length);
    const winningTicket = eligibleTickets[randomIndex];
    
    // Record raffle result
    let raffleId;
    if (existingRaffle) {
      // Update existing raffle
      await pool.query(
        `UPDATE daily_raffles 
         SET winning_ticket = $1, winner_id = $2, drawn_at = NOW(), drawn_by = $3
         WHERE id = $4`,
        [winningTicket.ticket_number, winningTicket.player_id, req.session.user.id, existingRaffle.id]
      );
      raffleId = existingRaffle.id;
    } else {
      // Create new raffle record
      const minTicket = Math.min(...eligibleTickets.map(t => t.ticket_number));
      const maxTicket = Math.max(...eligibleTickets.map(t => t.ticket_number));
      
      const insertResult = await pool.query(
        `INSERT INTO daily_raffles 
         (raffle_date, start_ticket, end_ticket, winning_ticket, winner_id, drawn_at, drawn_by)
         VALUES ($1, $2, $3, $4, $5, NOW(), $6)
         RETURNING id`,
        [date, minTicket, maxTicket, winningTicket.ticket_number, winningTicket.player_id, req.session.user.id]
      );
      
      raffleId = insertResult.rows[0].id;
    }
    
    res.json({
      success: true,
      raffleId,
      winner: {
        id: winningTicket.player_id,
        name: winningTicket.name,
        phone: winningTicket.phone,
        email: winningTicket.email,
        residence: winningTicket.residence,
        gender: winningTicket.gender,
        age_group: winningTicket.age_group,
        ticket_number: winningTicket.ticket_number
      }
    });
  } catch (error) {
    console.error('Draw raffle error:', error);
    res.status(500).json({ success: false, message: 'An error occurred while drawing raffle winner' });
  }
};