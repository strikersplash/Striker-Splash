import { Request, Response } from 'express';
import Player from '../../models/Player';
import Shot from '../../models/Shot';
import { generateQRHash, generateQRCode } from '../../services/qrService';

// Display transaction form
export const getTransactionForm = (req: Request, res: Response): void => {
  // Only allow staff to access this page
  if (!req.session.user) {
    req.flash('error_msg', 'Please log in to access this page');
    return res.redirect('/auth/login');
  }
  
  res.render('player/transaction', { 
    title: 'Sell Kicks',
    step: 'registration'
  });
};

// Process player registration and payment
export const processTransaction = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only allow staff to access this page
    if (!req.session.user) {
      req.flash('error_msg', 'Please log in to access this page');
      return res.redirect('/auth/login');
    }
    
    const { name, phone, residence, shotsQuantity, playerType } = req.body;
    
    // Validate input
    if (!name || !phone || !residence || !shotsQuantity) {
      req.flash('error_msg', 'Please fill in all fields');
      return res.redirect('/player/transaction');
    }
    
    // Calculate amount ($2 BZD per shot)
    const amount = parseInt(shotsQuantity) * 2;
    
    // Check if player already exists
    let player = await Player.findByPhone(phone);
    
    // If player doesn't exist, create new player
    if (!player) {
      // Generate QR hash
      const qrHash = generateQRHash();
      
      // Create new player with a dummy DOB (required by the model)
      const dummyDob = new Date('2000-01-01');
      
      // Determine age group based on player type
      let ageGroup = 'adult';
      if (playerType === 'teen') {
        ageGroup = '13-18';
      } else if (playerType === 'child') {
        ageGroup = 'under13';
      }
      
      player = await Player.create({
        name,
        phone,
        dob: dummyDob,
        residence,
        qr_hash: qrHash,
        age_group: ageGroup
      });
      
      if (!player) {
        throw new Error('Failed to create player');
      }
    }
    
    // Create new shot transaction
    const shot = await Shot.create({
      player_id: player.id,
      amount,
      shots_quantity: shotsQuantity,
      payment_status: 'completed', // In a real app, this would be set after payment confirmation
      payment_reference: `PAY-${Date.now()}`
    });
    
    if (!shot) {
      throw new Error('Failed to create shot');
    }
    
    // Generate QR code
    const qrCodeBase64 = await generateQRCode(player.id, player.qr_hash);
    
    // Render confirmation page
    res.render('player/transaction', {
      title: 'Sale Confirmation',
      step: 'confirmation',
      player,
      shot,
      qrCodeBase64
    });
  } catch (error) {
    console.error('Transaction error:', error);
    req.flash('error_msg', 'An error occurred during sale processing');
    res.redirect('/player/transaction');
  }
};

// Display QR code
export const getQRCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone } = req.query;
    
    if (!phone) {
      req.flash('error_msg', 'Phone number is required');
      return res.redirect('/player/transaction');
    }
    
    // Find player
    const player = await Player.findByPhone(phone as string);
    
    if (!player) {
      req.flash('error_msg', 'Player not found');
      return res.redirect('/player/transaction');
    }
    
    // Get latest shot
    const shots = await Shot.find({ player_id: player.id });
    const shot = shots.length > 0 ? shots[0] : null;
    
    if (!shot) {
      req.flash('error_msg', 'No kicks found for this player');
      return res.redirect('/player/transaction');
    }
    
    // Generate QR code
    const qrCodeBase64 = await generateQRCode(player.id, player.qr_hash);
    
    // Render QR code page
    res.render('player/transaction', {
      title: 'Player QR Code',
      step: 'qrcode',
      player,
      shot,
      qrCodeBase64
    });
  } catch (error) {
    console.error('QR code error:', error);
    req.flash('error_msg', 'An error occurred while retrieving QR code');
    res.redirect('/player/transaction');
  }
};

// Search players by name (API endpoint)
export const searchPlayers = async (req: Request, res: Response): Promise<any> => {
  try {
    const { name } = req.query;
    
    if (!name || typeof name !== 'string') {
      return res.json([]);
    }
    
    // Search for players with similar names
    const query = 'SELECT name, phone, residence FROM players WHERE name ILIKE $1 LIMIT 10';
    const { rows } = await Player.query(query, [`%${name}%`]);
    
    res.json(rows);
  } catch (error) {
    console.error('Player search error:', error);
    res.status(500).json({ error: 'An error occurred while searching for players' });
  }
};