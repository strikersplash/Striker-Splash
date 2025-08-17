const { pool } = require("./dist/config/db");

async function debugStaffTransactionIssue() {
  try {
    console.log("=== DEBUGGING STAFF TRANSACTION ISSUE (Transaction 2930) ===");

    // Check the exact transaction that was just created
    const checkTransaction = `
      SELECT 
        t.id,
        t.created_at,
        t.created_at AT TIME ZONE 'America/Chicago' as central_time,
        (t.created_at AT TIME ZONE 'America/Chicago')::date as central_date,
        t.staff_id,
        t.player_id,
        t.amount,
        s.name as staff_name,
        p.name as player_name
      FROM transactions t
      JOIN staff s ON t.staff_id = s.id
      JOIN players p ON t.player_id = p.id
      WHERE t.id = 2930
    `;

    const transactionResult = await pool.query(checkTransaction);
    if (transactionResult.rows.length === 0) {
      console.log("❌ Transaction 2930 not found!");
      return;
    }

    const transaction = transactionResult.rows[0];
    console.log("Transaction 2930 details:");
    console.log(
      `  Staff: ${transaction.staff_name} (ID: ${transaction.staff_id})`
    );
    console.log(
      `  Player: ${transaction.player_name} (ID: ${transaction.player_id})`
    );
    console.log(`  Amount: $${transaction.amount}`);
    console.log(`  UTC Time: ${transaction.created_at}`);
    console.log(`  Central Time: ${transaction.central_time}`);
    console.log(`  Central Date: ${transaction.central_date}`);

    // Now check what today's date calculation gives us
    console.log("\n=== CHECKING TODAY CALCULATION ===");
    const centralTimeQuery = `SELECT (NOW() AT TIME ZONE 'America/Chicago')::date as today`;
    const centralTimeResult = await pool.query(centralTimeQuery);
    const today = centralTimeResult.rows[0].today.toISOString().split("T")[0];
    console.log(`Calculated today: ${today}`);
    console.log(
      `Transaction central date: ${
        transaction.central_date.toISOString().split("T")[0]
      }`
    );
    console.log(
      `Dates match: ${
        today === transaction.central_date.toISOString().split("T")[0]
      }`
    );

    // Test the UTC range conversion
    console.log("\n=== TESTING UTC RANGE CONVERSION ===");
    const rangeQuery = `
      SELECT 
        timezone('UTC', ($1::date)::timestamp) as range_start,
        timezone('UTC', ($1::date + interval '1 day')::timestamp) as range_end,
        $2::timestamp as transaction_utc,
        CASE 
          WHEN $2::timestamp >= timezone('UTC', ($1::date)::timestamp) 
               AND $2::timestamp < timezone('UTC', ($1::date + interval '1 day')::timestamp)
          THEN 'IN RANGE'
          ELSE 'OUT OF RANGE'
        END as filter_result
    `;

    const rangeResult = await pool.query(rangeQuery, [
      today,
      transaction.created_at,
    ]);
    const range = rangeResult.rows[0];

    console.log(`Range Start (UTC): ${range.range_start}`);
    console.log(`Range End (UTC): ${range.range_end}`);
    console.log(`Transaction UTC: ${range.transaction_utc}`);
    console.log(`Filter Result: ${range.filter_result}`);

    // Test the exact getTodaysTransactions query
    console.log("\n=== TESTING EXACT getTodaysTransactions QUERY ===");
    const exactQuery = `
      SELECT 
        t.id,
        t.created_at as timestamp,
        p.name as player_name,
        CASE 
          WHEN t.kicks < 0 THEN 'requeue'
          ELSE 'sale'
        END as transaction_type,
        t.kicks as kicks_count,
        t.amount,
        COALESCE(s.name, s.username, 'Staff') as staff_name
      FROM transactions t
      JOIN players p ON t.player_id = p.id
      LEFT JOIN staff s ON t.staff_id = s.id
      WHERE t.staff_id = $2
        AND t.created_at >= timezone('UTC', ($1::date)::timestamp)
        AND t.created_at < timezone('UTC', ($1::date + interval '1 day')::timestamp)
      ORDER BY t.created_at DESC
      LIMIT 200
    `;

    const exactResult = await pool.query(exactQuery, [
      today,
      transaction.staff_id,
    ]);
    console.log(
      `Exact query found ${exactResult.rows.length} transactions for staff ${transaction.staff_id}`
    );

    if (exactResult.rows.length > 0) {
      console.log("Found transactions:");
      exactResult.rows.forEach((row, index) => {
        const isTarget = row.id === 2930;
        console.log(
          `  ${index + 1}. ID ${row.id}: ${row.player_name} - $${
            row.amount
          } at ${row.timestamp}${isTarget ? " ← TARGET" : ""}`
        );
      });
    }

    // Also test what the "all today's transactions" query returns
    console.log('\n=== TESTING "ALL TODAY\'S TRANSACTIONS" QUERY ===');
    const allTodayQuery = `
      SELECT t.id, t.staff_id, t.player_id, t.kicks, t.amount, 
             p.name as player_name, s.name as staff_name, s.role as staff_role 
      FROM transactions t 
      LEFT JOIN players p ON t.player_id = p.id 
      LEFT JOIN staff s ON t.staff_id = s.id 
      WHERE t.created_at >= timezone('UTC', ($1::date)::timestamp)
        AND t.created_at < timezone('UTC', ($1::date + interval '1 day')::timestamp)
      ORDER BY t.created_at DESC
    `;

    const allTodayResult = await pool.query(allTodayQuery, [today]);
    console.log(
      `All today query found ${allTodayResult.rows.length} transactions`
    );

    const targetInAll = allTodayResult.rows.find((row) => row.id === 2930);
    console.log(
      `Transaction 2930 in "all today" results: ${targetInAll ? "YES" : "NO"}`
    );

    if (targetInAll) {
      console.log(
        `  Staff ID in all results: ${
          targetInAll.staff_id
        } (${typeof targetInAll.staff_id})`
      );
      console.log(
        `  Query parameter staff ID: ${
          transaction.staff_id
        } (${typeof transaction.staff_id})`
      );
      console.log(
        `  Staff IDs match: ${targetInAll.staff_id === transaction.staff_id}`
      );
    }
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await pool.end();
  }
}

debugStaffTransactionIssue();
