// Set password "password123" for all raffle participants
const { pool } = require("./dist/config/db");
const bcrypt = require("bcryptjs");

async function setRaffleParticipantPasswords() {
  try {
    console.log("🔐 Setting passwords for raffle participants...");

    // Hash the password
    const password = "password123";
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    console.log(`🔑 Password to set: ${password}`);
    console.log(`🔒 Hashed password: ${hashedPassword.substring(0, 20)}...`);

    // Get today's date
    const today = new Date();
    const todayStart = new Date(today.setHours(0, 0, 0, 0));
    const todayEnd = new Date(today.setHours(23, 59, 59, 999));

    // Get all players who have tickets for today's raffle
    const participantsQuery = `
      SELECT DISTINCT p.id, p.name, p.phone
      FROM players p
      JOIN queue_tickets qt ON p.id = qt.player_id
      WHERE qt.created_at >= $1
        AND qt.created_at <= $2
        AND qt.status = 'played'
      ORDER BY p.name
    `;

    const result = await pool.query(participantsQuery, [todayStart, todayEnd]);
    const participants = result.rows;

    console.log(`\n📋 Found ${participants.length} participants to update:\n`);

    // Update password for each participant
    for (const participant of participants) {
      const updateQuery = `
        UPDATE players 
        SET password_hash = $1, updated_at = NOW()
        WHERE id = $2
      `;

      await pool.query(updateQuery, [hashedPassword, participant.id]);

      console.log(
        `✅ Updated password for: ${participant.name} (${participant.phone})`
      );
    }

    console.log(
      `\n🎉 Successfully set passwords for all ${participants.length} raffle participants!`
    );
    console.log(`\n🔓 LOGIN CREDENTIALS:`);
    console.log(`📱 Username: [Phone Number]`);
    console.log(`🔑 Password: ${password}`);
    console.log(`\n📋 PARTICIPANT LOGIN LIST:`);

    participants.forEach((participant, index) => {
      console.log(`${index + 1}. ${participant.name}`);
      console.log(`   Username: ${participant.phone}`);
      console.log(`   Password: ${password}`);
      console.log("");
    });
  } catch (error) {
    console.error("❌ Error setting passwords:", error);
  } finally {
    process.exit(0);
  }
}

setRaffleParticipantPasswords();
