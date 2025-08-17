import express from "express";
import { isStaff } from "../../middleware/auth";
import {
  getRegisteredPlayersForEvent,
  assignTicketsToRegisteredPlayers,
  getEventsWithRegistrations,
} from "../../controllers/staff/eventRegistrationManagementController";

const router = express.Router();

// Routes for event registration management
router.get("/events-with-registrations", isStaff, getEventsWithRegistrations);
router.get(
  "/registered-players/:eventId",
  isStaff,
  getRegisteredPlayersForEvent
);
router.post(
  "/assign-tickets/:eventId",
  isStaff,
  assignTicketsToRegisteredPlayers
);

export default router;
