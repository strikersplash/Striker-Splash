// Get login info for all raffle participants
const { pool } = require("./dist/config/db");

async function getRaffleParticipantLogins() {
  try {
    console.log("🔐 Getting login info for raffle participants...");

    // Get today's date
    const today = new Date();
    const todayStart = new Date(today.setHours(0, 0, 0, 0));
    const todayEnd = new Date(today.setHours(23, 59, 59, 999));

    // Get all players who have tickets for today's raffle
    const participantsQuery = `
      SELECT DISTINCT
        p.id,
        p.name,
        p.phone,
        p.password_hash,
        p.email,
        p.residence,
        p.age_group,
        p.gender,
        COUNT(qt.id) as ticket_count,
        MIN(qt.ticket_number) as first_ticket,
        MAX(qt.ticket_number) as last_ticket
      FROM 
        players p
      JOIN
        queue_tickets qt ON p.id = qt.player_id
      WHERE 
        qt.created_at >= $1
        AND qt.created_at <= $2
        AND qt.status = 'played'
      GROUP BY p.id, p.name, p.phone, p.password_hash, p.email, p.residence, p.age_group, p.gender
      ORDER BY p.name
    `;

    const result = await pool.query(participantsQuery, [todayStart, todayEnd]);
    const participants = result.rows;

    console.log(
      `\n📋 Found ${participants.length} participants in today's raffle:\n`
    );

    participants.forEach((participant, index) => {
      console.log(`${index + 1}. ${participant.name}`);
      console.log(`   📱 Phone: ${participant.phone}`);
      console.log(
        `   🔑 Password: ${
          participant.password_hash ? "Has password set" : "NO PASSWORD SET"
        }`
      );
      console.log(`   📧 Email: ${participant.email || "Not provided"}`);
      console.log(`   📍 Location: ${participant.residence}`);
      console.log(`   👥 Age Group: ${participant.age_group}`);
      console.log(
        `   🎫 Tickets: ${participant.ticket_count} (${
          participant.first_ticket === participant.last_ticket
            ? "#" + participant.first_ticket
            : "#" + participant.first_ticket + " - #" + participant.last_ticket
        })`
      );
      console.log("");
    });

    console.log("🔓 LOGIN INSTRUCTIONS:");
    console.log("📱 Users can log in using their PHONE NUMBER as username");
    console.log("🔑 Most test accounts may not have passwords set");
    console.log(
      "💡 For testing, you may need to set passwords or use phone-only login"
    );

    // Check if there are any players with actual passwords
    const playersWithPasswords = participants.filter((p) => p.password_hash);
    if (playersWithPasswords.length > 0) {
      console.log(
        `\n✅ ${playersWithPasswords.length} players have passwords set:`
      );
      playersWithPasswords.forEach((p) => {
        console.log(`   ${p.name} (${p.phone}) - Has password`);
      });
    } else {
      console.log(
        "\n⚠️  No players have passwords set - they may use passwordless login or default passwords"
      );
    }
  } catch (error) {
    console.error("❌ Error getting participant login info:", error);
  } finally {
    process.exit(0);
  }
}

getRaffleParticipantLogins();
