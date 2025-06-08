import { Request, Response } from 'express';
import Player from '../../models/Player';
import QueueTicket from '../../models/QueueTicket';
import { pool } from '../../config/db';

// Display staff interface
export const getInterface = async (req: Request, res: Response): Promise<void> => {
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
    
    // Get next ticket number
    const nextTicketQuery = `
      SELECT value as next_ticket
      FROM global_counters
      WHERE id = 'next_queue_number'
    `;
    
    const nextTicketResult = await pool.query(nextTicketQuery);
    const nextTicket = nextTicketResult.rows[0]?.next_ticket || 1000;
    
    // Get staff on duty today
    const today = new Date().toISOString().split('T')[0];
    
    const staffOnDutyQuery = `
      SELECT 
        s.name, s.role, sod.role as duty_role
      FROM 
        staff_on_duty sod
      JOIN
        staff s ON sod.staff_id = s.id
      WHERE 
        sod.duty_date = $1
      ORDER BY
        sod.role
    `;
    
    const staffOnDutyResult = await pool.query(staffOnDutyQuery, [today]);
    const staffOnDuty = staffOnDutyResult.rows;
    
    res.render('staff/interface', {
      title: 'Staff Interface',
      competitionTypes,
      currentQueuePosition,
      nextTicket,
      staffOnDuty
    });
  } catch (error) {
    console.error('Staff interface error:', error);
    req.flash('error_msg', 'An error occurred while loading the staff interface');
    res.redirect('/');
  }
};