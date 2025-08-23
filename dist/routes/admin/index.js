"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../../middleware/auth");
const dashboardController_1 = require("../../controllers/admin/dashboardController");
const raffleController_1 = require("../../controllers/admin/raffleController");
const ageBracketController_1 = require("../../controllers/admin/ageBracketController");
const ticketController_1 = require("../../controllers/admin/ticketController");
const playerController_1 = require("../../controllers/admin/playerController");
const contentController_1 = require("../../controllers/contentController");
const salesReportsController_1 = require("../../controllers/admin/salesReportsController");
const router = express_1.default.Router();
// Admin dashboard routes
router.get("/dashboard", auth_1.isAdmin, dashboardController_1.getDashboard);
// Staff management routes
router.get("/staff", auth_1.isAdmin, dashboardController_1.getStaffManagement);
router.post("/staff/add", auth_1.isAdmin, dashboardController_1.addStaff);
router.post("/staff/edit/:id", auth_1.isAdmin, dashboardController_1.editStaff);
router.post(
  "/staff/delete/:id",
  auth_1.isAdmin,
  dashboardController_1.deleteStaff
);
// Staff duty routes have been removed
// Player management routes
router.get("/players", auth_1.isStaff, playerController_1.getPlayerManagement);
router.get("/players/:id", auth_1.isStaff, playerController_1.getPlayerDetails);
router.post(
  "/players/update/:id",
  auth_1.isStaff,
  playerController_1.updatePlayer
);
router.post(
  "/players/update-kicks/:id",
  auth_1.isStaff,
  playerController_1.updateKicksBalance
);
router.post(
  "/players/delete/:id",
  auth_1.isStaff,
  playerController_1.deletePlayer
);
router.post(
  "/players/restore/:id",
  auth_1.isStaff,
  playerController_1.restorePlayer
);
// Ticket management routes
router.get("/tickets", auth_1.isAdmin, ticketController_1.getTicketManagement);
router.post(
  "/tickets/update",
  auth_1.isAdmin,
  ticketController_1.updateNextTicket
);
router.post(
  "/tickets/range",
  auth_1.isAdmin,
  ticketController_1.setTicketRange
);
// Age bracket routes
router.get(
  "/age-brackets",
  auth_1.isAdmin,
  ageBracketController_1.getAgeBrackets
);
router.post(
  "/age-brackets",
  auth_1.isAdmin,
  ageBracketController_1.addAgeBracket
);
router.put(
  "/age-brackets/:id",
  auth_1.isAdmin,
  ageBracketController_1.updateAgeBracket
);
router.delete(
  "/age-brackets/:id",
  auth_1.isAdmin,
  ageBracketController_1.deleteAgeBracket
);
// Raffle routes
router.get("/raffle", auth_1.isAdmin, raffleController_1.getRaffleInterface);
router.post(
  "/raffle/draw",
  auth_1.isAdmin,
  raffleController_1.drawRaffleWinner
);
// Event Locations routes
router.get(
  "/event-locations",
  auth_1.isAdmin,
  dashboardController_1.getSettings
);
router.post(
  "/event-locations/location/add",
  auth_1.isAdmin,
  dashboardController_1.addEventLocation
);
router.post(
  "/event-locations/location/delete/:id",
  auth_1.isAdmin,
  dashboardController_1.deleteEventLocation
);
// Content management routes
router.get(
  "/content/:section",
  auth_1.isAdmin,
  contentController_1.getEditableContent
);
router.post(
  "/content/update",
  auth_1.isAdmin,
  contentController_1.updateContent
);
// Sales tracking routes
router.get(
  "/sales-reports",
  auth_1.isAdmin,
  salesReportsController_1.getSalesReports
);
router.get(
  "/api/sales-tracking",
  auth_1.isAdmin,
  salesReportsController_1.getSalesTrackingData
);
router.get(
  "/api/sales-yearly",
  auth_1.isAdmin,
  salesReportsController_1.getYearlySalesData
);
router.get(
  "/api/sales-yearly-download",
  auth_1.isAdmin,
  salesReportsController_1.downloadYearlySalesReport
);
exports.default = router;
