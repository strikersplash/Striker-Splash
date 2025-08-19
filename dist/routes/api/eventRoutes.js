"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../../middleware/auth");
const eventRegistrationController_1 = require("../../controllers/player/eventRegistrationController");
const router = express.Router();
// Event registration routes
router.get("/events/upcoming", auth_1.isAuthenticated, auth_1.isPlayer, eventRegistrationController_1.getUpcomingEvents);
router.post("/events/register", auth_1.isAuthenticated, auth_1.isPlayer, eventRegistrationController_1.registerForEvent);
router.get("/events/registrations", auth_1.isAuthenticated, auth_1.isPlayer, eventRegistrationController_1.getPlayerEventRegistrations);
router.delete("/events/registrations/:registrationId", auth_1.isAuthenticated, auth_1.isPlayer, eventRegistrationController_1.cancelEventRegistration);
exports.default = router;
