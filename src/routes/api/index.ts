import express from 'express';
import { pool } from '../../config/db';
import QueueTicket from '../../models/QueueTicket';
import QRCode from 'qrcode';

const router = express.Router();

// Get current queue position
router.get('/queue/current', async (req, res) => {
  try {
    const currentQueuePosition = await QueueTicket.getCurrentQueuePosition();
    res.json({ currentQueuePosition });
  } catch (error) {
    console.error('Error getting current queue position:', error);
    res.status(500).json({ error: 'Failed to get current queue position' });
  }
});

// Search players by name or ID
router.get('/players/search', async (req, res) => {
  try {
    const name = req.query.name as string;
    const id = req.query.id as string;
    
    let query = '';
    let params = [];
    
    if (id) {
      query = 'SELECT * FROM players WHERE id = $1';
      params = [id];
    } else if (name) {
      query = `
        SELECT * FROM players 
        WHERE name ILIKE $1
        ORDER BY name
        LIMIT 10
      `;
      params = [`%${name}%`];
    } else {
      return res.json([]);
    }
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error searching players:', error);
    res.status(500).json({ error: 'Failed to search players' });
  }
});

// Get today's activity
router.get('/activity/today', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const query = `
      SELECT 
        gs.timestamp,
        p.name as playerName,
        gs.goals
      FROM 
        game_stats gs
      JOIN 
        players p ON gs.player_id = p.id
      WHERE 
        gs.timestamp >= $1
      ORDER BY 
        gs.timestamp DESC
    `;
    
    const result = await pool.query(query, [today]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting today\'s activity:', error);
    res.status(500).json({ error: 'Failed to get today\'s activity' });
  }
});

// Get today's transactions
router.get('/transactions/today', async (req, res) => {
  try {
    // First check if transactions table exists
    const checkTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'transactions'
      )
    `;
    
    const checkResult = await pool.query(checkTableQuery);
    
    if (!checkResult.rows[0].exists) {
      // Table doesn't exist, return empty array
      return res.json([]);
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const query = `
      SELECT 
        t.created_at as timestamp,
        p.name as playerName,
        t.kicks,
        t.amount,
        qt.ticket_number as ticketNumber
      FROM 
        transactions t
      JOIN 
        players p ON t.player_id = p.id
      LEFT JOIN 
        queue_tickets qt ON t.player_id = qt.player_id AND DATE(t.created_at) = DATE(qt.created_at)
      WHERE 
        t.created_at >= $1
      ORDER BY 
        t.created_at DESC
    `;
    
    const result = await pool.query(query, [today]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting today\'s transactions:', error);
    res.json([]); // Return empty array on error
  }
});

// Get player's team
router.get('/player/:id/team', async (req, res) => {
  try {
    const playerId = req.params.id;
    
    const query = `
      SELECT 
        t.id,
        t.name,
        COUNT(tm2.id) as memberCount
      FROM 
        team_members tm
      JOIN 
        teams t ON tm.team_id = t.id
      JOIN 
        team_members tm2 ON t.id = tm2.team_id
      WHERE 
        tm.player_id = $1
      GROUP BY 
        t.id, t.name
    `;
    
    const result = await pool.query(query, [playerId]);
    
    if (result.rows.length > 0) {
      res.json({ 
        team: {
          id: result.rows[0].id,
          name: result.rows[0].name
        },
        memberCount: result.rows[0].membercount
      });
    } else {
      res.json({ team: null, memberCount: 0 });
    }
  } catch (error) {
    console.error('Error getting player\'s team:', error);
    res.status(500).json({ error: 'Failed to get player\'s team' });
  }
});

// Generate QR code for player
router.get('/qr/:playerId', async (req, res) => {
  try {
    const playerId = req.params.playerId;
    
    // Get player details
    const playerQuery = 'SELECT * FROM players WHERE id = $1';
    const playerResult = await pool.query(playerQuery, [playerId]);
    
    if (playerResult.rows.length === 0) {
      return res.status(404).send('Player not found');
    }
    
    const player = playerResult.rows[0];
    
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
    res.setHeader('Content-Type', 'image/png');
    
    // Send the buffer
    res.send(buffer);
  } catch (error) {
    console.error('QR code generation error:', error);
    res.status(500).send('Failed to generate QR code');
  }
});

export default router;