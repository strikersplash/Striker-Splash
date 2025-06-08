import { Request, Response } from 'express';
import { getLeaderboard } from '../../services/leaderboardService';
import { pool } from '../../config/db';

// Display home page
export const getHome = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get filter parameters
    const ageGroup = req.query.ageGroup as string || 'all';
    const location = req.query.location as string || 'all';
    
    // Get leaderboard data
    const leaderboard = await getLeaderboard(
      ageGroup !== 'all' ? ageGroup : undefined,
      location !== 'all' ? location : undefined,
      10
    );
    
    // Get event locations
    let eventLocations = [];
    try {
      const locationsQuery = `
        SELECT * FROM event_locations 
        WHERE end_date >= CURRENT_DATE 
        ORDER BY start_date ASC
      `;
      const locationsResult = await pool.query(locationsQuery);
      eventLocations = locationsResult.rows;
    } catch (error) {
      console.error('Error fetching event locations:', error);
      // Table might not exist yet, we'll use default locations in the view
    }
    
    // Render home page
    res.render('public/home', {
      title: 'Striker Splash',
      leaderboard,
      eventLocations,
      filters: {
        ageGroup,
        location
      }
    });
  } catch (error) {
    console.error('Home page error:', error);
    res.render('public/home', {
      title: 'Striker Splash',
      leaderboard: [],
      filters: {
        ageGroup: 'all',
        location: 'all'
      }
    });
  }
};