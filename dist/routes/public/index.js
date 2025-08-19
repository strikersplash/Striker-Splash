"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const homeController_1 = require("../../controllers/public/homeController");
const aboutController_1 = require("../../controllers/public/aboutController");
const router = express_1.default.Router();
// Home page
router.get("/", homeController_1.getHome);
// About page
router.get("/about", aboutController_1.getAbout);
exports.default = router;
