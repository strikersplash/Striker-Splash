const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER || "striker_splash",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "striker_splash",
  password: process.env.DB_PASSWORD || "striker_splash",
  port: parseInt(process.env.DB_PORT || "5432"),
});

async function createJoinRequestsTable() {
  const client = await pool.connect();
  try {
    console.log("Creating team_join_requests table...");

    await client.query(`
      CREATE TABLE IF NOT EXISTS team_join_requests (
        id SERIAL PRIMARY KEY,
        team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
        player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(team_id, player_id)
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_team_join_requests_team_id ON team_join_requests(team_id)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_team_join_requests_player_id ON team_join_requests(player_id)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_team_join_requests_status ON team_join_requests(status)
    `);

    console.log("team_join_requests table created successfully!");
  } catch (error) {
    console.error("Error creating table:", error);
  } finally {
    client.release();
    await pool.end();
  }
}

createJoinRequestsTable();
