import { Request, Response } from 'express';
import Player from '../../models/Player';

// Display name change interface
export const getNameChangeInterface = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only allow staff to access this page
    if (!req.session.user || (req.session.user.role !== 'admin' && req.session.user.role !== 'staff')) {
      req.flash('error_msg', 'Unauthorized access');
      return res.redirect('/auth/login');
    }
    
    // Get search query
    const { search } = req.query;
    
    // Get players if search query provided
    let players: any[] = [];
    if (search) {
      players = await Player.search(search as string);
    }
    
    res.render('staff/name-change', {
      title: 'Player Name Change',
      players,
      search: search || ''
    });
  } catch (error) {
    console.error('Name change interface error:', error);
    req.flash('error_msg', 'An error occurred while loading the name change interface');
    res.redirect('/staff/dashboard');
  }
};

// Process name change
export const postNameChange = async (req: Request, res: Response): Promise<void> => {
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
    
    // Check if name change count is already at 2
    const nameChangeCount = player.name_change_count || 0;
    if (nameChangeCount >= 2) {
      res.status(400).json({ success: false, message: 'Player name has already been changed twice and cannot be changed again' });
      return;
    }
    
    // Update player name and increment change count
    const updatedPlayer = await Player.update(player.id, { 
      name, 
      name_locked: nameChangeCount === 1, // Lock after second change
      name_change_count: nameChangeCount + 1
    });
    
    if (!updatedPlayer) {
      res.status(500).json({ success: false, message: 'Failed to update player name' });
      return;
    }
    
    res.json({
      success: true,
      player: updatedPlayer,
      remainingChanges: 2 - (nameChangeCount + 1)
    });
  } catch (error) {
    console.error('Update player name error:', error);
    res.status(500).json({ success: false, message: 'An error occurred while updating player name' });
  }
};