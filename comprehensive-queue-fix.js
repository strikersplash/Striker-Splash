// Comprehensive queue fix - handles corrupted large ticket numbers
const { Pool } = require("pg");

const pool = new Pool({
  user: "striker_splash",
  host: "localhost",
  database: "striker_splash",
  password: "striker_splash",
  port: 5432,
});

async function comprehensiveQueueFix() {
  try {
    console.log("🔧 Starting comprehensive queue fix...");

    // Step 1: Check all tickets
    const allTicketsResult = await pool.query(`
      SELECT 
        ticket_number, 
        status, 
        player_id,
        created_at
      FROM queue_tickets 
      ORDER BY ticket_number
    `);

    console.log(`📊 Found ${allTicketsResult.rows.length} total tickets`);

    // Show all tickets
    allTicketsResult.rows.forEach((ticket, index) => {
      if (index < 10) {
        // Show first 10
        console.log(
          `   #${ticket.ticket_number} - Player ${ticket.player_id} - ${ticket.status} - ${ticket.created_at}`
        );
      }
    });

    if (allTicketsResult.rows.length > 10) {
      console.log(
        `   ... and ${allTicketsResult.rows.length - 10} more tickets`
      );
    }

    // Step 2: Identify reasonable vs corrupted ticket numbers
    const reasonableTickets = allTicketsResult.rows.filter(
      (t) => t.ticket_number <= 1000
    );
    const corruptedTickets = allTicketsResult.rows.filter(
      (t) => t.ticket_number > 1000
    );

    console.log(`✅ Reasonable tickets (≤1000): ${reasonableTickets.length}`);
    console.log(`❌ Corrupted tickets (>1000): ${corruptedTickets.length}`);

    if (corruptedTickets.length > 0) {
      console.log("🗑️ Cleaning up corrupted tickets...");

      // Delete corrupted tickets that are completed or have invalid numbers
      const deleteResult = await pool.query(`
        DELETE FROM queue_tickets 
        WHERE ticket_number > 1000 
        AND status IN ('completed', 'cancelled')
      `);

      console.log(
        `🗑️ Deleted ${deleteResult.rowCount} corrupted completed tickets`
      );

      // Check if there are still problematic tickets that are active
      const remainingCorruptedResult = await pool.query(`
        SELECT COUNT(*) as count
        FROM queue_tickets 
        WHERE ticket_number > 1000 
        AND status IN ('waiting', 'in_progress')
      `);

      const remainingCorrupted = remainingCorruptedResult.rows[0].count;
      if (remainingCorrupted > 0) {
        console.log(
          `⚠️ Warning: ${remainingCorrupted} active tickets still have corrupted numbers`
        );
        console.log("   You may need to manually review these tickets");
      }
    }

    // Step 3: Get the highest reasonable ticket number
    const maxReasonableResult = await pool.query(`
      SELECT MAX(ticket_number) as max_ticket
      FROM queue_tickets
      WHERE ticket_number <= 1000
    `);

    const maxReasonableTicket = maxReasonableResult.rows[0]?.max_ticket || 0;
    console.log(`🎫 Highest reasonable ticket number: ${maxReasonableTicket}`);

    // Step 4: Set correct next ticket number
    const correctNextTicket = maxReasonableTicket + 1;
    console.log(`🔢 Setting next_queue_number to: ${correctNextTicket}`);

    const updateResult = await pool.query(
      "UPDATE global_counters SET value = $1 WHERE id = 'next_queue_number'",
      [correctNextTicket]
    );

    if (updateResult.rowCount === 0) {
      await pool.query(
        "INSERT INTO global_counters (id, value) VALUES ('next_queue_number', $1)",
        [correctNextTicket]
      );
    }

    // Step 5: Verify current queue status
    const currentQueueResult = await pool.query(`
      SELECT 
        ticket_number, 
        status, 
        p.name as player_name,
        qt.created_at::date as date
      FROM queue_tickets qt
      JOIN players p ON qt.player_id = p.id
      WHERE qt.status IN ('waiting', 'in_progress') 
      AND qt.ticket_number <= 1000
      ORDER BY qt.ticket_number
    `);

    console.log("\n📋 Current Clean Queue Status:");
    if (currentQueueResult.rows.length > 0) {
      currentQueueResult.rows.forEach((ticket) => {
        console.log(
          `   Ticket #${ticket.ticket_number} - ${ticket.player_name} - ${ticket.status} (${ticket.date})`
        );
      });
    } else {
      console.log("   No active tickets in queue");
    }

    // Step 6: Check next counter value
    const finalCounterResult = await pool.query(
      "SELECT value FROM global_counters WHERE id = 'next_queue_number'"
    );
    console.log(
      `\n🔢 Final next_queue_number: ${finalCounterResult.rows[0]?.value}`
    );

    console.log("\n🎉 Comprehensive queue fix completed!");
    console.log(
      "   You can now refresh your cashier interface and admin dashboard."
    );

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error in comprehensive queue fix:", error);
    await pool.end();
    process.exit(1);
  }
}

// Start the fix
comprehensiveQueueFix();
