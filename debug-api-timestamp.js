// Quick test to see what the API returns
const { Pool } = require("pg");

const pool = new Pool({
  user: "striker_user",
  host: "localhost",
  database: "striker_splash",
  password: "striker_pass",
  port: 5432,
});

async function testAPIResponse() {
  try {
    const query = `
      SELECT 
        gs.timestamp
      FROM 
        game_stats gs
      WHERE 
        gs.timestamp >= (NOW() AT TIME ZONE 'America/Belize')::date
        AND gs.timestamp < ((NOW() AT TIME ZONE 'America/Belize')::date + interval '1 day')
      ORDER BY 
        gs.timestamp DESC
      LIMIT 1
    `;

    const result = await pool.query(query);
    console.log(
      "API returns timestamp as:",
      typeof result.rows[0]?.timestamp,
      result.rows[0]?.timestamp
    );
    console.log("String format:", result.rows[0]?.timestamp?.toString());
    console.log("ISO format:", result.rows[0]?.timestamp?.toISOString());

    // Test what happens when we create Date object
    if (result.rows[0]?.timestamp) {
      const dateObj = new Date(result.rows[0].timestamp);
      console.log("new Date() creates:", dateObj);
      console.log(
        "With Belize timezone:",
        dateObj.toLocaleTimeString("en-US", {
          timeZone: "America/Belize",
          hour12: true,
          hour: "numeric",
          minute: "2-digit",
        })
      );
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await pool.end();
  }
}

testAPIResponse();
