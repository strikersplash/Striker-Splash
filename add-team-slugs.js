require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Function to generate slug from team name
function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

async function addSlugColumn() {
  try {
    console.log("Adding slug column to teams table...");

    // Add slug column
    await pool.query(
      "ALTER TABLE teams ADD COLUMN IF NOT EXISTS slug VARCHAR(150)"
    );
    console.log("✓ Slug column added");

    // Get all teams without slugs
    const teams = await pool.query(
      "SELECT id, name FROM teams WHERE slug IS NULL OR slug = ''"
    );
    console.log(`Found ${teams.rows.length} teams to update`);

    // Generate slugs for existing teams
    for (const team of teams.rows) {
      let slug = generateSlug(team.name);

      // Check for duplicates and append number if needed
      let counter = 1;
      let finalSlug = slug;

      while (true) {
        const existing = await pool.query(
          "SELECT id FROM teams WHERE slug = $1 AND id != $2",
          [finalSlug, team.id]
        );
        if (existing.rows.length === 0) break;

        finalSlug = `${slug}-${counter}`;
        counter++;
      }

      await pool.query("UPDATE teams SET slug = $1 WHERE id = $2", [
        finalSlug,
        team.id,
      ]);
      console.log(`✓ Updated team "${team.name}" with slug: ${finalSlug}`);
    }

    // Add unique constraint
    try {
      await pool.query(
        "ALTER TABLE teams ADD CONSTRAINT teams_slug_unique UNIQUE (slug)"
      );
      console.log("✓ Added unique constraint on slug column");
    } catch (error) {
      if (error.code !== "42P07") {
        // Constraint already exists
        console.log("Note: Unique constraint already exists");
      }
    }

    // Create index
    await pool.query(
      "CREATE INDEX IF NOT EXISTS idx_teams_slug ON teams(slug)"
    );
    console.log("✓ Created index on slug column");

    console.log("✅ Slug migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
  } finally {
    await pool.end();
  }
}

addSlugColumn();
