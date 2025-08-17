import express from "express";
import { isAuthenticated, isPlayer } from "../../middleware/auth";
import {
  getUpcomingEvents,
  registerForEvent,
  getPlayerEventRegistrations,
  cancelEventRegistration,
} from "../../controllers/player/eventRegistrationController";

const router = express.Router();

// Event registration routes
router.get("/events/upcoming", isAuthenticated, isPlayer, getUpcomingEvents);
router.post("/events/register", isAuthenticated, isPlayer, registerForEvent);
router.get(
  "/events/registrations",
  isAuthenticated,
  isPlayer,
  getPlayerEventRegistrations
);
router.delete(
  "/events/registrations/:registrationId",
  isAuthenticated,
  isPlayer,
  cancelEventRegistration
);

export default router;
