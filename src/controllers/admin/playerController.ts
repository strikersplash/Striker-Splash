import { Request, Response } from 'express';
import { pool } from '../../config/db';

// Display player management page
export const getPlayerManagement = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only allow admin to access this page
    if (!req.session.user || req.session.user.role !== 'admin') {
      req.flash('error_msg', 'Unauthorized access');
      return res.redirect('/auth/login');
    }
    
    // Get search query
    const { search } = req.query;
    
    // Build query
    let query = 'SELECT * FROM players';
    const params: any[] = [];
    
    if (search) {
      query += ' WHERE name ILIKE $1 OR phone LIKE $2 OR email ILIKE $3';
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }
    
    query += ' ORDER BY name LIMIT 100';
    
    // Get players
    const playersResult = await pool.query(query, params);
    const players = playersResult.rows;
    
    res.render('admin/player-management', {
      title: 'Player Management',
      players,
      search: search || '',
      activePage: 'players'
    });
  } catch (error) {
    console.error('Player management error:', error);
    req.flash('error_msg', 'An error occurred while loading player management');
    res.redirect('/admin/dashboard');
  }
};

// Display player details
export const getPlayerDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only allow admin to access this page
    if (!req.session.user || req.session.user.role !== 'admin') {
      req.flash('error_msg', 'Unauthorized access');
      return res.redirect('/auth/login');
    }
    
    const { id } = req.params;
    
    // Get player
    const playerQuery = 'SELECT * FROM players WHERE id = $1';
    const playerResult = await pool.query(playerQuery, [id]);
    const player = playerResult.rows[0];
    
    if (!player) {
      req.flash('error_msg', 'Player not found');
      return res.redirect('/admin/players');
    }
    
    // Get player stats
    const statsQuery = `
      SELECT 
        gs.*,
        s.name as staff_name
      FROM 
        game_stats gs
      LEFT JOIN
        staff s ON gs.staff_id = s.id
      WHERE 
        gs.player_id = $1
      ORDER BY 
        gs.timestamp DESC
    `;
    
    const statsResult = await pool.query(statsQuery, [id]);
    const stats = statsResult.rows;
    
    // Get player tickets
    const ticketsQuery = `
      SELECT *
      FROM queue_tickets
      WHERE player_id = $1
      ORDER BY created_at DESC
    `;
    
    const ticketsResult = await pool.query(ticketsQuery, [id]);
    const tickets = ticketsResult.rows;
    
    res.render('admin/player-details', {
      title: `Player: ${player.name}`,
      player,
      stats,
      tickets,
      activePage: 'players'
    });
  } catch (error) {
    console.error('Player details error:', error);
    req.flash('error_msg', 'An error occurred while loading player details');
    res.redirect('/admin/players');
  }
};

// Update player
export const updatePlayer = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only allow admin to access this API
    if (!req.session.user || req.session.user.role !== 'admin') {
      res.status(401).json({ success: false, message: 'Unauthorized access' });
      return;
    }
    
    const { id } = req.params;
    const { name, phone, email, residence, gender, age_group, kicks_balance } = req.body;
    
    // Validate input
    if (!name || !phone || !residence || !age_group) {
      res.status(400).json({ success: false, message: 'Name, phone, residence, and age group are required' });
      return;
    }
    
    // Update player
    const updateQuery = `
      UPDATE players
      SET name = $1, phone = $2, email = $3, residence = $4, gender = $5, age_group = $6, kicks_balance = $7
      WHERE id = $8
      RETURNING *
    `;
    
    const updateResult = await pool.query(updateQuery, [
      name, 
      phone, 
      email || null, 
      residence, 
      gender || null, 
      age_group, 
      kicks_balance || 0, 
      id
    ]);
    
    const updatedPlayer = updateResult.rows[0];
    
    res.json({
      success: true,
      player: updatedPlayer
    });
  } catch (error) {
    console.error('Update player error:', error);
    res.status(500).json({ success: false, message: 'An error occurred while updating player' });
  }
};