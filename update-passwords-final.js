const { Pool } = require("pg");

// Use the same config as the app
const pool = new Pool({
  user: "striker_splash",
  host: "localhost",
  database: "striker_splash",
  password: "striker_splash",
  port: 5432,
});

async function updatePasswords() {
  try {
    console.log("🔐 Updating player passwords with correct hash...");

    // This is a freshly generated hash for "password123"
    const correctHash =
      "$2a$10$ko/DyRZkXwRrZIKF7bQeUelzXyz9W.8QqjyncudxVRutseHBf8PBi";

    // Update ALL players with the correct hash
    const result = await pool.query(
      "UPDATE players SET password_hash = $1 WHERE password_hash IS NOT NULL OR password_hash = $2",
      [
        correctHash,
        "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi",
      ]
    );

    console.log(`✅ Updated ${result.rowCount} player passwords`);

    // Get today's raffle participants to show their info
    const today = new Date();
    const todayStart = new Date(today.setHours(0, 0, 0, 0));
    const todayEnd = new Date(today.setHours(23, 59, 59, 999));

    const participantsQuery = `
      SELECT DISTINCT p.name, p.phone 
      FROM players p 
      JOIN queue_tickets qt ON p.id = qt.player_id 
      WHERE qt.created_at >= $1 AND qt.created_at <= $2 AND qt.status = 'played'
      ORDER BY p.name
    `;

    const participants = await pool.query(participantsQuery, [
      todayStart,
      todayEnd,
    ]);

    console.log("\n📋 FIXED LOGIN CREDENTIALS:");
    console.log("🔑 Password for ALL players: password123");
    console.log("📱 Use phone number as username\n");

    participants.rows.forEach((player, index) => {
      console.log(`${index + 1}. ${player.name}`);
      console.log(`   Username: ${player.phone}`);
      console.log(`   Password: password123\n`);
    });

    console.log("🎉 All passwords are now fixed! Try logging in again.");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await pool.end();
  }
}

updatePasswords();
