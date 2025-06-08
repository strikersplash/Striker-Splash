import { Request, Response } from 'express';
import Player from '../../models/Player';
import GameStat from '../../models/GameStat';
import QueueTicket from '../../models/QueueTicket';
import { generateQRCode } from '../../services/qrService';
import { pool } from '../../config/db';

// Display player dashboard
export const getDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone } = req.query;
    
    // If logged in as player, use session data
    if (req.session.user && req.session.user.role === 'player' && !phone) {
      // Make sure we have a valid ID
      const playerId = parseInt(req.session.user.id);
      if (isNaN(playerId)) {
        req.flash('error_msg', 'Invalid player ID');
        return res.redirect('/');
      }
      
      const player = await Player.findById(playerId);
      
      if (!player) {
        req.flash('error_msg', 'Player not found');
        return res.redirect('/');
      }
      
      return renderDashboard(req, res, player);
    }
    
    // Otherwise, use phone parameter
    if (!phone) {
      req.flash('error_msg', 'Phone number is required');
      return res.redirect('/');
    }
    
    // Find player
    const player = await Player.findByPhone(phone as string);
    
    if (!player) {
      req.flash('error_msg', 'Player not found');
      return res.redirect('/');
    }
    
    renderDashboard(req, res, player);
  } catch (error) {
    console.error('Dashboard error:', error);
    req.flash('error_msg', 'An error occurred while retrieving player data');
    res.redirect('/');
  }
};

// Helper function to render dashboard
async function renderDashboard(req: Request, res: Response, player: any): Promise<void> {
  // Get player stats
  const stats = await GameStat.find({ player_id: player.id });
  
  // Calculate total goals
  const totalGoals = stats.reduce((sum: number, stat: any) => sum + stat.goals, 0);
  
  // Generate QR code as base64
  const qrCodeBase64 = await generateQRCode(player.id, player.qr_hash);
  
  // Check if player is logged in
  const isLoggedIn = req.session.user && 
                    req.session.user.role === 'player' && 
                    parseInt(req.session.user.id) === player.id;
  
  // Get active queue tickets
  const activeTickets = await QueueTicket.findActiveByPlayerId(player.id);
  
  // Get current queue position
  const currentQueuePosition = await QueueTicket.getCurrentQueuePosition();
  
  // Render dashboard
  res.render('player/dashboard', {
    title: 'Player Dashboard',
    player,
    stats,
    totalGoals,
    qrCodeBase64,
    isLoggedIn,
    activeTickets,
    currentQueuePosition,
    kicksBalance: player.kicks_balance || 0
  });
}

// Download QR code
export const downloadQRCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Find player
    const player = await Player.findById(parseInt(id));
    
    if (!player) {
      req.flash('error_msg', 'Player not found');
      return res.redirect('/');
    }
    
    // Generate QR code as base64
    const qrCodeBase64 = await generateQRCode(player.id, player.qr_hash);
    
    // Convert base64 to buffer
    const qrBuffer = Buffer.from(qrCodeBase64, 'base64');
    
    // Set headers
    res.setHeader('Content-Disposition', `attachment; filename="qrcode-${player.id}.png"`);
    res.setHeader('Content-Type', 'image/png');
    
    // Send file
    res.send(qrBuffer);
  } catch (error) {
    console.error('Download QR code error:', error);
    req.flash('error_msg', 'An error occurred while downloading QR code');
    res.redirect('/');
  }
};

// Display profile edit form
export const getEditProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only allow logged in players
    if (!req.session.user || req.session.user.role !== 'player') {
      req.flash('error_msg', 'Please log in to edit your profile');
      return res.redirect('/auth/login');
    }
    
    // Make sure we have a valid ID
    const playerId = parseInt(req.session.user.id);
    if (isNaN(playerId)) {
      req.flash('error_msg', 'Invalid player ID');
      return res.redirect('/');
    }
    
    // Find player
    const player = await Player.findById(playerId);
    
    if (!player) {
      req.flash('error_msg', 'Player not found');
      return res.redirect('/');
    }
    
    // Render edit form
    res.render('player/edit-profile', {
      title: 'Edit Profile',
      player
    });
  } catch (error) {
    console.error('Edit profile error:', error);
    req.flash('error_msg', 'An error occurred while retrieving player data');
    res.redirect('/');
  }
};

// Process profile edit form
export const postEditProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only allow logged in players
    if (!req.session.user || req.session.user.role !== 'player') {
      req.flash('error_msg', 'Please log in to edit your profile');
      return res.redirect('/auth/login');
    }
    
    // Make sure we have a valid ID
    const playerId = parseInt(req.session.user.id);
    if (isNaN(playerId)) {
      req.flash('error_msg', 'Invalid player ID');
      return res.redirect('/');
    }
    
    // Process file upload
    (req as any).fileUpload(req, res, async function(err: any) {
      if (err) {
        req.flash('error_msg', 'Error uploading file: ' + err.message);
        return res.redirect('/player/edit-profile');
      }
      
      const { phone, email, residence, password } = req.body;
      
      // Update player - name is excluded as only staff can change names
      const updateData: any = {
        phone,
        email,
        residence
      };
      
      // Only update password if provided
      if (password) {
        updateData.password_hash = password;
      }
      
      // Add photo path if file was uploaded
      if (req.file) {
        updateData.photo_path = '/uploads/' + req.file.filename;
        
        // Insert into uploads table
        await pool.query(
          'INSERT INTO uploads (player_id, filename, filepath, mimetype, size) VALUES ($1, $2, $3, $4, $5)',
          [playerId, req.file.filename, updateData.photo_path, req.file.mimetype, req.file.size]
        );
      }
      
      const updatedPlayer = await Player.update(playerId, updateData);
      
      if (!updatedPlayer) {
        req.flash('error_msg', 'Failed to update profile');
        return res.redirect('/player/edit-profile');
      }
      
      req.flash('success_msg', 'Profile updated successfully');
      res.redirect(`/player/dashboard?phone=${updatedPlayer.phone}`);
    });
  } catch (error) {
    console.error('Update profile error:', error);
    req.flash('error_msg', 'An error occurred while updating profile');
    res.redirect('/player/edit-profile');
  }
};