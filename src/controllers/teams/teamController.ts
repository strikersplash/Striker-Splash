import { Request, Response } from 'express';
import Team from '../../models/Team';
import { pool } from '../../config/db';

export const createTeam = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name } = req.body;
    const playerId = parseInt(req.session.user.id);
    
    if (!name) {
      req.flash('error_msg', 'Team name is required');
      return res.redirect('/teams/create');
    }
    
    // Check if player is already in a team
    const existingTeam = await Team.getPlayerTeam(playerId);
    if (existingTeam) {
      req.flash('error_msg', 'You are already in a team');
      return res.redirect('/teams/dashboard');
    }
    
    const team = await Team.create(name, playerId);
    
    req.flash('success_msg', 'Team created successfully!');
    res.redirect(`/teams/dashboard/${team.id}`);
  } catch (error) {
    console.error('Create team error:', error);
    req.flash('error_msg', 'Failed to create team');
    res.redirect('/player/dashboard');
  }
};

export const getCreateTeamForm = (req: Request, res: Response): void => {
  res.render('teams/create', {
    title: 'Create Team'
  });
};

export const joinTeam = async (req: Request, res: Response): Promise<void> => {
  try {
    const { teamId } = req.params;
    const playerId = parseInt(req.session.user.id);
    
    // Check if player is already in a team
    const existingTeam = await Team.getPlayerTeam(playerId);
    if (existingTeam) {
      req.flash('error_msg', 'You are already in a team');
      return res.redirect('/teams/dashboard');
    }
    
    const success = await Team.addMember(parseInt(teamId), playerId);
    
    if (success) {
      req.flash('success_msg', 'You have joined the team!');
      res.redirect(`/teams/dashboard/${teamId}`);
    } else {
      req.flash('error_msg', 'Team is already full (max 5 members) or you are already in a team');
      res.redirect('/teams/browse');
    }
  } catch (error) {
    console.error('Join team error:', error);
    req.flash('error_msg', 'Failed to join team');
    res.redirect('/teams/browse');
  }
};

export const leaveTeam = async (req: Request, res: Response): Promise<void> => {
  try {
    const playerId = parseInt(req.session.user.id);
    
    const success = await Team.leaveTeam(playerId);
    
    if (success) {
      req.flash('success_msg', 'You have left the team');
      res.redirect('/player/dashboard');
    } else {
      req.flash('error_msg', 'You are not in a team');
      res.redirect('/player/dashboard');
    }
  } catch (error) {
    console.error('Leave team error:', error);
    req.flash('error_msg', 'Failed to leave team');
    res.redirect('/teams/dashboard');
  }
};

export const getTeamDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const { teamId } = req.params;
    const playerId = parseInt(req.session.user.id);
    
    // If no teamId provided, redirect to player's team
    if (!teamId) {
      const playerTeam = await Team.getPlayerTeam(playerId);
      
      if (!playerTeam) {
        req.flash('error_msg', 'You are not in a team');
        return res.redirect('/teams/browse');
      }
      
      return res.redirect(`/teams/dashboard/${playerTeam.id}`);
    }
    
    // Get team details, members, and stats
    const team = await Team.getById(parseInt(teamId));
    
    if (!team) {
      req.flash('error_msg', 'Team not found');
      return res.redirect('/teams/browse');
    }
    
    const members = await Team.getMembers(parseInt(teamId));
    const stats = await Team.getTeamStats(parseInt(teamId));
    const sessionStats = await Team.getTeamStatsBySession(parseInt(teamId));
    
    // Check if user is a member of this team
    const isMember = members.some(member => member.player_id === playerId);
    
    res.render('teams/dashboard', {
      title: `Team: ${team.name}`,
      team,
      members,
      stats,
      sessionStats,
      isMember
    });
  } catch (error) {
    console.error('Team dashboard error:', error);
    req.flash('error_msg', 'Failed to load team dashboard');
    res.redirect('/player/dashboard');
  }
};

export const browseTeams = async (req: Request, res: Response): Promise<void> => {
  try {
    const teams = await Team.getAll();
    
    res.render('teams/browse', {
      title: 'Browse Teams',
      teams
    });
  } catch (error) {
    console.error('Browse teams error:', error);
    req.flash('error_msg', 'Failed to load teams');
    res.redirect('/player/dashboard');
  }
};

export const getTeamComparison = async (req: Request, res: Response): Promise<void> => {
  try {
    const { team1, team2 } = req.query;
    
    if (team1 && team2) {
      const comparisonData = await Team.compareTeams(parseInt(team1 as string), parseInt(team2 as string));
      
      res.render('teams/compare', {
        title: 'Team Comparison',
        teams: comparisonData
      });
    } else {
      // Show team selection form
      const allTeams = await Team.getAll();
      
      res.render('teams/compare-select', {
        title: 'Compare Teams',
        teams: allTeams
      });
    }
  } catch (error) {
    console.error('Team comparison error:', error);
    req.flash('error_msg', 'Failed to load team comparison');
    res.redirect('/teams/browse');
  }
};

// Check if player is in a team
export const checkMembership = async (req: Request, res: Response): Promise<void> => {
  try {
    const { playerId } = req.params;
    
    // Direct database query to check team membership
    const query = `
      SELECT t.id, t.name 
      FROM teams t
      JOIN team_members tm ON t.id = tm.team_id
      WHERE tm.player_id = $1
    `;
    
    const result = await pool.query(query, [playerId]);
    
    if (result.rows.length > 0) {
      res.json({ team: result.rows[0] });
    } else {
      res.json({ team: null });
    }
  } catch (error) {
    console.error('Check membership error:', error);
    res.status(500).json({ error: 'Failed to check team membership' });
  }
};