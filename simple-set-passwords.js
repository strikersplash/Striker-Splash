// Simple test to set passwords using direct SQL
const { Pool } = require("pg");

// Use the same config as the app
const pool = new Pool({
  user: process.env.DB_USER || "striker_splash",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "striker_splash",
  password: process.env.DB_PASSWORD || "striker_splash",
  port: parseInt(process.env.DB_PORT || "5432"),
});

async function setPasswords() {
  try {
    console.log("🔐 Setting passwords for raffle participants...");

    // Simple bcrypt hash for "password123" (pre-generated)
    const passwordHash =
      "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi"; // bcrypt hash for "password123"

    // Get today's date properly
    const today = new Date();
    const todayStart = new Date(today.setHours(0, 0, 0, 0));
    const todayEnd = new Date(today.setHours(23, 59, 59, 999));

    console.log(
      "📅 Looking for tickets created between:",
      todayStart.toISOString(),
      "and",
      todayEnd.toISOString()
    );

    // First check what players we have for today
    const checkQuery = `
      SELECT DISTINCT p.id, p.name, p.phone, qt.ticket_number, qt.created_at
      FROM players p 
      JOIN queue_tickets qt ON p.id = qt.player_id 
      WHERE qt.created_at >= $1 AND qt.created_at <= $2 AND qt.status = 'played'
      ORDER BY p.name
    `;

    const checkResult = await pool.query(checkQuery, [todayStart, todayEnd]);
    console.log(
      `🎫 Found ${checkResult.rows.length} eligible tickets from players today`
    );

    if (checkResult.rows.length === 0) {
      console.log(
        "❌ No players found for today. Make sure test data was generated for the correct date."
      );
      return;
    }

    // Show what we found
    checkResult.rows.forEach((row) => {
      console.log(
        `   ${row.name} (${row.phone}) - Ticket #${
          row.ticket_number
        } - ${new Date(row.created_at).toLocaleString()}`
      );
    });

    // Now update their passwords
    const playerIds = checkResult.rows.map((row) => row.id);

    const updateQuery = `
      UPDATE players 
      SET password_hash = $1 
      WHERE id = ANY($2::int[])
    `;

    const result = await pool.query(updateQuery, [passwordHash, playerIds]);
    console.log(`✅ Updated ${result.rowCount} player passwords`);

    console.log("\n📋 Login credentials for raffle participants:");
    console.log("🔑 Password for all: password123\n");

    checkResult.rows.forEach((player, index) => {
      console.log(`${index + 1}. ${player.name}`);
      console.log(`   Username: ${player.phone}`);
      console.log(`   Password: password123\n`);
    });
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

setPasswords();
