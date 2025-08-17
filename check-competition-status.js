const { pool } = require("./dist/config/db");

async function checkCompetitionStatus() {
  try {
    console.log("Checking competition 71 status...");

    const compResult = await pool.query(`
      SELECT * FROM competitions WHERE id = 71
    `);

    if (compResult.rows.length > 0) {
      const comp = compResult.rows[0];
      console.log("Competition 71:");
      console.log("- Name:", comp.name);
      console.log("- Status:", comp.status);
      console.log("- Started at:", comp.started_at);
      console.log("- Ended at:", comp.ended_at);
      console.log("- Type:", comp.type);

      if (comp.status === "ended") {
        console.log(
          "\n⚠️  ISSUE: Competition is ENDED - this may prevent goal logging!"
        );
      }
    } else {
      console.log("Competition 71 not found");
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await pool.end();
  }
}

checkCompetitionStatus();
