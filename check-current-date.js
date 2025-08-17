const { pool } = require("./dist/config/db");

async function checkCurrentDate() {
  try {
    console.log("Checking current date and time in different timezones...");

    const query = `
      SELECT 
        NOW() as utc_now,
        NOW() AT TIME ZONE 'America/Chicago' as central_now,
        (NOW() AT TIME ZONE 'America/Chicago')::date as central_today,
        EXTRACT(hour FROM NOW() AT TIME ZONE 'America/Chicago') as central_hour,
        (NOW()::date) as utc_today
    `;

    const result = await pool.query(query);
    const data = result.rows[0];

    console.log("Current time information:");
    console.log(`  UTC Now: ${data.utc_now}`);
    console.log(`  Central Now: ${data.central_now}`);
    console.log(`  Central Today (date): ${data.central_today}`);
    console.log(`  Central Hour: ${data.central_hour}`);
    console.log(`  UTC Today (date): ${data.utc_today}`);

    // Check transactions for both days
    const transactionCheck = `
      SELECT 
        (t.created_at AT TIME ZONE 'America/Chicago')::date as transaction_date,
        COUNT(*) as count,
        MIN(t.created_at) as earliest,
        MAX(t.created_at) as latest
      FROM transactions t
      WHERE t.created_at >= NOW() - interval '2 days'
      GROUP BY (t.created_at AT TIME ZONE 'America/Chicago')::date
      ORDER BY transaction_date DESC
    `;

    const transactionResult = await pool.query(transactionCheck);

    console.log("\nRecent transactions by Central Time date:");
    transactionResult.rows.forEach((row) => {
      console.log(
        `  ${row.transaction_date}: ${row.count} transactions (${row.earliest} to ${row.latest})`
      );
    });
  } catch (error) {
    console.error("Error checking current date:", error);
  } finally {
    await pool.end();
  }
}

checkCurrentDate();
