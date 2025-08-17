#!/usr/bin/env node

/**
 * Fix Duplicate Names Script
 *
 * This script provides solutions for resolving duplicate player names
 * to prevent authentication vulnerabilities.
 */

const { Pool } = require("pg");
const readline = require("readline");

// Database configuration
const pool = new Pool({
  user: process.env.DB_USER || "striker_splash_user",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "striker_splash_db",
  password: process.env.DB_PASSWORD || "your_password_here",
  port: process.env.DB_PORT || 5432,
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function findDuplicates() {
  const result = await pool.query(
    "SELECT id, name, phone, email FROM players ORDER BY name, id"
  );
  const players = result.rows;

  const nameGroups = {};
  players.forEach((player) => {
    const normalizedName = player.name.toLowerCase().trim();
    if (!nameGroups[normalizedName]) {
      nameGroups[normalizedName] = [];
    }
    nameGroups[normalizedName].push(player);
  });

  return Object.entries(nameGroups).filter(
    ([name, players]) => players.length > 1
  );
}

async function suggestUniqueNames(players) {
  const suggestions = [];

  for (let i = 0; i < players.length; i++) {
    const player = players[i];
    const baseName = player.name;

    // Suggestion 1: Add phone last 4 digits
    const phoneDigits = player.phone ? player.phone.slice(-4) : `${i + 1}`;
    suggestions.push({
      playerId: player.id,
      currentName: baseName,
      suggestion1: `${baseName} (${phoneDigits})`,
      suggestion2: `${baseName} ${i + 1}`,
      suggestion3: `${baseName} - ${player.phone || "ID" + player.id}`,
    });
  }

  return suggestions;
}

async function promptUserChoice(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function fixDuplicateNames() {
  try {
    console.log("🔧 DUPLICATE NAME RESOLVER\n");

    const duplicates = await findDuplicates();

    if (duplicates.length === 0) {
      console.log("✅ No duplicate names found!");
      return;
    }

    console.log(`Found ${duplicates.length} sets of duplicate names:\n`);

    for (const [name, players] of duplicates) {
      console.log(`\n📝 Resolving duplicates for: "${players[0].name}"`);
      console.log(`   Players affected: ${players.length}`);

      const suggestions = await suggestUniqueNames(players);

      console.log("\n   Current players:");
      players.forEach((player, index) => {
        console.log(
          `   ${index + 1}. ID: ${player.id}, Phone: ${player.phone}`
        );
      });

      console.log("\n   Suggested unique names:");
      suggestions.forEach((suggestion, index) => {
        console.log(`   ${index + 1}. Player ID ${suggestion.playerId}:`);
        console.log(`      Option A: "${suggestion.suggestion1}"`);
        console.log(`      Option B: "${suggestion.suggestion2}"`);
        console.log(`      Option C: "${suggestion.suggestion3}"`);
      });

      const choice = await promptUserChoice(
        `\nResolve this group? (y/n/s=skip): `
      );

      if (choice.toLowerCase() === "y") {
        console.log("\n🚧 MANUAL RESOLUTION REQUIRED");
        console.log("Please contact these players to choose unique names:");
        players.forEach((player) => {
          console.log(
            `- Contact player ID ${player.id} (${player.phone}) to update name`
          );
        });

        const updateChoice = await promptUserChoice(
          `\nUpdate names automatically with phone suffix? (y/n): `
        );

        if (updateChoice.toLowerCase() === "y") {
          for (let i = 0; i < players.length; i++) {
            const player = players[i];
            const phoneDigits = player.phone
              ? player.phone.slice(-4)
              : `${i + 1}`;
            const newName = `${player.name} (${phoneDigits})`;

            await pool.query("UPDATE players SET name = $1 WHERE id = $2", [
              newName,
              player.id,
            ]);
            console.log(
              `✅ Updated player ID ${player.id}: "${player.name}" → "${newName}"`
            );
          }
        }
      }
    }

    console.log("\n🛡️  SECURITY ENHANCEMENT RECOMMENDATIONS:");
    console.log("1. Add database constraint to prevent future duplicates");
    console.log("2. Update registration form to check for existing names");
    console.log(
      "3. Consider using phone numbers as unique identifiers in URLs"
    );
    console.log("4. Implement name availability checking during registration");

    const addConstraintChoice = await promptUserChoice(
      `\nAdd database constraint to prevent future exact name duplicates? (y/n): `
    );

    if (addConstraintChoice.toLowerCase() === "y") {
      try {
        // Note: This would prevent exact duplicates but allow case variations
        await pool.query(`
          CREATE UNIQUE INDEX IF NOT EXISTS idx_players_name_unique 
          ON players (LOWER(TRIM(name))) 
          WHERE active = true
        `);
        console.log("✅ Added unique constraint on player names");
      } catch (error) {
        console.log(
          "⚠️  Could not add constraint (may need to resolve duplicates first)"
        );
        console.log("   Error:", error.message);
      }
    }
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    rl.close();
    await pool.end();
  }
}

// Handle Ctrl+C gracefully
process.on("SIGINT", () => {
  console.log("\n\n👋 Goodbye!");
  rl.close();
  pool.end();
  process.exit(0);
});

fixDuplicateNames();
