// Test the multiple raffle draws functionality
const { pool } = require("./dist/config/db");

async function testMultipleRaffleDraws() {
  try {
    console.log("🧪 Testing multiple raffle draws functionality...");

    // Check table structure
    const tableQuery = `
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'daily_raffles' 
      ORDER BY ordinal_position;
    `;

    const tableResult = await pool.query(tableQuery);
    console.log("\n📋 Daily Raffles Table Structure:");
    tableResult.rows.forEach((col) => {
      console.log(
        `- ${col.column_name}: ${col.data_type} ${
          col.is_nullable === "NO" ? "(NOT NULL)" : "(NULLABLE)"
        } ${col.column_default ? `DEFAULT ${col.column_default}` : ""}`
      );
    });

    // Check constraints
    const constraintQuery = `
      SELECT constraint_name, constraint_type 
      FROM information_schema.table_constraints 
      WHERE table_name = 'daily_raffles';
    `;

    const constraintResult = await pool.query(constraintQuery);
    console.log("\n🔐 Table Constraints:");
    constraintResult.rows.forEach((constraint) => {
      console.log(
        `- ${constraint.constraint_name}: ${constraint.constraint_type}`
      );
    });

    // Check existing raffles
    const existingQuery = `
      SELECT id, raffle_date, draw_number, winning_ticket, drawn_at 
      FROM daily_raffles 
      ORDER BY raffle_date DESC, draw_number DESC 
      LIMIT 10;
    `;

    const existingResult = await pool.query(existingQuery);
    console.log("\n🏆 Recent Raffles:");
    if (existingResult.rows.length > 0) {
      existingResult.rows.forEach((raffle) => {
        console.log(
          `- ${raffle.raffle_date} Draw #${raffle.draw_number}: Ticket ${
            raffle.winning_ticket || "Not drawn"
          } at ${
            raffle.drawn_at ? new Date(raffle.drawn_at).toLocaleString() : "N/A"
          }`
        );
      });
    } else {
      console.log("- No raffles found");
    }

    // Test today's eligible tickets
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextDay = new Date(today);
    nextDay.setDate(nextDay.getDate() + 1);

    const ticketsQuery = `
      SELECT COUNT(*) as total_tickets
      FROM queue_tickets 
      WHERE created_at >= $1 
        AND created_at < $2 
        AND status = 'played';
    `;

    const ticketsResult = await pool.query(ticketsQuery, [today, nextDay]);
    console.log(
      `\n🎫 Today's Eligible Tickets: ${ticketsResult.rows[0].total_tickets}`
    );

    console.log("\n✅ Multiple raffle draws test completed successfully!");
  } catch (error) {
    console.error("❌ Error testing multiple raffle draws:", error);
  } finally {
    process.exit(0);
  }
}

testMultipleRaffleDraws();
