import express from 'express';
import { isAdmin } from '../../middleware/auth';
import { 
  getDashboard, 
  getStaffManagement,
  addStaff,
  editStaff,
  getReports,
  exportData,
  getSettings,
  addEventLocation,
  deleteEventLocation
} from '../../controllers/admin/dashboardController';

import {
  getRaffleInterface,
  drawRaffleWinner
} from '../../controllers/admin/raffleController';

import {
  getStaffDutyManagement,
  addStaffToDuty,
  removeStaffFromDuty
} from '../../controllers/admin/staffDutyController';

import {
  getAgeBrackets,
  addAgeBracket,
  updateAgeBracket,
  deleteAgeBracket
} from '../../controllers/admin/ageBracketController';

import {
  getTicketManagement,
  updateNextTicket,
  setTicketRange
} from '../../controllers/admin/ticketController';

import {
  getPlayerManagement,
  getPlayerDetails,
  updatePlayer
} from '../../controllers/admin/playerController';

const router = express.Router();

// Admin dashboard routes
router.get('/dashboard', isAdmin, getDashboard);

// Staff management routes
router.get('/staff', isAdmin, getStaffManagement);
router.post('/staff/add', isAdmin, addStaff);
router.post('/staff/edit/:id', isAdmin, editStaff);

// Staff duty routes
router.get('/staff-duty', isAdmin, getStaffDutyManagement);
router.post('/staff-duty/add', isAdmin, addStaffToDuty);
router.delete('/staff-duty/:id', isAdmin, removeStaffFromDuty);

// Player management routes
router.get('/players', isAdmin, getPlayerManagement);
router.get('/players/:id', isAdmin, getPlayerDetails);
router.put('/players/:id', isAdmin, updatePlayer);

// Ticket management routes
router.get('/tickets', isAdmin, getTicketManagement);
router.post('/tickets/update', isAdmin, updateNextTicket);
router.post('/tickets/range', isAdmin, setTicketRange);

// Age bracket routes
router.get('/age-brackets', isAdmin, getAgeBrackets);
router.post('/age-brackets', isAdmin, addAgeBracket);
router.put('/age-brackets/:id', isAdmin, updateAgeBracket);
router.delete('/age-brackets/:id', isAdmin, deleteAgeBracket);

// Raffle routes
router.get('/raffle', isAdmin, getRaffleInterface);
router.post('/raffle/draw', isAdmin, drawRaffleWinner);

// Reports routes
router.get('/reports', isAdmin, getReports);
router.get('/export/:type', isAdmin, exportData);

// Settings routes
router.get('/settings', isAdmin, getSettings);
router.post('/settings/event-locations', isAdmin, addEventLocation);
router.get('/settings/event-locations/:id/delete', isAdmin, deleteEventLocation);

export default router;