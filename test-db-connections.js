const { Pool } = require("pg");

// Try different connection approaches
async function testConnections() {
  console.log("🔍 Testing different database connections...\n");

  // Connection 1: Same as our debug scripts
  console.log("1. Testing our debug script connection...");
  const pool1 = new Pool({
    user: "striker_splash",
    host: "localhost",
    database: "striker_splash",
    password: "striker_splash",
    port: 5432,
  });

  try {
    const result1 = await pool1.query(
      "SELECT MAX(id) as max_id, COUNT(*) as total FROM transactions"
    );
    console.log(
      "   ✅ Debug connection: Max ID =",
      result1.rows[0].max_id,
      ", Total =",
      result1.rows[0].total
    );
  } catch (error) {
    console.log("   ❌ Debug connection failed:", error.message);
  }
  await pool1.end();

  // Connection 2: Try with environment variables (same as server might use)
  console.log("\n2. Testing with environment variables...");
  const pool2 = new Pool({
    user: process.env.DB_USER || "striker_splash",
    host: process.env.DB_HOST || "localhost",
    database: process.env.DB_NAME || "striker_splash",
    password: process.env.DB_PASSWORD || "striker_splash",
    port: parseInt(process.env.DB_PORT || "5432"),
    ssl: process.env.DB_HOST?.includes("supabase.com")
      ? { rejectUnauthorized: false }
      : false,
  });

  try {
    const result2 = await pool2.query(
      "SELECT MAX(id) as max_id, COUNT(*) as total FROM transactions"
    );
    console.log(
      "   ✅ Env connection: Max ID =",
      result2.rows[0].max_id,
      ", Total =",
      result2.rows[0].total
    );

    // Get the latest few transactions
    const latestQuery = `
            SELECT id, created_at, amount, staff_id,
                   (created_at AT TIME ZONE 'America/Belize')::date as belize_date
            FROM transactions
            ORDER BY id DESC
            LIMIT 5
        `;
    const latestResult = await pool2.query(latestQuery);

    console.log("\n   📊 Latest 5 transactions:");
    latestResult.rows.forEach((row) => {
      console.log(
        `      ID ${row.id}: $${row.amount}, Staff ${row.staff_id}, Date: ${
          row.belize_date.toISOString().split("T")[0]
        }`
      );
    });
  } catch (error) {
    console.log("   ❌ Env connection failed:", error.message);
  }
  await pool2.end();

  // Connection 3: Try with different database names
  console.log("\n3. Testing alternative database name...");
  const pool3 = new Pool({
    user: process.env.DB_USER || "postgres",
    host: process.env.DB_HOST || "localhost",
    database: process.env.DB_NAME || "striker_splash_db",
    password: process.env.DB_PASSWORD || "postgres",
    port: parseInt(process.env.DB_PORT || "5432"),
  });

  try {
    const result3 = await pool3.query(
      "SELECT MAX(id) as max_id, COUNT(*) as total FROM transactions"
    );
    console.log(
      "   ✅ Alt connection: Max ID =",
      result3.rows[0].max_id,
      ", Total =",
      result3.rows[0].total
    );
  } catch (error) {
    console.log("   ❌ Alt connection failed:", error.message);
  }
  await pool3.end();
}

testConnections();
