import { Request, Response } from "express";
import { pool } from "../../config/db";
import QueueTicket from "../../models/QueueTicket";

// Display raffle interface
export const getRaffleInterface = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Only allow admin to access this page
    if (
      !(req.session as any).user ||
      (req.session as any).user.role !== "admin"
    ) {
      req.flash("error_msg", "Unauthorized access");
      return res.redirect("/auth/login");
    }

    // Get today's date string (YYYY-MM-DD)
    const todayString = new Date().toISOString().split("T")[0];
    console.log("=== RAFFLE DEBUG ===");
    console.log("Today string:", todayString);

    // Get today's tickets (date-only comparison)
    const ticketsQuery = `
      SELECT 
        MIN(ticket_number) as min_ticket,
        MAX(ticket_number) as max_ticket,
        COUNT(*) as total_tickets
      FROM 
        queue_tickets
      WHERE 
        DATE(created_at) = $1
        AND status = 'played'
    `;
    const ticketsResult = await pool.query(ticketsQuery, [todayString]);
    const ticketRange = ticketsResult.rows[0];

    console.log("Tickets query result:", ticketRange);
    console.log("=== END DEBUG ===");

    // Check for existing raffles today
    const raffleQuery = `
      SELECT * FROM daily_raffles
      WHERE raffle_date = $1
      ORDER BY draw_number DESC
    `;
    const raffleResult = await pool.query(raffleQuery, [todayString]);
    const existingRaffles = raffleResult.rows;
    const latestRaffle = existingRaffles[0];

    // Get all winners for today (date-only comparison)
    let winners = [];
    if (existingRaffles.length > 0) {
      const winnersQuery = `
        SELECT 
          dr.id, dr.draw_number, dr.winning_ticket, dr.drawn_at, dr.notes,
          p.id as player_id, p.name, p.phone, p.email, p.residence, p.gender, p.age_group,
          qt.ticket_number
        FROM 
          daily_raffles dr
        JOIN
          players p ON dr.winner_id = p.id
        JOIN
          queue_tickets qt ON qt.player_id = p.id AND qt.ticket_number = dr.winning_ticket
        WHERE 
          dr.raffle_date = $1
        ORDER BY dr.draw_number DESC
      `;
      const winnersResult = await pool.query(winnersQuery, [todayString]);
      winners = winnersResult.rows;
    }

    res.render("admin/raffle", {
      title: "Daily Raffle",
      ticketRange,
      existingRaffles,
      latestRaffle,
      winners,
      today: todayString,
    });
  } catch (error) {
    console.error("Raffle interface error:", error);
    req.flash(
      "error_msg",
      "An error occurred while loading the raffle interface"
    );
    res.redirect("/admin/dashboard");
  }
};

// Draw raffle winner
export const drawRaffleWinner = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Only allow admin to access this API
    if (
      !(req.session as any).user ||
      (req.session as any).user.role !== "admin"
    ) {
      res.status(401).json({ success: false, message: "Unauthorized access" });
      return;
    }

    const { date } = req.body;

    // Validate input
    if (!date) {
      res.status(400).json({ success: false, message: "Date is required" });
      return;
    }

    // Check existing raffles for this date to get the next draw number
    const existingRafflesQuery = `
      SELECT MAX(draw_number) as max_draw_number FROM daily_raffles
      WHERE raffle_date = $1
    `;

    const existingRafflesResult = await pool.query(existingRafflesQuery, [
      date,
    ]);
    const nextDrawNumber =
      (existingRafflesResult.rows[0].max_draw_number || 0) + 1;

    // Get tickets for the date
    const targetDate = new Date(date);
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const ticketsQuery = `
      SELECT 
        qt.id, qt.ticket_number, qt.player_id,
        p.name, p.phone, p.email, p.residence, p.gender, p.age_group
      FROM 
        queue_tickets qt
      JOIN
        players p ON qt.player_id = p.id
      WHERE 
        qt.created_at >= $1
        AND qt.created_at < $2
        AND qt.status = 'played'
    `;

    const ticketsResult = await pool.query(ticketsQuery, [
      targetDate,
      nextDate,
    ]);
    const eligibleTickets = ticketsResult.rows;

    if (eligibleTickets.length === 0) {
      res
        .status(400)
        .json({ success: false, message: "No eligible tickets for this date" });
      return;
    }

    // Select random winner
    const randomIndex = Math.floor(Math.random() * eligibleTickets.length);
    const winningTicket = eligibleTickets[randomIndex];

    // Record raffle result
    const minTicket = Math.min(...eligibleTickets.map((t) => t.ticket_number));
    const maxTicket = Math.max(...eligibleTickets.map((t) => t.ticket_number));

    const insertResult = await pool.query(
      `INSERT INTO daily_raffles 
       (raffle_date, start_ticket, end_ticket, winning_ticket, winner_id, drawn_at, drawn_by, draw_number)
       VALUES ($1, $2, $3, $4, $5, NOW(), $6, $7)
       RETURNING id`,
      [
        date,
        minTicket,
        maxTicket,
        winningTicket.ticket_number,
        winningTicket.player_id,
        (req.session as any).user.id,
        nextDrawNumber,
      ]
    );

    const raffleId = insertResult.rows[0].id;

    res.json({
      success: true,
      raffleId,
      drawNumber: nextDrawNumber,
      winner: {
        id: winningTicket.player_id,
        name: winningTicket.name,
        phone: winningTicket.phone,
        email: winningTicket.email,
        residence: winningTicket.residence,
        gender: winningTicket.gender,
        age_group: winningTicket.age_group,
        ticket_number: winningTicket.ticket_number,
      },
    });
  } catch (error) {
    console.error("Draw raffle error:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while drawing raffle winner",
    });
  }
};
