import { Request, Response } from 'express';
import Staff from '../../models/Staff';
import Player from '../../models/Player';
import bcrypt from 'bcryptjs';

// Display login form
export const getLogin = (req: Request, res: Response): void => {
  res.render('auth/login', { title: 'Login' });
};

// Process login form
export const postLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password, userType } = req.body;
    console.log('Login attempt:', { username, userType });

    // Validate input
    if (!username || !password) {
      req.flash('error_msg', 'Please enter all fields');
      return res.redirect('/auth/login');
    }

    // Staff login
    if (userType === 'staff') {
      // Find staff member
      const query = 'SELECT * FROM staff WHERE username = $1';
      const { rows } = await Staff.query(query, [username]);
      const staff = rows[0];
      
      if (!staff) {
        console.log('Staff not found');
        req.flash('error_msg', 'Invalid credentials');
        return res.redirect('/auth/login');
      }

      console.log('Staff found, comparing password');
      console.log('Stored hash:', staff.password_hash);
      
      // Verify password
      const isMatch = await bcrypt.compare(password, staff.password_hash);
      console.log('Password match:', isMatch);
      
      if (!isMatch) {
        console.log('Password mismatch for staff');
        req.flash('error_msg', 'Invalid credentials');
        return res.redirect('/auth/login');
      }

      // Create session
      req.session.user = {
        id: staff.id.toString(),
        username: staff.username,
        name: staff.name,
        role: staff.role,
        type: 'staff'
      };

      req.flash('success_msg', `Welcome back, ${staff.name}`);
      
      // Redirect based on role
      if (staff.role === 'admin') {
        res.redirect('/admin/dashboard');
      } else {
        res.redirect('/staff/interface');
      }
    } 
    // Player login
    else {
      // Find player by phone (used as username)
      const query = 'SELECT * FROM players WHERE phone = $1';
      const { rows } = await Player.query(query, [username]);
      const player = rows[0];
      
      if (!player || !player.password_hash) {
        console.log('Player not found or no password');
        req.flash('error_msg', 'Invalid credentials');
        return res.redirect('/auth/login');
      }

      console.log('Player found, comparing password');
      console.log('Stored hash:', player.password_hash);
      
      // Verify password
      const isMatch = await bcrypt.compare(password, player.password_hash);
      console.log('Password match:', isMatch);
      
      if (!isMatch) {
        console.log('Password mismatch for player');
        req.flash('error_msg', 'Invalid credentials');
        return res.redirect('/auth/login');
      }

      // Create session with valid ID
      req.session.user = {
        id: player.id.toString(),
        name: player.name,
        role: 'player',
        type: 'player'
      };

      req.flash('success_msg', `Welcome back, ${player.name}`);
      res.redirect(`/player/dashboard?phone=${player.phone}`);
    }
  } catch (error) {
    console.error('Login error:', error);
    req.flash('error_msg', 'An error occurred during login');
    res.redirect('/auth/login');
  }
};

// Display registration form
export const getRegister = (req: Request, res: Response): void => {
  res.render('auth/register', { title: 'Register' });
};

// Process registration form
export const postRegister = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, phone, dob, residence, password } = req.body;
    
    // Validate input
    if (!name || !phone || !dob || !residence || !password) {
      req.flash('error_msg', 'Please fill in all fields');
      return res.redirect('/auth/register');
    }
    
    // Check if player already exists
    const existingPlayer = await Player.findByPhone(phone);
    if (existingPlayer) {
      req.flash('error_msg', 'Phone number already registered');
      return res.redirect('/auth/register');
    }
    
    // Generate QR hash
    const qrHash = require('crypto').randomBytes(16).toString('hex');
    
    // Create new player
    const player = await Player.create({
      name,
      phone,
      dob,
      residence,
      qr_hash: qrHash,
      age_group: calculateAgeGroup(new Date(dob)),
      password_hash: password
    });
    
    if (!player) {
      req.flash('error_msg', 'Failed to create account');
      return res.redirect('/auth/register');
    }
    
    req.flash('success_msg', 'Account created successfully. You can now log in.');
    res.redirect('/auth/login');
  } catch (error) {
    console.error('Registration error:', error);
    req.flash('error_msg', 'An error occurred during registration');
    res.redirect('/auth/register');
  }
};

// Logout
export const logout = (req: Request, res: Response): void => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/auth/login');
  });
};

// Helper function to calculate age group
function calculateAgeGroup(dob: Date): string {
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  
  if (age < 13) {
    return 'under13';
  } else if (age < 18) {
    return '13-18';
  } else {
    return 'adult';
  }
}