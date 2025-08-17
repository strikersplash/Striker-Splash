#!/usr/bin/env node

const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER || "striker_splash_user",
  host: "localhost",
  database: process.env.DB_NAME || "striker_splash_db",
  password: process.env.DB_PASSWORD || "striker_admin_2024!",
  port: 5432,
});

async function getJohnDoeCredentials() {
  try {
    console.log("🔍 Looking for John Doe accounts...\n");

    // Find John Doe accounts
    const result = await pool.query(`
      SELECT id, name, phone, email, created_at 
      FROM players 
      WHERE LOWER(name) LIKE '%john%doe%' 
      ORDER BY id
    `);

    if (result.rows.length === 0) {
      console.log("❌ No John Doe accounts found");
      return;
    }

    console.log(`✅ Found ${result.rows.length} John Doe account(s):\n`);

    result.rows.forEach((player, index) => {
      console.log(`${index + 1}. Account Details:`);
      console.log(`   ID: ${player.id}`);
      console.log(`   Name: "${player.name}"`);
      console.log(`   📱 Login Phone: ${player.phone}`);
      console.log(`   📧 Email: ${player.email || "Not set"}`);
      console.log(`   📅 Created: ${player.created_at}`);
      console.log("");
    });

    console.log("🔐 LOGIN INSTRUCTIONS:");
    console.log("1. Go to: http://localhost:3000/auth/login");
    console.log('2. Click "Player Login" tab');
    console.log("3. Use the phone number as username");
    console.log('4. Default password is usually "password123"');
    console.log("");

    result.rows.forEach((player, index) => {
      console.log(`Account ${index + 1} Login:`);
      console.log(`   Username: ${player.phone}`);
      console.log(`   Password: password123 (try this first)`);
      console.log("");
    });
  } catch (error) {
    console.error("❌ Error getting John Doe credentials:", error.message);
  } finally {
    await pool.end();
  }
}

getJohnDoeCredentials();
