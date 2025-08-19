"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAbout = exports.getHome = void 0;
const db_1 = require("../../config/db");
// Display home page
const getHome = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Get recent events
        let events = [];
        try {
            const eventsQuery = `
        SELECT * FROM events
        WHERE event_date >= CURRENT_DATE
        ORDER BY event_date ASC
        LIMIT 3
      `;
            const eventsResult = yield db_1.pool.query(eventsQuery);
            events = eventsResult.rows;
        }
        catch (e) {
            // Create events table if it doesn't exist
            try {
                yield db_1.pool.query(`
          CREATE TABLE IF NOT EXISTS events (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            event_date DATE NOT NULL,
            location VARCHAR(100) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
            }
            catch (tableError) {
                console.error('Error creating events table:', tableError);
            }
        }
        // Render home page
        res.render('public/home', {
            title: 'Home',
            events
        });
    }
    catch (error) {
        console.error('Home page error:', error);
        res.status(500).render('system/error', {
            title: 'Error',
            code: 500,
            message: 'An error occurred while loading the home page'
        });
    }
});
exports.getHome = getHome;
// Display about page
const getAbout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Get upcoming events
        let events = [];
        try {
            const eventsQuery = `
        SELECT * FROM events
        WHERE event_date >= CURRENT_DATE
        ORDER BY event_date ASC
        LIMIT 5
      `;
            const eventsResult = yield db_1.pool.query(eventsQuery);
            events = eventsResult.rows;
        }
        catch (e) {
            // Create events table if it doesn't exist
            try {
                yield db_1.pool.query(`
          CREATE TABLE IF NOT EXISTS events (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            event_date DATE NOT NULL,
            location VARCHAR(100) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
                // Add sample events if table was just created
                yield db_1.pool.query(`
          INSERT INTO events (name, description, event_date, location)
          VALUES 
            ('Striker Splash Tournament', 'Annual football skills competition', CURRENT_DATE + INTERVAL '7 days', 'Belize City Stadium'),
            ('Youth Skills Camp', 'Training camp for young players', CURRENT_DATE + INTERVAL '14 days', 'Orange Walk Town'),
            ('Weekend Challenge', 'Weekend competition with prizes', CURRENT_DATE + INTERVAL '3 days', 'San Pedro')
        `);
                // Get events again
                const newEventsQuery = `
          SELECT * FROM events
          WHERE event_date >= CURRENT_DATE
          ORDER BY event_date ASC
          LIMIT 5
        `;
                const newEventsResult = yield db_1.pool.query(newEventsQuery);
                events = newEventsResult.rows;
            }
            catch (tableError) {
                console.error('Error creating events table:', tableError);
            }
        }
        res.render('public/about', {
            title: 'About Us',
            events
        });
    }
    catch (error) {
        console.error('About page error:', error);
        res.status(500).render('system/error', {
            title: 'Error',
            code: 500,
            message: 'An error occurred while loading the about page'
        });
    }
});
exports.getAbout = getAbout;
