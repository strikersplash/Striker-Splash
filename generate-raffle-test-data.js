// Generate test data for daily raffle - 10 players with played tickets for today
const { pool } = require("./dist/config/db");

async function generateTestRaffleData() {
  try {
    console.log("🎫 Generating test data for daily raffle...");

    // Get today's date
    const today = new Date();
    const todayStart = new Date(today.setHours(0, 0, 0, 0));
    const todayEnd = new Date(today.setHours(23, 59, 59, 999));

    console.log(`📅 Creating tickets for: ${todayStart.toDateString()}`);

    // First, check if we already have tickets for today
    const existingTicketsQuery = `
      SELECT COUNT(*) as count 
      FROM queue_tickets 
      WHERE created_at >= $1 AND created_at <= $2 AND status = 'played'
    `;

    const existingResult = await pool.query(existingTicketsQuery, [
      todayStart,
      todayEnd,
    ]);
    const existingCount = parseInt(existingResult.rows[0].count);

    if (existingCount >= 10) {
      console.log(
        `✅ Already have ${existingCount} played tickets for today - ready for raffle testing!`
      );

      // Show the tickets
      const ticketsQuery = `
        SELECT qt.id, qt.ticket_number, p.name, qt.created_at
        FROM queue_tickets qt
        JOIN players p ON qt.player_id = p.id
        WHERE qt.created_at >= $1 AND qt.created_at <= $2 AND qt.status = 'played'
        ORDER BY qt.ticket_number
        LIMIT 15
      `;

      const ticketsResult = await pool.query(ticketsQuery, [
        todayStart,
        todayEnd,
      ]);
      console.log("\n🎟️ Today's Eligible Tickets:");
      ticketsResult.rows.forEach((ticket) => {
        console.log(
          `  Ticket #${ticket.ticket_number}: ${ticket.name} (${new Date(
            ticket.created_at
          ).toLocaleTimeString()})`
        );
      });

      return;
    }

    // Sample player data
    const testPlayers = [
      {
        name: "John Doe",
        phone: "501-1234",
        residence: "Belize City",
        age_group: "Adults 31-50 years",
        gender: "male",
        dob: "1985-03-15",
      },
      {
        name: "Maria Lopez",
        phone: "501-2345",
        residence: "San Pedro",
        age_group: "Young Adults 18-30 years",
        gender: "female",
        dob: "1995-07-22",
      },
      {
        name: "Carlos Hernandez",
        phone: "501-3456",
        residence: "Orange Walk",
        age_group: "Adults 31-50 years",
        gender: "male",
        dob: "1980-11-08",
      },
      {
        name: "Sarah Johnson",
        phone: "501-4567",
        residence: "Belize City",
        age_group: "Young Adults 18-30 years",
        gender: "female",
        dob: "1998-01-12",
      },
      {
        name: "Miguel Santos",
        phone: "501-5678",
        residence: "Caye Caulker",
        age_group: "Seniors 51+ years",
        gender: "male",
        dob: "1965-09-30",
      },
      {
        name: "Ana Rodriguez",
        phone: "501-6789",
        residence: "Belize City",
        age_group: "Teens 11-17 years",
        gender: "female",
        dob: "2010-04-18",
      },
      {
        name: "David Chen",
        phone: "501-7890",
        residence: "San Ignacio",
        age_group: "Adults 31-50 years",
        gender: "male",
        dob: "1982-12-05",
      },
      {
        name: "Lisa Williams",
        phone: "501-8901",
        residence: "Placencia",
        age_group: "Young Adults 18-30 years",
        gender: "female",
        dob: "1996-06-14",
      },
      {
        name: "Roberto Garcia",
        phone: "501-9012",
        residence: "Dangriga",
        age_group: "Adults 31-50 years",
        gender: "male",
        dob: "1978-02-28",
      },
      {
        name: "Emma Thompson",
        phone: "501-0123",
        residence: "Belize City",
        age_group: "Young Adults 18-30 years",
        gender: "female",
        dob: "1999-10-03",
      },
    ];

    let playersCreated = 0;
    let ticketsCreated = 0;

    for (const playerData of testPlayers) {
      // Check if player already exists
      const existingPlayerQuery = `
        SELECT id FROM players WHERE phone = $1
      `;

      const existingPlayerResult = await pool.query(existingPlayerQuery, [
        playerData.phone,
      ]);
      let playerId;

      if (existingPlayerResult.rows.length > 0) {
        playerId = existingPlayerResult.rows[0].id;
        console.log(`👤 Using existing player: ${playerData.name}`);
      } else {
        // Create new player with password
        const qrHash = `QR_RAFFLE_${playerData.name
          .replace(/\s+/g, "_")
          .toUpperCase()}_${Date.now()}`;

        // Default password hash for "password123" (CORRECT HASH)
        const passwordHash =
          "$2a$10$ko/DyRZkXwRrZIKF7bQeUelzXyz9W.8QqjyncudxVRutseHBf8PBi";

        const createPlayerQuery = `
          INSERT INTO players (name, phone, residence, age_group, gender, dob, qr_hash, password_hash, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
          RETURNING id
        `;

        const playerResult = await pool.query(createPlayerQuery, [
          playerData.name,
          playerData.phone,
          playerData.residence,
          playerData.age_group,
          playerData.gender,
          playerData.dob,
          qrHash,
          passwordHash,
        ]);

        playerId = playerResult.rows[0].id;
        playersCreated++;
        console.log(
          `👤 Created player: ${playerData.name} (ID: ${playerId}) with password: password123`
        );
      }

      // Create a played ticket for today
      // First get the next ticket number
      const ticketNumberResult = await pool.query(
        "UPDATE global_counters SET value = value + 1 WHERE id = $1 RETURNING value",
        ["next_queue_number"]
      );
      const ticketNumber = ticketNumberResult.rows[0].value;

      const createTicketQuery = `
        INSERT INTO queue_tickets (ticket_number, player_id, status, created_at)
        VALUES ($1, $2, 'played', $3)
        RETURNING id, ticket_number
      `;

      // Random time during today
      const randomHour = Math.floor(Math.random() * 12) + 8; // Between 8 AM and 8 PM
      const randomMinute = Math.floor(Math.random() * 60);
      const ticketTime = new Date(todayStart);
      ticketTime.setHours(randomHour, randomMinute, 0, 0);

      const ticketResult = await pool.query(createTicketQuery, [
        ticketNumber,
        playerId,
        ticketTime,
      ]);
      const ticketInfo = ticketResult.rows[0];

      ticketsCreated++;
      console.log(
        `🎫 Created ticket #${ticketInfo.ticket_number} for ${
          playerData.name
        } at ${ticketTime.toLocaleTimeString()}`
      );
    }

    console.log(`\n✅ Test data generation complete!`);
    console.log(`👥 Players created: ${playersCreated}`);
    console.log(`🎫 Tickets created: ${ticketsCreated}`);

    // Show final ticket range
    const rangeQuery = `
      SELECT 
        MIN(ticket_number) as min_ticket,
        MAX(ticket_number) as max_ticket,
        COUNT(*) as total_tickets
      FROM queue_tickets 
      WHERE created_at >= $1 AND created_at <= $2 AND status = 'played'
    `;

    const rangeResult = await pool.query(rangeQuery, [todayStart, todayEnd]);
    const range = rangeResult.rows[0];

    console.log(`\n🎯 Ready for raffle testing:`);
    console.log(`   Ticket Range: ${range.min_ticket} - ${range.max_ticket}`);
    console.log(`   Total Eligible: ${range.total_tickets} tickets`);
    console.log(
      `\n🎲 You can now test the daily raffle at: http://localhost:3000/admin/raffle`
    );
  } catch (error) {
    console.error("❌ Error generating test data:", error);
  } finally {
    process.exit(0);
  }
}

generateTestRaffleData();
