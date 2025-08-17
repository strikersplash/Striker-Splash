const { Pool } = require("pg");

const pool = new Pool({
  user: "striker_splash",
  host: "localhost",
  database: "striker_splash",
  password: "striker_splash",
  port: 5432,
});

async function checkTransaction() {
  try {
    // Check most recent transactions
    const recentQuery = `
      SELECT 
        t.id, 
        t.player_id, 
        t.official_entry, 
        t.created_at,
        t.kicks,
        t.amount
      FROM transactions t 
      ORDER BY t.created_at DESC 
      LIMIT 5
    `;

    const recentResult = await pool.query(recentQuery);
    console.log("Recent transactions:");
    console.log(JSON.stringify(recentResult.rows, null, 2));

    // Check most recent queue tickets
    const ticketQuery = `
      SELECT id, player_id, ticket_number, competition_type, created_at 
      FROM queue_tickets 
      ORDER BY created_at DESC 
      LIMIT 5
    `;

    const ticketResult = await pool.query(ticketQuery);
    console.log("\nRecent tickets:");
    console.log(JSON.stringify(ticketResult.rows, null, 2));

    await pool.end();
  } catch (error) {
    console.error("Error:", error);
  }
}

checkTransaction();
