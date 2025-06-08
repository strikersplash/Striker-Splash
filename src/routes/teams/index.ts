import express from 'express';
import { isAuthenticated } from '../../middleware/auth';
import { 
  createTeam, 
  getCreateTeamForm,
  joinTeam, 
  leaveTeam,
  getTeamDashboard,
  browseTeams,
  getTeamComparison,
  checkMembership
} from '../../controllers/teams/teamController';

const router = express.Router();

// Team routes
router.get('/create', isAuthenticated, getCreateTeamForm);
router.post('/create', isAuthenticated, createTeam);
router.get('/dashboard/:teamId?', isAuthenticated, getTeamDashboard);
router.get('/browse', isAuthenticated, browseTeams);
router.post('/join/:teamId', isAuthenticated, joinTeam);
router.post('/leave', isAuthenticated, leaveTeam);
router.get('/compare', isAuthenticated, getTeamComparison);
router.get('/check-membership/:playerId', checkMembership);

export default router;