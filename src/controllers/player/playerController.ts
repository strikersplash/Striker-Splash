import { Request, Response } from 'express';
import { pool } from '../../config/db';
import Player from '../../models/Player';
import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';

// Display player dashboard
export const getDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only allow players to access this page
    if (!req.session.user || req.session.user.role !== 'player') {
      req.flash('error_msg', 'Unauthorized access');
      return res.redirect('/auth/login');
    }
    
    const playerId = parseInt(req.session.user.id);
    
    // Get player details
    const player = await Player.findById(playerId);
    
    if (!player) {
      req.flash('error_msg', 'Player not found');
      return res.redirect('/auth/logout');
    }
    
    // Get player stats
    const statsQuery = `
      SELECT 
        SUM(goals) as total_goals,
        COUNT(*) as total_attempts
      FROM 
        game_stats
      WHERE 
        player_id = $1
    `;
    
    const statsResult = await pool.query(statsQuery, [playerId]);
    const stats = statsResult.rows[0] || { total_goals: 0, total_attempts: 0 };
    
    // Get recent activity
    let recentActivity = [];
    try {
      const activityQuery = `
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
        LIMIT 5
      `;
      
      const activityResult = await pool.query(activityQuery, [playerId]);
      recentActivity = activityResult.rows;
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    }
    
    // Get player's team directly from database
    let teamInfo = null;
    try {
      const teamQuery = `
        SELECT t.* 
        FROM teams t
        JOIN team_members tm ON t.id = tm.team_id
        WHERE tm.player_id = $1
      `;
      
      const teamResult = await pool.query(teamQuery, [playerId]);
      if (teamResult.rows.length > 0) {
        teamInfo = teamResult.rows[0];
      }
    } catch (error) {
      console.error('Error fetching team:', error);
    }
    
    res.render('player/dashboard', {
      title: 'Player Dashboard',
      player,
      stats,
      recentActivity,
      teamInfo
    });
  } catch (error) {
    console.error('Player dashboard error:', error);
    req.flash('error_msg', 'An error occurred while loading the dashboard');
    res.redirect('/');
  }
};

// Display edit profile form
export const getEditProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only allow players to access this page
    if (!req.session.user || req.session.user.role !== 'player') {
      req.flash('error_msg', 'Unauthorized access');
      return res.redirect('/auth/login');
    }
    
    const playerId = parseInt(req.session.user.id);
    
    // Get player details
    const player = await Player.findById(playerId);
    
    if (!player) {
      req.flash('error_msg', 'Player not found');
      return res.redirect('/auth/logout');
    }
    
    // Get age brackets
    const ageBracketsQuery = `
      SELECT * FROM age_brackets
      WHERE active = true
      ORDER BY min_age
    `;
    
    const ageBracketsResult = await pool.query(ageBracketsQuery);
    const ageBrackets = ageBracketsResult.rows;
    
    res.render('player/edit-profile', {
      title: 'Edit Profile',
      player,
      ageBrackets
    });
  } catch (error) {
    console.error('Edit profile error:', error);
    req.flash('error_msg', 'An error occurred while loading the edit profile page');
    res.redirect('/player/dashboard');
  }
};

// Update player profile
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only allow players to access this API
    if (!req.session.user || req.session.user.role !== 'player') {
      req.flash('error_msg', 'Unauthorized access');
      return res.redirect('/auth/login');
    }
    
    const playerId = parseInt(req.session.user.id);
    const { phone, email, residence, age_group } = req.body;
    
    // Validate input
    if (!phone || !residence || !age_group) {
      req.flash('error_msg', 'Phone, residence, and age group are required');
      return res.redirect('/player/edit-profile');
    }
    
    // Update player
    const updatedPlayer = await Player.update(playerId, {
      phone,
      email: email || null,
      residence,
      age_group
    });
    
    if (!updatedPlayer) {
      req.flash('error_msg', 'Failed to update profile');
      return res.redirect('/player/edit-profile');
    }
    
    req.flash('success_msg', 'Profile updated successfully');
    res.redirect('/player/dashboard');
  } catch (error) {
    console.error('Update profile error:', error);
    req.flash('error_msg', 'An error occurred while updating profile');
    res.redirect('/player/edit-profile');
  }
};

// Download QR code
export const downloadQR = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only allow players to access this API
    if (!req.session.user || req.session.user.role !== 'player') {
      req.flash('error_msg', 'Unauthorized access');
      return res.redirect('/auth/login');
    }
    
    const playerId = parseInt(req.session.user.id);
    
    // Get player details
    const player = await Player.findById(playerId);
    
    if (!player) {
      req.flash('error_msg', 'Player not found');
      return res.redirect('/auth/logout');
    }
    
    // Create QR code data
    const qrData = JSON.stringify({
      playerId: player.id,
      name: player.name,
      phone: player.phone
    });
    
    // Generate QR code
    const qrCodeDataURL = await QRCode.toDataURL(qrData);
    
    // Convert data URL to buffer
    const data = qrCodeDataURL.replace(/^data:image\/png;base64,/, '');
    const buffer = Buffer.from(data, 'base64');
    
    // Set response headers
    res.setHeader('Content-Disposition', `attachment; filename="qr-code-${player.id}.png"`);
    res.setHeader('Content-Type', 'image/png');
    
    // Send the buffer
    res.send(buffer);
  } catch (error) {
    console.error('Download QR code error:', error);
    req.flash('error_msg', 'An error occurred while downloading QR code');
    res.redirect('/player/dashboard');
  }
};