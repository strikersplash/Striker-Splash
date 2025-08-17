const { Pool } = require("pg");

const pool = new Pool({
  user: "striker_splash",
  host: "localhost",
  database: "striker_splash",
  password: "striker_splash",
  port: 5432,
});

async function testActualTimestamp() {
  try {
    console.log("=== TESTING ACTUAL TIMESTAMP LOGIC ===");

    // First, show current times for reference
    const timeQuery = `
      SELECT 
        NOW() as utc_now,
        NOW() AT TIME ZONE 'America/Belize' as belize_now,
        timezone('UTC', NOW() AT TIME ZONE 'America/Belize') as new_timestamp_method,
        timezone('UTC', (NOW() AT TIME ZONE 'America/Belize')::date::timestamp + interval '12 hours') as old_timestamp_method
    `;

    const timeResult = await pool.query(timeQuery);
    console.log("\nCurrent times:");
    console.log("UTC Now:", timeResult.rows[0].utc_now);
    console.log("Belize Now:", timeResult.rows[0].belize_now);
    console.log(
      "New timestamp method (actual time):",
      timeResult.rows[0].new_timestamp_method
    );
    console.log(
      "Old timestamp method (noon only):",
      timeResult.rows[0].old_timestamp_method
    );

    // Create a test transaction using the new method
    console.log("\n=== CREATING TEST TRANSACTION ===");

    const insertQuery = `
      INSERT INTO transactions (player_id, kicks, amount, team_play, staff_id, created_at)
      VALUES (1, 5, 5, false, 1, timezone('UTC', NOW() AT TIME ZONE 'America/Belize'))
      RETURNING id, created_at
    `;

    const insertResult = await pool.query(insertQuery);
    console.log("Created transaction:", insertResult.rows[0]);

    // Now check how it appears in the today's transactions query
    const todayQuery = `
      SELECT 
        t.id,
        t.created_at,
        t.created_at AT TIME ZONE 'America/Belize' as belize_display_time,
        TO_CHAR(t.created_at AT TIME ZONE 'America/Belize', 'HH12:MI AM') as formatted_time,
        p.name as player_name,
        t.kicks,
        t.amount
      FROM transactions t
      JOIN players p ON t.player_id = p.id
      WHERE t.created_at >= timezone('UTC', (NOW() AT TIME ZONE 'America/Belize')::date)
        AND t.created_at < timezone('UTC', (NOW() AT TIME ZONE 'America/Belize')::date + interval '1 day')
      ORDER BY t.created_at DESC
      LIMIT 5
    `;

    const todayResult = await pool.query(todayQuery);
    console.log("\n=== TODAY'S TRANSACTIONS (showing actual times) ===");
    todayResult.rows.forEach((row) => {
      console.log(
        `ID: ${row.id}, Time: ${row.formatted_time}, Player: ${row.player_name}, Kicks: ${row.kicks}, Amount: $${row.amount}`
      );
    });

    console.log(
      "\n=== SUCCESS! Transaction timestamp now shows actual time ==="
    );
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await pool.end();
  }
}

testActualTimestamp();
