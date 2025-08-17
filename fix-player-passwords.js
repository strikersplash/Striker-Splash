// Fix player passwords with correct bcrypt hash for "password123"
const bcrypt = require("bcryptjs");
const { Pool } = require("pg");

// Use the same config as the app
const pool = new Pool({
  user: process.env.DB_USER || "striker_splash",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "striker_splash",
  password: process.env.DB_PASSWORD || "striker_splash",
  port: parseInt(process.env.DB_PORT || "5432"),
});

async function fixPlayerPasswords() {
  try {
    console.log("🔐 Fixing player passwords with correct bcrypt hash...");

    // Generate correct bcrypt hash for "password123"
    const password = "password123";
    const saltRounds = 10;
    const correctHash = await bcrypt.hash(password, saltRounds);

    console.log(`🔑 Password: ${password}`);
    console.log(`🔒 Correct hash: ${correctHash}`);

    // Test the hash to make sure it works
    const testMatch = await bcrypt.compare(password, correctHash);
    console.log(
      `✅ Hash verification test: ${testMatch ? "PASSED" : "FAILED"}`
    );

    if (!testMatch) {
      console.error("❌ Generated hash does not match password!");
      return;
    }

    // Get today's raffle participants
    const today = new Date();
    const todayStart = new Date(today.setHours(0, 0, 0, 0));
    const todayEnd = new Date(today.setHours(23, 59, 59, 999));

    const participantsQuery = `
      SELECT DISTINCT p.id, p.name, p.phone
      FROM players p 
      JOIN queue_tickets qt ON p.id = qt.player_id 
      WHERE qt.created_at >= $1 AND qt.created_at <= $2 AND qt.status = 'played'
      ORDER BY p.name
    `;

    const participants = await pool.query(participantsQuery, [
      todayStart,
      todayEnd,
    ]);
    console.log(
      `\n👥 Found ${participants.rows.length} raffle participants to update:`
    );

    // Update each player's password
    for (const player of participants.rows) {
      const updateQuery = `
        UPDATE players 
        SET password_hash = $1, updated_at = NOW()
        WHERE id = $2
      `;

      await pool.query(updateQuery, [correctHash, player.id]);
      console.log(`✅ Updated password for: ${player.name} (${player.phone})`);
    }

    console.log(
      `\n🎉 Successfully updated passwords for all ${participants.rows.length} players!`
    );
    console.log(`\n📋 LOGIN CREDENTIALS (NOW WORKING):`);
    console.log(`🔑 Password for ALL players: ${password}`);
    console.log(`📱 Login format: Use phone number as username\n`);

    participants.rows.forEach((player, index) => {
      console.log(`${index + 1}. ${player.name}`);
      console.log(`   Username: ${player.phone}`);
      console.log(`   Password: ${password}`);
      console.log("");
    });

    // Test one more time with bcrypt compare
    console.log("🧪 Final verification test:");
    const finalTest = await bcrypt.compare(password, correctHash);
    console.log(`   bcrypt.compare("${password}", hash) = ${finalTest}`);
  } catch (error) {
    console.error("❌ Error fixing passwords:", error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

fixPlayerPasswords();
