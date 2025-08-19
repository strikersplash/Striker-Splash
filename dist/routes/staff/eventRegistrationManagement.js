"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const eventRegistrationManagementController_1 = require("../../controllers/staff/eventRegistrationManagementController");
const router = express_1.default.Router();
// Routes for event registration management
router.get("/events-with-registrations", auth_1.isStaff, eventRegistrationManagementController_1.getEventsWithRegistrations);
router.get("/registered-players/:eventId", auth_1.isStaff, eventRegistrationManagementController_1.getRegisteredPlayersForEvent);
router.post("/assign-tickets/:eventId", auth_1.isStaff, eventRegistrationManagementController_1.assignTicketsToRegisteredPlayers);
exports.default = router;
