const { Pool } = require("pg");

const pool = new Pool({
  user: "striker_splash",
  host: "localhost",
  database: "striker_splash",
  password: "striker_splash",
  port: 5432,
});

async function checkTodaysTransactions() {
  try {
    console.log("=== CHECKING TODAY'S TRANSACTIONS ===");

    // Get today's transactions with actual display format
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
      WHERE t.created_at >= timezone('UTC', (NOW() AT TIME ZONE 'America/Belize')::date)
        AND t.created_at < timezone('UTC', (NOW() AT TIME ZONE 'America/Belize')::date + interval '1 day')
      ORDER BY t.created_at DESC
      LIMIT 15
    `;

    const result = await pool.query(query);

    console.log(`\nToday's transactions (${result.rows.length} total):`);
    console.log("=========================================");

    result.rows.forEach((row) => {
      const hasActualTime =
        row.minute_part > 0 || (row.hour_part !== 12 && row.hour_part !== 0);
      const status = hasActualTime ? "✅ ACTUAL TIME" : "❌ NOON ONLY";

      console.log(`ID: ${row.id}`);
      console.log(`  Time: ${row.formatted_time} ${status}`);
      console.log(`  Player: ${row.player_name}`);
      console.log(`  Staff: ${row.staff_name || "N/A"}`);
      console.log(`  Raw timestamp: ${row.created_at}`);
      console.log("---");
    });

    // Summary
    const actualTimeCount = result.rows.filter(
      (row) =>
        row.minute_part > 0 || (row.hour_part !== 12 && row.hour_part !== 0)
    ).length;

    console.log(
      `\nSUMMARY: ${actualTimeCount}/${result.rows.length} transactions have actual times`
    );

    if (actualTimeCount > 0) {
      console.log(
        "🎉 SUCCESS! New transactions are showing actual sale times!"
      );
    } else if (result.rows.length > 0) {
      console.log(
        "⚠️  All transactions still showing noon - may need new transactions after the fix"
      );
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await pool.end();
  }
}

checkTodaysTransactions();
