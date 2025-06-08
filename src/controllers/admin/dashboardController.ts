import { Request, Response } from 'express';
import { pool } from '../../config/db';

// Display admin dashboard
export const getDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only allow admin to access this page
    if (!req.session.user || req.session.user.role !== 'admin') {
      req.flash('error_msg', 'Unauthorized access');
      return res.redirect('/auth/login');
    }
    
    // Get stats
    const stats = {
      totalPlayers: 0,
      todayKicks: 0,
      totalRevenue: 0,
      queueSize: 0
    };
    
    try {
      // Get total players
      const playersQuery = 'SELECT COUNT(*) as count FROM players';
      const playersResult = await pool.query(playersQuery);
      stats.totalPlayers = parseInt(playersResult.rows[0].count);
    } catch (e) {
      console.error('Error getting player count:', e);
    }
    
    try {
      // Get today's kicks
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const kicksQuery = `
        SELECT COUNT(*) as count
        FROM queue_tickets
        WHERE created_at >= $1
      `;
      
      const kicksResult = await pool.query(kicksQuery, [today]);
      stats.todayKicks = parseInt(kicksResult.rows[0].count) * 5; // Each ticket is 5 kicks
    } catch (e) {
      console.error('Error getting today\'s kicks:', e);
    }
    
    try {
      // Get total revenue
      const revenueQuery = `
        SELECT COUNT(*) as count
        FROM queue_tickets
      `;
      
      const revenueResult = await pool.query(revenueQuery);
      stats.totalRevenue = parseInt(revenueResult.rows[0].count) * 5; // $1 per kick, 5 kicks per ticket
    } catch (e) {
      console.error('Error getting total revenue:', e);
    }
    
    try {
      // Get queue size
      const queueQuery = `
        SELECT COUNT(*) as count
        FROM queue_tickets
        WHERE status = 'in-queue'
      `;
      
      const queueResult = await pool.query(queueQuery);
      stats.queueSize = parseInt(queueResult.rows[0].count);
    } catch (e) {
      console.error('Error getting queue size:', e);
    }
    
    // Get recent activity
    let recentActivity = [];
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const activityQuery = `
        SELECT 
          p.name as player_name,
          'Goal' as activity_type,
          CONCAT(gs.goals, ' goals scored') as details,
          gs.timestamp
        FROM 
          game_stats gs
        JOIN 
          players p ON gs.player_id = p.id
        WHERE 
          gs.timestamp >= $1
        ORDER BY 
          gs.timestamp DESC
        LIMIT 10
      `;
      
      const activityResult = await pool.query(activityQuery, [today]);
      recentActivity = activityResult.rows;
    } catch (e) {
      console.error('Error getting recent activity:', e);
    }
    
    // Get upcoming events
    let upcomingEvents = [];
    try {
      const eventsQuery = `
        SELECT *
        FROM events
        WHERE event_date >= CURRENT_DATE
        ORDER BY event_date ASC
        LIMIT 5
      `;
      
      const eventsResult = await pool.query(eventsQuery);
      upcomingEvents = eventsResult.rows;
    } catch (e) {
      console.log('Error fetching events:', e);
    }
    
    res.render('admin/dashboard', {
      title: 'Admin Dashboard',
      stats,
      recentActivity,
      upcomingEvents,
      activePage: 'dashboard'
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    req.flash('error_msg', 'An error occurred while loading the admin dashboard');
    res.redirect('/');
  }
};

// Display staff management page
export const getStaffManagement = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only allow admin to access this page
    if (!req.session.user || req.session.user.role !== 'admin') {
      req.flash('error_msg', 'Unauthorized access');
      return res.redirect('/auth/login');
    }
    
    // Get staff
    let staff = [];
    try {
      const staffQuery = 'SELECT * FROM staff ORDER BY name';
      const staffResult = await pool.query(staffQuery);
      staff = staffResult.rows;
    } catch (e) {
      console.error('Error getting staff:', e);
    }
    
    res.render('admin/staff-management', {
      title: 'Staff Management',
      staff,
      activePage: 'staff'
    });
  } catch (error) {
    console.error('Staff management error:', error);
    req.flash('error_msg', 'An error occurred while loading staff management');
    res.redirect('/admin/dashboard');
  }
};

// Add new staff
export const addStaff = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only allow admin to access this API
    if (!req.session.user || req.session.user.role !== 'admin') {
      res.status(401).json({ success: false, message: 'Unauthorized access' });
      return;
    }
    
    const { name, username, password, role } = req.body;
    
    // Validate input
    if (!name || !username || !password || !role) {
      res.status(400).json({ success: false, message: 'All fields are required' });
      return;
    }
    
    // Check if username already exists
    const checkQuery = 'SELECT * FROM staff WHERE username = $1';
    const checkResult = await pool.query(checkQuery, [username]);
    
    if (checkResult.rows.length > 0) {
      res.status(400).json({ success: false, message: 'Username already exists' });
      return;
    }
    
    // Insert new staff
    const insertQuery = `
      INSERT INTO staff (name, username, password_hash, role)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    const insertResult = await pool.query(insertQuery, [name, username, password, role]);
    const newStaff = insertResult.rows[0];
    
    res.json({
      success: true,
      staff: newStaff
    });
  } catch (error) {
    console.error('Add staff error:', error);
    res.status(500).json({ success: false, message: 'An error occurred while adding staff' });
  }
};

// Edit staff
export const editStaff = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only allow admin to access this API
    if (!req.session.user || req.session.user.role !== 'admin') {
      res.status(401).json({ success: false, message: 'Unauthorized access' });
      return;
    }
    
    const { id } = req.params;
    const { name, username, password, role } = req.body;
    
    // Validate input
    if (!name || !username || !role) {
      res.status(400).json({ success: false, message: 'Name, username, and role are required' });
      return;
    }
    
    // Check if username already exists for another staff
    const checkQuery = 'SELECT * FROM staff WHERE username = $1 AND id != $2';
    const checkResult = await pool.query(checkQuery, [username, id]);
    
    if (checkResult.rows.length > 0) {
      res.status(400).json({ success: false, message: 'Username already exists' });
      return;
    }
    
    // Update staff
    let updateQuery = '';
    let params = [];
    
    if (password) {
      updateQuery = `
        UPDATE staff
        SET name = $1, username = $2, password_hash = $3, role = $4
        WHERE id = $5
        RETURNING *
      `;
      params = [name, username, password, role, id];
    } else {
      updateQuery = `
        UPDATE staff
        SET name = $1, username = $2, role = $3
        WHERE id = $4
        RETURNING *
      `;
      params = [name, username, role, id];
    }
    
    const updateResult = await pool.query(updateQuery, params);
    const updatedStaff = updateResult.rows[0];
    
    res.json({
      success: true,
      staff: updatedStaff
    });
  } catch (error) {
    console.error('Edit staff error:', error);
    res.status(500).json({ success: false, message: 'An error occurred while editing staff' });
  }
};

// Display reports page
export const getReports = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only allow admin to access this page
    if (!req.session.user || req.session.user.role !== 'admin') {
      req.flash('error_msg', 'Unauthorized access');
      return res.redirect('/auth/login');
    }
    
    res.render('admin/reports', {
      title: 'Reports',
      activePage: 'reports'
    });
  } catch (error) {
    console.error('Reports error:', error);
    req.flash('error_msg', 'An error occurred while loading reports');
    res.redirect('/admin/dashboard');
  }
};

// Export data
export const exportData = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only allow admin to access this API
    if (!req.session.user || req.session.user.role !== 'admin') {
      req.flash('error_msg', 'Unauthorized access');
      return res.redirect('/auth/login');
    }
    
    const { type } = req.params;
    
    let data = [];
    let filename = '';
    
    switch (type) {
      case 'players':
        const playersQuery = 'SELECT * FROM players ORDER BY name';
        const playersResult = await pool.query(playersQuery);
        data = playersResult.rows;
        filename = 'players.json';
        break;
      case 'stats':
        const statsQuery = `
          SELECT 
            p.name as player_name,
            p.phone,
            p.residence,
            p.age_group,
            gs.goals,
            gs.competition_type,
            gs.timestamp
          FROM 
            game_stats gs
          JOIN 
            players p ON gs.player_id = p.id
          ORDER BY 
            gs.timestamp DESC
        `;
        const statsResult = await pool.query(statsQuery);
        data = statsResult.rows;
        filename = 'stats.json';
        break;
      default:
        req.flash('error_msg', 'Invalid export type');
        return res.redirect('/admin/reports');
    }
    
    // Set headers
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    
    // Send data
    res.send(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Export data error:', error);
    req.flash('error_msg', 'An error occurred while exporting data');
    res.redirect('/admin/reports');
  }
};

// Display settings page
export const getSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only allow admin to access this page
    if (!req.session.user || req.session.user.role !== 'admin') {
      req.flash('error_msg', 'Unauthorized access');
      return res.redirect('/auth/login');
    }
    
    // Get event locations
    let locations = [];
    try {
      const locationsQuery = 'SELECT * FROM event_locations ORDER BY name';
      const locationsResult = await pool.query(locationsQuery);
      locations = locationsResult.rows;
    } catch (e) {
      console.log('Error fetching locations:', e);
    }
    
    res.render('admin/settings', {
      title: 'Settings',
      locations,
      activePage: 'settings'
    });
  } catch (error) {
    console.error('Settings error:', error);
    req.flash('error_msg', 'An error occurred while loading settings');
    res.redirect('/admin/dashboard');
  }
};

// Add event location
export const addEventLocation = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only allow admin to access this API
    if (!req.session.user || req.session.user.role !== 'admin') {
      req.flash('error_msg', 'Unauthorized access');
      return res.redirect('/auth/login');
    }
    
    const { name, address } = req.body;
    
    // Validate input
    if (!name || !address) {
      req.flash('error_msg', 'Name and address are required');
      return res.redirect('/admin/settings');
    }
    
    // Insert new location
    const insertQuery = `
      INSERT INTO event_locations (name, address)
      VALUES ($1, $2)
    `;
    
    await pool.query(insertQuery, [name, address]);
    
    req.flash('success_msg', 'Event location added successfully');
    res.redirect('/admin/settings');
  } catch (error) {
    console.error('Add event location error:', error);
    req.flash('error_msg', 'An error occurred while adding event location');
    res.redirect('/admin/settings');
  }
};

// Delete event location
export const deleteEventLocation = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only allow admin to access this API
    if (!req.session.user || req.session.user.role !== 'admin') {
      req.flash('error_msg', 'Unauthorized access');
      return res.redirect('/auth/login');
    }
    
    const { id } = req.params;
    
    // Delete location
    const deleteQuery = 'DELETE FROM event_locations WHERE id = $1';
    await pool.query(deleteQuery, [id]);
    
    req.flash('success_msg', 'Event location deleted successfully');
    res.redirect('/admin/settings');
  } catch (error) {
    console.error('Delete event location error:', error);
    req.flash('error_msg', 'An error occurred while deleting event location');
    res.redirect('/admin/settings');
  }
};