import express from "express";
import { isAdmin, isStaff } from "../../middleware/auth";
import {
  getDashboard,
  getStaffManagement,
  addStaff,
  editStaff,
  deleteStaff,
  getSettings,
  addEventLocation,
  deleteEventLocation,
} from "../../controllers/admin/dashboardController";

import {
  getRaffleInterface,
  drawRaffleWinner,
} from "../../controllers/admin/raffleController";

import {
  getAgeBrackets,
  addAgeBracket,
  updateAgeBracket,
  deleteAgeBracket,
} from "../../controllers/admin/ageBracketController";

import {
  getTicketManagement,
  updateNextTicket,
  setTicketRange,
} from "../../controllers/admin/ticketController";

import {
  getPlayerManagement,
  getPlayerDetails,
  updatePlayer,
  updateKicksBalance,
  deletePlayer,
  restorePlayer,
} from "../../controllers/admin/playerController";

import {
  updateContent,
  getEditableContent,
} from "../../controllers/contentController";

import {
  getSalesReports,
  getSalesTrackingData,
  getYearlySalesData,
  downloadYearlySalesReport,
} from "../../controllers/admin/salesReportsController";

const router = express.Router();

// Test admin login route (for development only)
router.get("/test-login", (req, res) => {
  (req.session as any).user = {
    id: 1,
    role: "admin",
    username: "test_admin",
    name: "Test Administrator",
  };
  res.redirect("/admin/raffle");
});

// Admin dashboard routes
router.get("/dashboard", isAdmin, getDashboard);

// Staff management routes
router.get("/staff", isAdmin, getStaffManagement);
router.post("/staff/add", isAdmin, addStaff);
router.post("/staff/edit/:id", isAdmin, editStaff);
router.post("/staff/delete/:id", isAdmin, deleteStaff);

// Staff duty routes have been removed

// Player management routes
router.get("/players", isStaff, getPlayerManagement);
router.get("/players/:id", isStaff, getPlayerDetails);
router.post("/players/update/:id", isStaff, updatePlayer);
router.post("/players/update-kicks/:id", isStaff, updateKicksBalance);
router.post("/players/delete/:id", isStaff, deletePlayer);
router.post("/players/restore/:id", isStaff, restorePlayer);

// Ticket management routes
router.get("/tickets", isAdmin, getTicketManagement);
router.post("/tickets/update", isAdmin, updateNextTicket);
router.post("/tickets/range", isAdmin, setTicketRange);

// Age bracket routes
router.get("/age-brackets", isAdmin, getAgeBrackets);
router.post("/age-brackets", isAdmin, addAgeBracket);
router.put("/age-brackets/:id", isAdmin, updateAgeBracket);
router.delete("/age-brackets/:id", isAdmin, deleteAgeBracket);

// Raffle routes
router.get("/raffle", isAdmin, getRaffleInterface);
router.post("/raffle/draw", isAdmin, drawRaffleWinner);

// Event Locations routes
router.get("/event-locations", isAdmin, getSettings);
router.post("/event-locations/location/add", isAdmin, addEventLocation);
router.post(
  "/event-locations/location/delete/:id",
  isAdmin,
  deleteEventLocation
);

// Content management routes
router.get("/content/:section", isAdmin, getEditableContent);
router.post("/content/update", isAdmin, updateContent);

// Sales tracking routes
router.get("/sales-reports", isAdmin, getSalesReports);
router.get("/api/sales-tracking", isAdmin, getSalesTrackingData);
router.get("/api/sales-yearly", isAdmin, getYearlySalesData);
router.get("/api/sales-yearly-download", isAdmin, downloadYearlySalesReport);

export default router;
