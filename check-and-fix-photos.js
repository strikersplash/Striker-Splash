const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "striker_splash",
  password: process.env.DB_PASSWORD || "yourpassword",
  port: process.env.DB_PORT || 5432,
});

async function checkAndFixPhotos() {
  try {
    console.log("Checking photo paths in database...");

    // Get all players with photo_path
    const result = await pool.query(
      "SELECT id, name, photo_path FROM players WHERE photo_path IS NOT NULL ORDER BY name"
    );

    console.log(`Found ${result.rows.length} players with photo paths:`);

    const uploadsDir = path.join(__dirname, "public/uploads");
    let fixedCount = 0;

    for (const player of result.rows) {
      console.log(`\nChecking ${player.name} (ID: ${player.id})`);
      console.log(`  Current photo_path: ${player.photo_path}`);

      // Clean the photo path to get just the filename
      let filename = player.photo_path;
      if (filename.startsWith("/uploads/")) {
        filename = filename.replace("/uploads/", "");
      } else if (filename.startsWith("uploads/")) {
        filename = filename.replace("uploads/", "");
      }

      const filePath = path.join(uploadsDir, filename);
      console.log(`  Looking for file: ${filePath}`);

      if (fs.existsSync(filePath)) {
        console.log(`  ✓ File exists`);

        // Make sure the database path is correct
        const correctPath = `/uploads/${filename}`;
        if (player.photo_path !== correctPath) {
          console.log(
            `  Updating database path from "${player.photo_path}" to "${correctPath}"`
          );
          await pool.query("UPDATE players SET photo_path = $1 WHERE id = $2", [
            correctPath,
            player.id,
          ]);
          fixedCount++;
        }
      } else {
        console.log(`  ✗ File missing`);

        // Look for any file with similar timestamp
        const files = fs.readdirSync(uploadsDir);
        const possibleMatches = files.filter((file) => {
          // Extract timestamp from current filename
          const currentTimestamp = filename.split("-")[0];
          return file.startsWith(currentTimestamp);
        });

        if (possibleMatches.length > 0) {
          console.log(`  Found possible match: ${possibleMatches[0]}`);
          const newPath = `/uploads/${possibleMatches[0]}`;
          console.log(`  Updating to: ${newPath}`);
          await pool.query("UPDATE players SET photo_path = $1 WHERE id = $2", [
            newPath,
            player.id,
          ]);
          fixedCount++;
        } else {
          console.log(`  No matching file found, removing photo_path`);
          await pool.query(
            "UPDATE players SET photo_path = NULL WHERE id = $2",
            [player.id]
          );
          fixedCount++;
        }
      }
    }

    console.log(`\nFixed ${fixedCount} photo paths.`);

    // Show players named Johnny or Tysha specifically
    console.log("\nChecking specific users mentioned:");
    const specificResult = await pool.query(
      "SELECT id, name, photo_path FROM players WHERE name ILIKE '%johnny%' OR name ILIKE '%tysha%'"
    );

    for (const player of specificResult.rows) {
      console.log(
        `${player.name} (ID: ${player.id}): ${player.photo_path || "No photo"}`
      );
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await pool.end();
  }
}

checkAndFixPhotos();
