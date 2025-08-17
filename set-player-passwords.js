// Set password "password123" for all raffle participants and future players
const { pool } = require("./dist/config/db");
const bcrypt = require("bcryptjs");

async function setPlayerPasswords() {
  try {
    console.log(
      "🔑 Setting password 'password123' for all raffle participants..."
    );

    // Hash the password
    const password = "password123";
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    console.log(
      `🔒 Password hash generated: ${hashedPassword.substring(0, 20)}...`
    );

    // Get today's date for raffle participants
    const today = new Date();
    const todayStart = new Date(today.setHours(0, 0, 0, 0));
    const todayEnd = new Date(today.setHours(23, 59, 59, 999));

    // First, get all raffle participants
    const participantsQuery = `
      SELECT DISTINCT p.id, p.name, p.phone
      FROM players p
      JOIN queue_tickets qt ON p.id = qt.player_id
      WHERE qt.created_at >= $1
        AND qt.created_at <= $2
        AND qt.status = 'played'
      ORDER BY p.name
    `;

    const participantsResult = await pool.query(participantsQuery, [
      todayStart,
      todayEnd,
    ]);
    const participants = participantsResult.rows;

    console.log(
      `\n👥 Found ${participants.length} raffle participants to update:`
    );

    // Update password for each participant
    let updatedCount = 0;
    for (const participant of participants) {
      const updateQuery = `
        UPDATE players 
        SET password_hash = $1, updated_at = NOW()
        WHERE id = $2
      `;

      await pool.query(updateQuery, [hashedPassword, participant.id]);
      console.log(
        `✅ Updated password for ${participant.name} (${participant.phone})`
      );
      updatedCount++;
    }

    console.log(
      `\n🎯 Successfully updated passwords for ${updatedCount} participants!`
    );

    // Also update the test data generation script to use this password for new players
    console.log(
      "\n📝 Note: You should also update the test data generation script"
    );
    console.log("    to use 'password123' for any new players created.");

    console.log("\n🔓 LOGIN CREDENTIALS:");
    console.log("📱 Username: Phone number (e.g., 501-1234)");
    console.log("🔑 Password: password123");

    console.log("\n✅ All raffle participants can now log in with:");
    participants.forEach((participant, index) => {
      console.log(
        `   ${index + 1}. ${participant.name}: ${
          participant.phone
        } / password123`
      );
    });
  } catch (error) {
    console.error("❌ Error setting passwords:", error);
  } finally {
    process.exit(0);
  }
}

setPlayerPasswords();
