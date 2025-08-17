const { Pool } = require("pg");

const pool = new Pool({
  user: "striker_splash",
  host: "localhost",
  database: "striker_splash",
  password: "striker_splash",
  port: 5432,
});

async function checkRecentTransactions() {
  try {
    console.log("=== CHECKING RECENT TRANSACTIONS ===");

    // Get the most recent transactions and show their actual display times
    const query = `
      SELECT 
        t.id,
        t.created_at,
        t.created_at AT TIME ZONE 'America/Belize' as belize_display_time,
        TO_CHAR(t.created_at AT TIME ZONE 'America/Belize', 'HH12:MI AM') as formatted_time,
        EXTRACT(HOUR FROM t.created_at AT TIME ZONE 'America/Belize') as hour_part,
        EXTRACT(MINUTE FROM t.created_at AT TIME ZONE 'America/Belize') as minute_part,
        p.name as player_name,
        t.kicks,
        t.amount,
        s.name as staff_name
      FROM transactions t
      JOIN players p ON t.player_id = p.id
      LEFT JOIN staff s ON t.staff_id = s.id
      WHERE t.created_at >= NOW() - INTERVAL '2 hours'
      ORDER BY t.created_at DESC
      LIMIT 10
    `;

    const result = await pool.query(query);

    console.log("\nRecent transactions (last 2 hours):");
    console.log("=====================================");

    result.rows.forEach((row) => {
      const hasActualTime = row.minute_part > 0 || row.hour_part !== 12;
      const status = hasActualTime
        ? "✅ HAS ACTUAL TIME"
        : "❌ STILL NOON ONLY";

      console.log(`ID: ${row.id}`);
      console.log(
        `  Time: ${row.formatted_time} (${row.hour_part}:${String(
          row.minute_part
        ).padStart(2, "0")}) ${status}`
      );
      console.log(`  Player: ${row.player_name}`);
      console.log(`  Staff: ${row.staff_name || "N/A"}`);
      console.log(`  Kicks: ${row.kicks}, Amount: $${row.amount}`);
      console.log(`  Raw timestamp: ${row.created_at}`);
      console.log("---");
    });

    // Summary
    const actualTimeCount = result.rows.filter(
      (row) => row.minute_part > 0 || row.hour_part !== 12
    ).length;

    console.log(
      `\nSUMMARY: ${actualTimeCount}/${result.rows.length} transactions have actual times (not just noon)`
    );

    if (actualTimeCount > 0) {
      console.log(
        "🎉 SUCCESS! Transactions are now showing actual sale times!"
      );
    } else {
      console.log(
        "⚠️  Still need to make new transactions to see the fix in action"
      );
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await pool.end();
  }
}

checkRecentTransactions();
