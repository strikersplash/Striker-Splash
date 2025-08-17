const { pool } =       const result = await pool.query(`
        INSERT INTO players (name, phone, email, password_hash, dob, created_at)
        VALUES ($1, $2, $3, '$2b$10$K8gF5X.8yQ2ZJQ2ZJQ2ZJuO8X2ZJQ2ZJQ2ZJQ2ZJQ2ZJQ2ZJQ2ZJQ', '1990-01-01', NOW())
        ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name
        RETURNING id, name
      `, [player.name, player.phone, player.email]);e("./dist/config/db");

async function createTodayRaffleData() {
  try {
    console.log("🎫 Creating raffle data for July 28, 2025...");
    
    // Create some test players if they don't exist
    const players = [
      { name: "Test Winner 1", phone: "501-3001", email: "winner1@example.com" },
      { name: "Test Winner 2", phone: "501-3002", email: "winner2@example.com" },
      { name: "Test Winner 3", phone: "501-3003", email: "winner3@example.com" },
      { name: "Test Winner 4", phone: "501-3004", email: "winner4@example.com" },
      { name: "Test Winner 5", phone: "501-3005", email: "winner5@example.com" },
    ];
    
    console.log("Creating test players...");
    for (const player of players) {
      const result = await pool.query(`
        INSERT INTO players (name, phone, email, password_hash, created_at)
        VALUES ($1, $2, $3, '$2b$10$K8gF5X.8yQ2ZJQ2ZJQ2ZJuO8X2ZJQ2ZJQ2ZJQ2ZJQ2ZJQ2ZJQ2ZJQ', NOW())
        ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name
        RETURNING id, name
      `, [player.name, player.phone, player.email]);
      
      if (result.rows.length > 0) {
        console.log(`✓ Player: ${result.rows[0].name} (ID: ${result.rows[0].id})`);
      }
    }

    // Get the test player IDs
    const playersResult = await pool.query(`
      SELECT id, name FROM players WHERE phone LIKE '501-300%' ORDER BY phone LIMIT 5
    `);

    const playerIds = playersResult.rows;
    console.log(`Found ${playerIds.length} test players`);

    // Create tickets for TODAY (July 28, 2025)
    let ticketNumber = 3000; // Start from 3000

    for (const player of playerIds) {
      // Create 2 tickets per player
      for (let i = 0; i < 2; i++) {
        const result = await pool.query(`
          INSERT INTO queue_tickets (player_id, ticket_number, status, created_at, updated_at)
          VALUES ($1, $2, 'played', NOW(), NOW())
          RETURNING id, ticket_number
        `, [player.id, ticketNumber++]);
        
        console.log(`✓ Created ticket #${result.rows[0].ticket_number} for ${player.name}`);
      }
    }

    // Check results for TODAY
    const ticketCount = await pool.query(`
      SELECT COUNT(*) as count FROM queue_tickets 
      WHERE DATE(created_at) = CURRENT_DATE AND status = 'played'
    `);

    console.log(`✅ Total eligible raffle tickets for TODAY: ${ticketCount.rows[0].count}`);
    
  } catch (error) {
    console.error("❌ Error creating raffle data:", error);
  } finally {
    await pool.end();
  }
}

createTodayRaffleData();
