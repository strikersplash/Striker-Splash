import { Request, Response } from "express";
import { pool } from "../../config/db";
import { getContentBySection } from "../contentController";

// Display about page
export const getAbout = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get upcoming events
    let events = [];
    try {
      // Manually calculate Belize time (UTC-6)
      const now = new Date();
      const belizeTime = new Date(now.getTime() - 6 * 60 * 60 * 1000);
      const today = belizeTime.toISOString().split("T")[0];

      const eventsQuery = `
        SELECT * FROM event_locations 
        WHERE end_date >= $1
        ORDER BY start_date ASC
      `;

      const eventsResult = await pool.query(eventsQuery, [today]);
      events = eventsResult.rows;
    } catch (error) {
      console.error("Error fetching events for about page:", error);
    }

    // Determine if user is logged in for the template
    // We don't set user directly since it's already set by middleware
    const loggedIn = !!res.locals.user;

    // Get editable content
    const aboutContent = await getContentBySection("about_main");

    // Render about page
    res.render("public/about", {
      title: "About Striker Splash",
      events,
      loggedIn,
      aboutContent,
    });
  } catch (error) {
    console.error("About page error:", error);
    res.render("public/about", {
      title: "About Striker Splash",
      events: [],
      loggedIn: false,
      aboutContent: {},
    });
  }
};
