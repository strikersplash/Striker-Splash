// Quick test script to test raffle draw functionality
const { pool } = require("./dist/config/db");

async function testRaffleDraw() {
  try {
    console.log("🎯 Testing raffle draw functionality...");

    const today = "2025-07-19";

    // Check existing raffles for this date to get the next draw number
    const existingRafflesQuery = `
      SELECT MAX(draw_number) as max_draw_number FROM daily_raffles
      WHERE raffle_date = $1
    `;

    const existingRafflesResult = await pool.query(existingRafflesQuery, [
      today,
    ]);
    const nextDrawNumber =
      (existingRafflesResult.rows[0].max_draw_number || 0) + 1;

    console.log(`📊 Next draw number will be: ${nextDrawNumber}`);

    // Get tickets for the date
    const targetDate = new Date(today);
    const nextDate = new Date(today);
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

    console.log(
      `🎫 Found ${eligibleTickets.length} eligible tickets for ${today}`
    );

    if (eligibleTickets.length === 0) {
      console.log("❌ No eligible tickets found for raffle");
      return;
    }

    // Randomly select a winner
    const randomIndex = Math.floor(Math.random() * eligibleTickets.length);
    const winner = eligibleTickets[randomIndex];

    console.log(
      `🏆 Selected winner: ${winner.name} with ticket #${winner.ticket_number}`
    );

    // Insert raffle result
    const insertRaffleQuery = `
      INSERT INTO daily_raffles (raffle_date, winner_id, winning_ticket, draw_number, drawn_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING *
    `;

    const raffleResult = await pool.query(insertRaffleQuery, [
      today,
      winner.player_id,
      winner.ticket_number,
      nextDrawNumber,
    ]);

    console.log("✅ Raffle draw completed successfully!");
    console.log("📝 Raffle record:", raffleResult.rows[0]);
  } catch (error) {
    console.error("❌ Error during raffle draw test:", error);
  } finally {
    process.exit(0);
  }
}

testRaffleDraw();
