import { Request, Response } from 'express';
import { pool } from '../../config/db';

// Display leaderboard page
export const getLeaderboard = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get filter parameters
    const { gender, ageGroup, residence, timeRange, view } = req.query;
    
    // Check if we're viewing team leaderboard
    const isTeamView = view === 'teams';
    
    if (isTeamView) {
      // Get team leaderboard
      const teamQuery = `
        SELECT 
          t.id,
          t.name,
          COUNT(DISTINCT tm.player_id) as member_count,
          SUM(gs.goals) as total_goals,
          COUNT(DISTINCT gs.id) as total_attempts,
          CASE WHEN COUNT(DISTINCT gs.id) = 0 THEN 0
               ELSE SUM(gs.goals)::float / COUNT(DISTINCT gs.id)
          END as accuracy,
          STRING_AGG(DISTINCT s.name, ', ') as referees,
          STRING_AGG(DISTINCT p.residence, ', ') as districts
        FROM 
          teams t
        JOIN 
          team_members tm ON t.id = tm.team_id
        JOIN 
          players p ON tm.player_id = p.id
        LEFT JOIN
          game_stats gs ON p.id = gs.player_id AND gs.team_play = TRUE
        LEFT JOIN
          staff s ON gs.staff_id = s.id
        GROUP BY 
          t.id, t.name
        ORDER BY 
          total_goals DESC, total_attempts ASC
      `;
      
      const result = await pool.query(teamQuery);
      const teams = result.rows;
      
      // Calculate percentiles
      teams.forEach((team, index) => {
        team.percentile = Math.ceil(((index + 1) / teams.length) * 100);
      });
      
      res.render('leaderboard/teams', {
        title: 'Team Leaderboard',
        teams,
        filters: {
          view: 'teams'
        }
      });
      
    } else {
      // Build query with filters for individual leaderboard
      let query = `
        SELECT 
          p.id,
          p.name,
          p.residence,
          p.gender,
          p.age_group,
          SUM(gs.goals) as total_goals,
          COUNT(DISTINCT gs.id) as total_attempts,
          STRING_AGG(DISTINCT s.name, ', ') as referees
        FROM 
          game_stats gs
        JOIN 
          players p ON gs.player_id = p.id
        JOIN
          staff s ON gs.staff_id = s.id
        JOIN
          queue_tickets qt ON gs.queue_ticket_id = qt.id
        WHERE 
          qt.status = 'played'
      `;
      
      const params: any[] = [];
      let paramIndex = 1;
      
      // Only include entries with 5 kicks (official competition entries)
      query += ` AND qt.official = TRUE`;
      
      if (gender) {
        query += ` AND p.gender = $${paramIndex}`;
        params.push(gender);
        paramIndex++;
      }
      
      if (ageGroup) {
        query += ` AND p.age_group = $${paramIndex}`;
        params.push(ageGroup);
        paramIndex++;
      }
      
      if (residence) {
        query += ` AND p.residence ILIKE $${paramIndex}`;
        params.push(`%${residence}%`);
        paramIndex++;
      }
      
      // Add time range filter
      if (timeRange) {
        const now = new Date();
        let startDate = new Date();
        
        switch(timeRange) {
          case 'day':
            startDate.setDate(now.getDate() - 1);
            break;
          case 'week':
            startDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            startDate.setMonth(now.getMonth() - 1);
            break;
          case 'year':
            startDate.setFullYear(now.getFullYear() - 1);
            break;
          default:
            // No time filter
            break;
        }
        
        if (timeRange !== 'all') {
          query += ` AND gs.timestamp >= $${paramIndex}`;
          params.push(startDate);
          paramIndex++;
        }
      }
      
      query += `
        GROUP BY 
          p.id, p.name, p.residence, p.gender, p.age_group
        ORDER BY 
          total_goals DESC, total_attempts ASC
      `;
      
      const result = await pool.query(query, params);
      const leaderboard = result.rows;
      
      // Calculate percentiles
      leaderboard.forEach((player, index) => {
        player.percentile = Math.ceil(((index + 1) / leaderboard.length) * 100);
      });
      
      // Get age brackets
      const ageBracketsQuery = `
        SELECT * FROM age_brackets
        WHERE active = true
        ORDER BY min_age
      `;
      
      let ageBrackets = [];
      try {
        const ageBracketsResult = await pool.query(ageBracketsQuery);
        ageBrackets = ageBracketsResult.rows;
      } catch (e) {
        console.log('Error fetching age brackets:', e);
      }
      
      // Get staff on duty today
      const today = new Date().toISOString().split('T')[0];
      
      const staffOnDutyQuery = `
        SELECT 
          s.name, sod.role
        FROM 
          staff_on_duty sod
        JOIN
          staff s ON sod.staff_id = s.id
        WHERE 
          sod.duty_date = $1
        ORDER BY
          sod.role
      `;
      
      let staffOnDuty = [];
      try {
        const staffOnDutyResult = await pool.query(staffOnDutyQuery, [today]);
        staffOnDuty = staffOnDutyResult.rows;
      } catch (e) {
        console.log('Error fetching staff on duty:', e);
      }
      
      res.render('leaderboard/index', {
        title: 'Leaderboard',
        leaderboard,
        filters: {
          gender: gender || 'all',
          ageGroup: ageGroup || 'all',
          residence: residence || 'all',
          timeRange: timeRange || 'all',
          view: 'players'
        },
        ageBrackets,
        staffOnDuty
      });
    }
  } catch (error) {
    console.error('Leaderboard error:', error);
    req.flash('error_msg', 'An error occurred while loading the leaderboard');
    res.redirect('/');
  }
};