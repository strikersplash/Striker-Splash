const { pool } = require("./dist/config/db");

async function checkUserPhoto() {
  try {
    // Get players and their photos
    const result = await pool.query(`
      SELECT id, name, phone, photo_path 
      FROM players 
      ORDER BY id 
      LIMIT 10
    `);

    console.log("Players and their photos:");
    result.rows.forEach((player) => {
      console.log(
        `ID: ${player.id}, Name: ${player.name}, Phone: ${
          player.phone
        }, Photo: ${player.photo_path || "NO PHOTO"}`
      );
    });

    // Check if there are any photos in uploads
    const fs = require("fs");
    const path = require("path");
    const uploadsDir = path.join(__dirname, "public", "uploads");

    if (fs.existsSync(uploadsDir)) {
      const files = fs
        .readdirSync(uploadsDir)
        .filter(
          (f) => f.endsWith(".jpg") || f.endsWith(".jpeg") || f.endsWith(".png")
        );
      console.log(
        `\nFound ${files.length} image files in uploads:`,
        files.slice(0, 5)
      );

      // Assign a photo to the first player if they don't have one
      const firstPlayer = result.rows[0];
      if (firstPlayer && !firstPlayer.photo_path && files.length > 0) {
        const photoPath = `/uploads/${files[0]}`;
        await pool.query("UPDATE players SET photo_path = $1 WHERE id = $2", [
          photoPath,
          firstPlayer.id,
        ]);
        console.log(
          `\nAssigned photo ${photoPath} to player ${firstPlayer.name} (ID: ${firstPlayer.id})`
        );
      }
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await pool.end();
  }
}

checkUserPhoto();
