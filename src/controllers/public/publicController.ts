import { Request, Response } from 'express';
import { pool } from '../../config/db';

// Display home page
export const getHome = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get recent events
    let events = [];
    try {
      const eventsQuery = `
        SELECT * FROM events
        WHERE event_date >= CURRENT_DATE
        ORDER BY event_date ASC
        LIMIT 3
      `;
      
      const eventsResult = await pool.query(eventsQuery);
      events = eventsResult.rows;
    } catch (e) {
      console.log('Error fetching events:', e);
      
      // Create events table if it doesn't exist
      try {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS events (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            event_date DATE NOT NULL,
            location VARCHAR(100) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
      } catch (tableError) {
        console.error('Error creating events table:', tableError);
      }
    }
    
    // Render home page
    res.render('public/home', {
      title: 'Home',
      events
    });
  } catch (error) {
    console.error('Home page error:', error);
    res.status(500).render('system/error', { 
      title: 'Error',
      code: 500, 
      message: 'An error occurred while loading the home page' 
    });
  }
};

// Display about page
export const getAbout = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get upcoming events
    let events = [];
    try {
      const eventsQuery = `
        SELECT * FROM events
        WHERE event_date >= CURRENT_DATE
        ORDER BY event_date ASC
        LIMIT 5
      `;
      
      const eventsResult = await pool.query(eventsQuery);
      events = eventsResult.rows;
    } catch (e) {
      console.log('Error fetching events:', e);
      
      // Create events table if it doesn't exist
      try {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS events (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            event_date DATE NOT NULL,
            location VARCHAR(100) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        
        // Add sample events if table was just created
        await pool.query(`
          INSERT INTO events (name, description, event_date, location)
          VALUES 
            ('Striker Splash Tournament', 'Annual football skills competition', CURRENT_DATE + INTERVAL '7 days', 'Belize City Stadium'),
            ('Youth Skills Camp', 'Training camp for young players', CURRENT_DATE + INTERVAL '14 days', 'Orange Walk Town'),
            ('Weekend Challenge', 'Weekend competition with prizes', CURRENT_DATE + INTERVAL '3 days', 'San Pedro')
        `);
        
        // Get events again
        const newEventsQuery = `
          SELECT * FROM events
          WHERE event_date >= CURRENT_DATE
          ORDER BY event_date ASC
          LIMIT 5
        `;
        const newEventsResult = await pool.query(newEventsQuery);
        events = newEventsResult.rows;
      } catch (tableError) {
        console.error('Error creating events table:', tableError);
      }
    }
    
    res.render('public/about', {
      title: 'About Us',
      events
    });
  } catch (error) {
    console.error('About page error:', error);
    res.status(500).render('system/error', { 
      title: 'Error',
      code: 500, 
      message: 'An error occurred while loading the about page' 
    });
  }
};