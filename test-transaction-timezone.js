const { pool } = require("./dist/config/db");

async function testTransactionTimezone() {
  try {
    console.log("Testing transaction creation with Belize timezone...");

    // First, let's compare different timestamp methods
    const compareQuery = `
            SELECT 
                NOW() as utc_now,
                NOW() AT TIME ZONE 'America/Belize' as belize_now,
                (NOW() AT TIME ZONE 'America/Belize')::date as belize_date,
                NOW()::date as utc_date,
                timezone('UTC', (NOW() AT TIME ZONE 'America/Belize')::date) as belize_start_utc
        `;

    const compareResult = await pool.query(compareQuery);
    console.log("Timezone comparison:", compareResult.rows[0]);

    // Test our filtering logic for today's transactions
    const belizeToday = compareResult.rows[0].belize_date;
    console.log("\nFiltering for Belize date:", belizeToday);

    const testQuery = `
            SELECT t.id, t.created_at, t.amount, t.kicks,
                   t.created_at AT TIME ZONE 'America/Belize' as belize_time,
                   (t.created_at AT TIME ZONE 'America/Belize')::date as belize_date
            FROM transactions t
            WHERE t.created_at >= timezone('UTC', $1::date::timestamp)
              AND t.created_at < timezone('UTC', ($1::date + interval '1 day')::timestamp)
            ORDER BY t.created_at DESC
            LIMIT 10
        `;

    const result = await pool.query(testQuery, [belizeToday]);
    console.log("\nToday's transactions (Belize time):");
    result.rows.forEach((row) => {
      console.log(
        `- ID: ${row.id}, Amount: $${row.amount}, Kicks: ${row.kicks}`
      );
      console.log(
        `  UTC: ${row.created_at}, Belize: ${row.belize_time}, Date: ${row.belize_date}`
      );
    });

    // Test what a new transaction creation would look like
    const newTransactionTest = `
            SELECT 
                NOW() AT TIME ZONE 'America/Belize' as new_belize_timestamp,
                (NOW() AT TIME ZONE 'America/Belize')::date as new_belize_date
        `;

    const newResult = await pool.query(newTransactionTest);
    console.log("\nNew transaction would be created with:");
    console.log("- Timestamp:", newResult.rows[0].new_belize_timestamp);
    console.log("- Date:", newResult.rows[0].new_belize_date);

    // Check if this would appear in today's transactions
    console.log(
      "\nWould appear in today's filter?",
      newResult.rows[0].new_belize_date ===
        belizeToday.toISOString().split("T")[0]
    );
  } catch (error) {
    console.error("Error testing transaction timezone:", error);
  } finally {
    process.exit(0);
  }
}

testTransactionTimezone();
