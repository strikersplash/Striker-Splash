#!/usr/bin/env node

const { Pool } = require("pg");

const pool = new Pool({
  user: "striker_splash",
  host: "localhost",
  database: "striker_splash",
  password: "striker_splash",
  port: 5432,
});

async function main() {
  try {
    console.log(
      "🔍 Getting John Doe credentials and creating raffle tickets...\n"
    );

    // 1. Get John Doe accounts
    console.log("📋 Step 1: Finding John Doe accounts...");
    const johnDoeResult = await pool.query(`
      SELECT id, name, phone, email, created_at 
      FROM players 
      WHERE LOWER(name) LIKE '%john%doe%' 
      ORDER BY id
    `);

    if (johnDoeResult.rows.length > 0) {
      console.log(`✅ Found ${johnDoeResult.rows.length} John Doe account(s):`);
      johnDoeResult.rows.forEach((player, index) => {
        console.log(
          `   ${index + 1}. ID: ${player.id}, Name: "${player.name}", Phone: ${
            player.phone
          }`
        );
      });
    } else {
      console.log("❌ No John Doe accounts found");
    }

    // 2. Check today's raffle tickets
    console.log("\n🎫 Step 2: Checking today's raffle tickets...");
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    const ticketResult = await pool.query(
      `
      SELECT COUNT(*) as count 
      FROM raffle_tickets 
      WHERE DATE(draw_date) = $1
    `,
      [todayStr]
    );

    const ticketCount = parseInt(ticketResult.rows[0].count);
    console.log(`Found ${ticketCount} tickets for today (${todayStr})`);

    // 3. Create tickets if needed
    if (ticketCount === 0) {
      console.log("📝 Step 3: Creating raffle tickets for today...");

      // Get all players with phone numbers (eligible for raffle)
      const playersResult = await pool.query(`
        SELECT id, name, phone 
        FROM players 
        WHERE phone IS NOT NULL AND phone != ''
        ORDER BY id
      `);

      console.log(`Found ${playersResult.rows.length} eligible players`);

      // Create tickets for each player
      let ticketsCreated = 0;
      for (const player of playersResult.rows) {
        // Create 1-3 random tickets per player
        const numTickets = Math.floor(Math.random() * 3) + 1;

        for (let i = 0; i < numTickets; i++) {
          await pool.query(
            `
            INSERT INTO raffle_tickets (player_id, draw_date, created_at)
            VALUES ($1, $2, NOW())
          `,
            [player.id, todayStr]
          );
          ticketsCreated++;
        }
      }

      console.log(`✅ Created ${ticketsCreated} raffle tickets for today`);
    } else {
      console.log("✅ Raffle tickets already exist for today");
    }

    // 4. Show login instructions
    if (johnDoeResult.rows.length > 0) {
      console.log("\n🔐 LOGIN CREDENTIALS:");
      console.log("1. Go to: http://localhost:3000/auth/login");
      console.log('2. Click "Player Login" tab');
      console.log(
        '3. Use phone number as username, try "password123" as password\n'
      );

      johnDoeResult.rows.forEach((player, index) => {
        console.log(`Account ${index + 1}:`);
        console.log(`   Name: ${player.name}`);
        console.log(`   Username: ${player.phone}`);
        console.log(`   Password: password123 (default)`);
        console.log("");
      });
    }

    console.log("🎯 Ready for raffle testing!");
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await pool.end();
  }
}

main();
