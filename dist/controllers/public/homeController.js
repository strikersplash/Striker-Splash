"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHome = void 0;
const leaderboardService_1 = require("../../services/leaderboardService");
const db_1 = require("../../config/db");
const contentController_1 = require("../contentController");
// Display home page
const getHome = async (req, res) => {
    try {
        // Get filter parameters
        const ageGroup = req.query.ageGroup || "all";
        const location = req.query.location || "all";
        // Get leaderboard data
        const leaderboard = await (0, leaderboardService_1.getLeaderboard)(ageGroup !== "all" ? ageGroup : undefined, location !== "all" ? location : undefined, 10);
        // Get event locations
        let eventLocations = [];
        try {
            // Manually calculate Belize time (UTC-6)
            const now = new Date();
            const belizeTime = new Date(now.getTime() - 6 * 60 * 60 * 1000); // Subtract 6 hours for UTC-6
            const todayString = belizeTime.toISOString().split("T")[0];
            const locationsQuery = `
        SELECT * FROM event_locations 
        WHERE end_date >= $1 
        ORDER BY start_date ASC
      `;
            const locationsResult = await db_1.pool.query(locationsQuery, [todayString]);
            eventLocations = locationsResult.rows;
        }
        catch (error) {
            console.error("Error fetching event locations:", error);
            // Table might not exist yet, we'll use default locations in the view
        }
        // Get editable content
        const heroContent = await (0, contentController_1.getContentBySection)("home_hero");
        const featuresContent = await (0, contentController_1.getContentBySection)("home_features");
        const stepsContent = await (0, contentController_1.getContentBySection)("home_steps");
        // Render home page
        res.render("public/home", {
            title: "Striker Splash",
            leaderboard,
            eventLocations,
            events: eventLocations, // Adding events alias for eventLocations for template compatibility
            filters: {
                ageGroup,
                location,
            },
            heroContent,
            featuresContent,
            stepsContent,
        });
    }
    catch (error) {
        console.error("Home page error:", error);
        res.render("public/home", {
            title: "Striker Splash",
            leaderboard: [],
            eventLocations: [],
            events: [], // Add empty events array for template compatibility
            filters: {
                ageGroup: "all",
                location: "all",
            },
            heroContent: {},
            featuresContent: {},
            stepsContent: {},
        });
    }
};
exports.getHome = getHome;
