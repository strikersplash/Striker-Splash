// Create a test competition directly
const { pool } = require("./dist/config/db.js");

async function createTestCompetition() {
  try {
    const result = await pool.query(`
      INSERT INTO competitions (name, type, cost, kicks_per_player, status, created_at)
      VALUES ('Test End Button Competition', 'individual', 5.00, 3, 'waiting', NOW())
      RETURNING id, name, status
    `);

    console.log("Created competition:", result.rows[0]);

    // Start it
    const startResult = await pool.query(
      `
      UPDATE competitions 
      SET status = 'active', started_at = NOW()
      WHERE id = $1
      RETURNING id, name, status
    `,
      [result.rows[0].id]
    );

    console.log("Started competition:", startResult.rows[0]);

    pool.end();
  } catch (error) {
    console.error("Error:", error);
    pool.end();
  }
}

createTestCompetition();
