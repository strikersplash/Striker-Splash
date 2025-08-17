// Script to update the notifications table to match our expectations
const { Pool } = require("pg");

// Create the database connection
const pool = new Pool({
  user: "striker_splash",
  host: "localhost",
  database: "striker_splash",
  password: "striker_splash",
  port: 5432,
});

async function updateNotificationsTable() {
  try {
    console.log("=== Updating Notifications Table ===");

    // First, check if the table exists
    const checkTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'notifications'
      ) as table_exists;
    `;

    const tableResult = await pool.query(checkTableQuery);

    if (!tableResult.rows[0].table_exists) {
      console.log("Notifications table does not exist. Creating it...");

      // Create notifications table
      await pool.query(`
        CREATE TABLE notifications (
          id SERIAL PRIMARY KEY,
          player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
          title VARCHAR(255) NOT NULL DEFAULT 'Notification',
          message TEXT NOT NULL,
          type VARCHAR(50) NOT NULL,
          is_read BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMP NOT NULL DEFAULT now(),
          read_at TIMESTAMP
        );
        
        CREATE INDEX idx_notifications_player_id ON notifications (player_id);
      `);

      console.log("Notifications table created successfully!");
      return;
    }

    // Check if title column exists
    const titleColQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'notifications' AND column_name = 'title'
      ) as has_title;
    `;

    const titleResult = await pool.query(titleColQuery);
    const hasTitleColumn = titleResult.rows[0].has_title;

    // If title column doesn't exist, add it
    if (!hasTitleColumn) {
      console.log("Adding 'title' column to notifications table");
      await pool.query(`
        ALTER TABLE notifications ADD COLUMN title VARCHAR(255) NOT NULL DEFAULT 'Notification';
      `);
      console.log("Added 'title' column successfully!");
    } else {
      console.log("'title' column already exists");
    }

    console.log("Notifications table structure updated successfully!");
  } catch (error) {
    console.error("Error updating notifications table:", error);
  } finally {
    await pool.end();
  }
}

// Run the update function
updateNotificationsTable();
