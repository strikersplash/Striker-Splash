"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setTicketRange = exports.updateNextTicket = exports.getTicketManagement = void 0;
const db_1 = require("../../config/db");
// Display ticket management page
const getTicketManagement = async (req, res) => {
    try {
        // Only allow admin to access this page
        if (!req.session.user ||
            req.session.user.role !== "admin") {
            req.flash("error_msg", "Unauthorized access");
            return res.redirect("/auth/login");
        }
        // Get current ticket range
        let ticketRange = {
            min_ticket: 0,
            max_ticket: 0,
            total_tickets: 0,
        };
        try {
            const ticketQuery = `
        SELECT 
          MIN(ticket_number) as min_ticket,
          MAX(ticket_number) as max_ticket,
          COUNT(*) as total_tickets
        FROM 
          queue_tickets
      `;
            const ticketResult = await db_1.pool.query(ticketQuery);
            ticketRange = ticketResult.rows[0];
        }
        catch (e) {
            console.error("Error getting ticket range:", e);
        }
        // Get next ticket number
        let nextTicket = 1000;
        try {
            const nextTicketQuery = `
        SELECT value as next_ticket
        FROM global_counters
        WHERE id = 'next_queue_number'
      `;
            const nextTicketResult = await db_1.pool.query(nextTicketQuery);
            nextTicket = nextTicketResult.rows[0]?.next_ticket || 1000;
        }
        catch (e) {
            console.error("Error getting next ticket number:", e);
            // Create global_counters table if it doesn't exist
            try {
                await db_1.pool.query(`
          CREATE TABLE IF NOT EXISTS global_counters (
            id VARCHAR(50) PRIMARY KEY,
            value INTEGER NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
                // Insert next_queue_number if it doesn't exist
                await db_1.pool.query(`
          INSERT INTO global_counters (id, value)
          VALUES ('next_queue_number', 1000)
          ON CONFLICT (id) DO NOTHING
        `);
            }
            catch (tableError) {
                console.error("Error creating global_counters table:", tableError);
            }
        }
        // Get ticket range settings
        let ticketRangeSettings = null;
        try {
            // Create ticket_ranges table if it doesn't exist
            await db_1.pool.query(`
        CREATE TABLE IF NOT EXISTS ticket_ranges (
          id SERIAL PRIMARY KEY,
          start_ticket INTEGER NOT NULL,
          end_ticket INTEGER NOT NULL,
          created_by INTEGER NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
            const rangeQuery = `
        SELECT * FROM ticket_ranges
        ORDER BY created_at DESC
        LIMIT 1
      `;
            const rangeResult = await db_1.pool.query(rangeQuery);
            ticketRangeSettings = rangeResult.rows[0];
        }
        catch (e) {
            console.error("Error getting ticket range settings:", e);
        }
        res.render("admin/ticket-management", {
            title: "Ticket Management",
            ticketRange,
            nextTicket,
            ticketRangeSettings,
            activePage: "tickets",
        });
    }
    catch (error) {
        console.error("Ticket management error:", error);
        req.flash("error_msg", "An error occurred while loading ticket management");
        res.redirect("/admin/dashboard");
    }
};
exports.getTicketManagement = getTicketManagement;
// Update next ticket number
const updateNextTicket = async (req, res) => {
    try {
        // Only allow admin to access this API
        if (!req.session.user ||
            req.session.user.role !== "admin") {
            res.status(401).json({ success: false, message: "Unauthorized access" });
            return;
        }
        const { nextTicket } = req.body;
        // Validate input
        if (!nextTicket || isNaN(parseInt(nextTicket))) {
            res.status(400).json({
                success: false,
                message: "Valid next ticket number is required",
            });
            return;
        }
        // Create global_counters table if it doesn't exist
        try {
            await db_1.pool.query(`
        CREATE TABLE IF NOT EXISTS global_counters (
          id VARCHAR(50) PRIMARY KEY,
          value INTEGER NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
        }
        catch (e) {
            console.error("Error creating global_counters table:", e);
        }
        // Update next ticket number
        await db_1.pool.query("INSERT INTO global_counters (id, value) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET value = $2", ["next_queue_number", parseInt(nextTicket)]);
        res.json({
            success: true,
            message: "Next ticket number updated successfully",
            nextTicket: parseInt(nextTicket),
        });
    }
    catch (error) {
        console.error("Update next ticket error:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while updating next ticket number",
        });
    }
};
exports.updateNextTicket = updateNextTicket;
// Set ticket range
const setTicketRange = async (req, res) => {
    try {
        // Only allow admin to access this API
        if (!req.session.user ||
            req.session.user.role !== "admin") {
            res.status(401).json({ success: false, message: "Unauthorized access" });
            return;
        }
        const { startTicket, endTicket } = req.body;
        // Validate input
        if (!startTicket ||
            !endTicket ||
            isNaN(parseInt(startTicket)) ||
            isNaN(parseInt(endTicket))) {
            res.status(400).json({
                success: false,
                message: "Valid start and end ticket numbers are required",
            });
            return;
        }
        if (parseInt(startTicket) >= parseInt(endTicket)) {
            res.status(400).json({
                success: false,
                message: "End ticket number must be greater than start ticket number",
            });
            return;
        }
        // Create ticket_ranges table if it doesn't exist
        try {
            await db_1.pool.query(`
        CREATE TABLE IF NOT EXISTS ticket_ranges (
          id SERIAL PRIMARY KEY,
          start_ticket INTEGER NOT NULL,
          end_ticket INTEGER NOT NULL,
          created_by INTEGER NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
        }
        catch (e) {
            console.error("Error creating ticket_ranges table:", e);
        }
        // Insert new ticket range
        await db_1.pool.query("INSERT INTO ticket_ranges (start_ticket, end_ticket, created_by) VALUES ($1, $2, $3)", [parseInt(startTicket), parseInt(endTicket), req.session.user.id]);
        // Update next ticket number properly considering existing tickets
        try {
            const nextTicketQuery = `
        SELECT value as next_ticket
        FROM global_counters
        WHERE id = 'next_queue_number'
      `;
            const nextTicketResult = await db_1.pool.query(nextTicketQuery);
            const currentNextTicket = nextTicketResult.rows[0]?.next_ticket || 0;
            // Get the maximum existing ticket number
            const maxTicketQuery = `
        SELECT MAX(ticket_number) as max_ticket
        FROM queue_tickets
      `;
            const maxTicketResult = await db_1.pool.query(maxTicketQuery);
            const maxExistingTicket = maxTicketResult.rows[0]?.max_ticket || 0;
            // The next ticket number should be the higher of:
            // 1. startTicket (if no existing tickets)
            // 2. maxExistingTicket + 1 (if there are existing tickets with higher numbers)
            let newNextTicket;
            if (maxExistingTicket === 0) {
                // No existing tickets, use startTicket
                newNextTicket = parseInt(startTicket);
            }
            else if (maxExistingTicket >= parseInt(startTicket)) {
                // Existing tickets with higher numbers, continue from max + 1
                newNextTicket = maxExistingTicket + 1;
            }
            else {
                // Existing tickets but all lower than startTicket
                newNextTicket = parseInt(startTicket);
            }
            console.log(`Setting next_queue_number: current=${currentNextTicket}, max_existing=${maxExistingTicket}, start_ticket=${startTicket}, new_next=${newNextTicket}`);
            // Update or insert the counter
            const updateCounterResult = await db_1.pool.query("UPDATE global_counters SET value = $1 WHERE id = $2", [newNextTicket, "next_queue_number"]);
            if (updateCounterResult.rowCount === 0) {
                // If no row was updated, insert the counter
                await db_1.pool.query("INSERT INTO global_counters (id, value) VALUES ($1, $2)", ["next_queue_number", newNextTicket]);
            }
        }
        catch (e) {
            console.error("Error updating next ticket number:", e);
        }
        res.json({
            success: true,
            message: "Ticket range set successfully",
            startTicket: parseInt(startTicket),
            endTicket: parseInt(endTicket),
        });
    }
    catch (error) {
        console.error("Set ticket range error:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while setting ticket range",
        });
    }
};
exports.setTicketRange = setTicketRange;
