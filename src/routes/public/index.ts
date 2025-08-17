import express from "express";
import { getHome } from "../../controllers/public/homeController";
import { getAbout } from "../../controllers/public/aboutController";

const router = express.Router();

// Home page
router.get("/", getHome);

// About page
router.get("/about", getAbout);

export default router;
