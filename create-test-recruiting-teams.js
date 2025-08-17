const { pool } = require("./dist/config/db");

async function createTestTeams() {
  try {
    // Create a team that's open for recruiting
    const openTeam = await pool.query(
      `INSERT INTO teams (name, team_size, description, is_recruiting, is_active, created_at) 
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP) RETURNING *`,
      ["Open Thunder FC", 5, "Anyone can join us!", true, true]
    );
    console.log("Created open team:", openTeam.rows[0].name);

    // Create a team that's invite-only
    const requestTeam = await pool.query(
      `INSERT INTO teams (name, team_size, description, is_recruiting, is_active, created_at) 
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP) RETURNING *`,
      [
        "Elite Squad FC",
        5,
        "Invitation only - high skill level required",
        false,
        true,
      ]
    );
    console.log("Created request-only team:", requestTeam.rows[0].name);

    // Show the different teams
    const allTeams = await pool.query(
      `SELECT name, is_recruiting, team_size, 
              (SELECT COUNT(*) FROM team_members tm WHERE tm.team_id = teams.id) as current_members
       FROM teams 
       ORDER BY name`
    );

    console.log("\nAll teams:");
    console.log("==========");

    allTeams.rows.forEach((team) => {
      const recruitingStatus = team.is_recruiting ? "Open" : "By Request";
      const buttonText = team.is_recruiting ? "Join Team" : "Request to Join";
      const buttonColor = team.is_recruiting ? "Green" : "Orange";

      console.log(`${team.name}:`);
      console.log(`  - Status: ${recruitingStatus}`);
      console.log(`  - Button: "${buttonText}" (${buttonColor})`);
      console.log(`  - Members: ${team.current_members}/${team.team_size}`);
      console.log("");
    });
  } catch (error) {
    console.error("Error:", error);
  }
}

createTestTeams();
