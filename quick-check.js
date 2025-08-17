// Quick check of current participant goals
const { pool } = require("./dist/config/db.js");

async function quickCheck() {
  try {
    const query = `
      SELECT 
        cp.competition_id,
        p.name,
        cp.goals,
        cp.kicks_taken,
        c.name as competition_name
      FROM competition_players cp
      JOIN players p ON cp.player_id = p.id
      JOIN competitions c ON cp.competition_id = c.id
      WHERE c.status = 'active'
      ORDER BY cp.competition_id, p.name;
    `;

    const result = await pool.query(query);

    console.log("Current participant goals:");
    result.rows.forEach((row) => {
      console.log(
        `Comp ${row.competition_id}: ${row.name} - ${row.goals} goals, ${row.kicks_taken} kicks`
      );
    });

    pool.end();
  } catch (error) {
    console.error("Error:", error);
    pool.end();
  }
}

quickCheck();
