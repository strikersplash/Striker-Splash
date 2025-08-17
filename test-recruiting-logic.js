const { pool } = require("./dist/config/db");

async function testTeamsWithRecruiting() {
  try {
    // Get all teams to see the is_recruiting values
    const result = await pool.query(
      `SELECT id, name, is_recruiting, team_size, 
              (SELECT COUNT(*) FROM team_members tm WHERE tm.team_id = teams.id) as current_members
       FROM teams 
       ORDER BY name`
    );

    console.log("Teams and their recruitment status:");
    console.log("=====================================");

    result.rows.forEach((team) => {
      const status = team.is_recruiting
        ? "OPEN (Join immediately)"
        : "BY REQUEST (Approval needed)";
      const capacity = `${team.current_members}/${team.team_size}`;
      console.log(`${team.name}: ${status} - Members: ${capacity}`);
    });

    // Show how the button logic would work
    console.log("\nButton Logic Preview:");
    console.log("=====================");

    result.rows.forEach((team) => {
      let buttonText, buttonClass;

      if (parseInt(team.current_members) >= team.team_size) {
        buttonText = "Team Full";
        buttonClass = "btn-secondary";
      } else if (team.is_recruiting) {
        buttonText = "Join Team";
        buttonClass = "btn-success";
      } else {
        buttonText = "Request to Join";
        buttonClass = "btn-warning";
      }

      console.log(`${team.name}: ${buttonText} (${buttonClass})`);
    });
  } catch (error) {
    console.error("Error:", error);
  }
}

testTeamsWithRecruiting();
