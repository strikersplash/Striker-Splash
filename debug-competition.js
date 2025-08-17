const { Pool } = require("pg");

const pool = new Pool({
  host: "localhost",
  user: "striker_splash",
  password: "striker123",
  database: "striker_splash",
  port: 5432,
});

async function checkCompetition() {
  try {
    console.log("Checking competition 40 details...");

    const result = await pool.query(`
            SELECT id, name, status, started_at, ended_at 
            FROM competitions 
            WHERE id = 40
        `);

    if (result.rows.length > 0) {
      console.log("Competition 40:", result.rows[0]);
    } else {
      console.log("Competition 40 not found");
    }

    console.log("\nChecking all competitions statuses...");
    const allResult = await pool.query(`
            SELECT id, name, status, started_at, ended_at 
            FROM competitions 
            ORDER BY id DESC 
            LIMIT 5
        `);

    allResult.rows.forEach((comp) => {
      console.log(`ID ${comp.id}: ${comp.name} - Status: ${comp.status}`);
    });
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await pool.end();
  }
}

checkCompetition();
