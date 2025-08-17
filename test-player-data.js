const { pool } = require("./dist/config/db");

async function testPlayerData() {
  try {
    console.log("Testing player data for avatar generation...");

    // Query the same data that the controller gets
    const query =
      "SELECT id, name, photo_path FROM players ORDER BY name LIMIT 5";
    const result = await pool.query(query);

    console.log("Found players:");
    result.rows.forEach((player) => {
      console.log(
        `- ID: ${player.id}, Name: ${player.name}, Photo Path: ${
          player.photo_path || "NULL"
        }`
      );
    });

    console.log("\nTesting avatar generation logic...");
    result.rows.forEach((player) => {
      const hasPhoto = player.photo_path && player.photo_path.trim() !== "";
      console.log(
        `${player.name}: ${
          hasPhoto ? "Has photo" : "Will use initials"
        } (photo_path: ${player.photo_path || "null"})`
      );
    });
  } catch (error) {
    console.error("Error:", error);
  } finally {
    process.exit(0);
  }
}

testPlayerData();
