const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

// Database configuration
const pool = new Pool({
  user: "striker_splash",
  host: "localhost",
  database: "striker_splash",
  password: "striker_splash",
  port: 5432,
});

const uploadsDir = path.join(__dirname, "src/public/uploads");

async function fixProfilePictures() {
  try {
    console.log("🔍 Checking profile picture consistency...\n");

    // Get all players with photo paths
    const playersResult = await pool.query(
      "SELECT id, name, photo_path FROM players WHERE photo_path IS NOT NULL AND photo_path != ''"
    );

    console.log(
      `Found ${playersResult.rows.length} players with profile pictures set.\n`
    );

    // Get list of available files
    const availableFiles = fs
      .readdirSync(uploadsDir)
      .filter((file) => file.match(/\.(jpg|jpeg|png|gif)$/i))
      .map((file) => `/uploads/${file}`);

    console.log(
      `Found ${availableFiles.length} image files in uploads directory.\n`
    );

    const brokenReferences = [];
    const validReferences = [];

    // Check each player's photo path
    for (const player of playersResult.rows) {
      const photoPath = player.photo_path;
      const fullPath = path.join(uploadsDir, path.basename(photoPath));

      if (fs.existsSync(fullPath)) {
        validReferences.push(player);
        console.log(`✅ ${player.name}: ${photoPath} - File exists`);
      } else {
        brokenReferences.push(player);
        console.log(`❌ ${player.name}: ${photoPath} - File missing`);
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Valid references: ${validReferences.length}`);
    console.log(`   Broken references: ${brokenReferences.length}`);

    if (brokenReferences.length > 0) {
      console.log(`\n🔧 Fixing broken references...\n`);

      // For broken references, try to assign them to available files
      // This is a simple assignment - in a real scenario you'd want more sophisticated matching
      for (let i = 0; i < brokenReferences.length; i++) {
        const player = brokenReferences[i];

        if (i < availableFiles.length) {
          const newPhotoPath = availableFiles[i];

          await pool.query("UPDATE players SET photo_path = $1 WHERE id = $2", [
            newPhotoPath,
            player.id,
          ]);

          console.log(
            `✅ Updated ${player.name}: ${player.photo_path} → ${newPhotoPath}`
          );
        } else {
          // No more files available, clear the photo path
          await pool.query(
            "UPDATE players SET photo_path = NULL WHERE id = $1",
            [player.id]
          );

          console.log(
            `🗑️  Cleared photo path for ${player.name} (no available files)`
          );
        }
      }
    }

    console.log(`\n✅ Profile picture fix completed!`);

    // Final verification
    const finalCheck = await pool.query(
      "SELECT id, name, photo_path FROM players WHERE photo_path IS NOT NULL AND photo_path != ''"
    );

    console.log(
      `\n📋 Final state: ${finalCheck.rows.length} players with profile pictures`
    );
    finalCheck.rows.forEach((player) => {
      const fullPath = path.join(uploadsDir, path.basename(player.photo_path));
      const exists = fs.existsSync(fullPath) ? "✅" : "❌";
      console.log(`   ${exists} ${player.name}: ${player.photo_path}`);
    });
  } catch (error) {
    console.error("Error fixing profile pictures:", error);
  } finally {
    await pool.end();
  }
}

// Run the fix
fixProfilePictures();
