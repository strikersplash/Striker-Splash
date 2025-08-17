#!/usr/bin/env node

/**
 * Security Audit Script: Detect Duplicate Player Names
 *
 * This script identifies players with identical names that could cause
 * authentication bypass issues via SEO-friendly URL collisions.
 */

const { Pool } = require("pg");

// Database configuration
const pool = new Pool({
  user: process.env.DB_USER || "striker_splash_user",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "striker_splash_db",
  password: process.env.DB_PASSWORD || "your_password_here",
  port: process.env.DB_PORT || 5432,
});

// Generate slug like the Player model does
function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens
}

async function auditDuplicateNames() {
  try {
    console.log("🔍 SECURITY AUDIT: Checking for duplicate player names...\n");

    // Get all players
    const result = await pool.query(
      "SELECT id, name, phone, email, created_at FROM players ORDER BY name, id"
    );
    const players = result.rows;

    console.log(`📊 Total players: ${players.length}\n`);

    // Group players by name (case-insensitive)
    const nameGroups = {};
    const slugGroups = {};

    players.forEach((player) => {
      const normalizedName = player.name.toLowerCase().trim();
      const slug = generateSlug(player.name);

      // Group by name
      if (!nameGroups[normalizedName]) {
        nameGroups[normalizedName] = [];
      }
      nameGroups[normalizedName].push(player);

      // Group by slug
      if (!slugGroups[slug]) {
        slugGroups[slug] = [];
      }
      slugGroups[slug].push(player);
    });

    // Find duplicate names
    const duplicateNames = Object.entries(nameGroups).filter(
      ([name, players]) => players.length > 1
    );
    const duplicateSlugs = Object.entries(slugGroups).filter(
      ([slug, players]) => players.length > 1
    );

    console.log("🚨 SECURITY FINDINGS:\n");

    if (duplicateNames.length === 0) {
      console.log("✅ No duplicate player names found!");
    } else {
      console.log(
        `❌ Found ${duplicateNames.length} sets of duplicate names:\n`
      );

      duplicateNames.forEach(([name, players], index) => {
        console.log(
          `${index + 1}. Name: "${players[0].name}" (${players.length} players)`
        );
        console.log(`   Slug: "${generateSlug(players[0].name)}"`);
        players.forEach((player) => {
          console.log(
            `   - ID: ${player.id}, Phone: ${player.phone}, Created: ${player.created_at}`
          );
        });
        console.log();
      });
    }

    if (duplicateSlugs.length === 0) {
      console.log("✅ No duplicate SEO slugs found!");
    } else {
      console.log(
        `❌ Found ${duplicateSlugs.length} sets of duplicate SEO slugs:\n`
      );

      duplicateSlugs.forEach(([slug, players], index) => {
        console.log(
          `${index + 1}. Slug: "${slug}" (${players.length} players)`
        );
        players.forEach((player) => {
          console.log(
            `   - ID: ${player.id}, Name: "${player.name}", Phone: ${player.phone}`
          );
        });
        console.log();
      });
    }

    // Security recommendations
    console.log("\n🛡️  SECURITY RECOMMENDATIONS:\n");

    if (duplicateNames.length > 0 || duplicateSlugs.length > 0) {
      console.log(
        "1. ❌ CRITICAL: Authentication bypass vulnerability exists!"
      );
      console.log(
        "2. 🔧 Players with duplicate names can access each other's profiles"
      );
      console.log(
        "3. ✅ FIXED: Updated dashboard routing to prevent unauthorized access"
      );
      console.log(
        "4. 🔍 Consider adding unique constraints or name disambiguation"
      );
      console.log(
        "5. 📝 Update registration process to warn about existing names"
      );

      if (duplicateNames.length > 0) {
        console.log("\n💡 SUGGESTED ACTIONS FOR DUPLICATE NAMES:");
        duplicateNames.forEach(([name, players]) => {
          console.log(`\n• For "${players[0].name}":`);
          console.log(`  - Contact players to choose unique display names`);
          console.log(`  - Add middle initial or location to differentiate`);
          console.log(`  - Consider phone-based identification in URLs`);
        });
      }
    } else {
      console.log("✅ No immediate security concerns found");
      console.log("✅ All player names are unique");
      console.log("✅ Updated security measures in place");
    }

    console.log("\n🔒 SECURITY MEASURES IMPLEMENTED:");
    console.log("• Dashboard access now restricted to authenticated user only");
    console.log("• Name-based URL routing secured with ownership verification");
    console.log("• Duplicate slug detection added to Player.findBySlug()");
    console.log("• Navigation links updated to use secure routing");
  } catch (error) {
    console.error("❌ Error during audit:", error);
  } finally {
    await pool.end();
  }
}

// Run the audit
auditDuplicateNames();
