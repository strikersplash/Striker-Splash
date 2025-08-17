const { pool } = require("./dist/config/db");

async function testCompetitionSystem() {
  try {
    console.log("Testing Competition System...");

    // Test 1: Check if competition tables exist
    console.log("\n1. Checking competition tables...");
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%competition%'
      ORDER BY table_name
    `);

    console.log("Competition tables found:");
    tables.rows.forEach((row) => {
      console.log(`  - ${row.table_name}`);
    });

    // Test 2: Test creating a sample individual competition
    console.log("\n2. Creating sample individual competition...");
    const competitionResult = await pool.query(`
      INSERT INTO custom_competitions (
        type, name, format, cost, kicks_per_player, max_participants, 
        description, status, created_at
      ) VALUES (
        'individual', 'Test 1v1 Competition', '1v1', 500, 10, 2,
        'Test competition for system verification', 'setup', NOW()
      ) RETURNING *
    `);

    const competition = competitionResult.rows[0];
    console.log(
      `Created competition: ${competition.name} (ID: ${competition.id})`
    );

    // Test 3: Test adding participants
    console.log("\n3. Testing participant addition...");

    // Get first two players from the database
    const playersResult = await pool.query(`
      SELECT id, name FROM players LIMIT 2
    `);

    if (playersResult.rows.length >= 2) {
      const player1 = playersResult.rows[0];
      const player2 = playersResult.rows[1];

      // Add participants
      await pool.query(
        `
        INSERT INTO custom_competition_participants (
          competition_id, player_id, status, total_goals, total_kicks
        ) VALUES 
        ($1, $2, 'registered', 0, 0),
        ($1, $3, 'registered', 0, 0)
      `,
        [competition.id, player1.id, player2.id]
      );

      console.log(`Added participants: ${player1.name} and ${player2.name}`);
    } else {
      console.log(
        "Not enough players in database to test participant addition"
      );
    }

    // Test 4: Test competition status update
    console.log("\n4. Testing competition status update...");
    await pool.query(
      `
      UPDATE custom_competitions 
      SET status = 'active' 
      WHERE id = $1
    `,
      [competition.id]
    );

    console.log("Competition status updated to active");

    // Test 5: Verify competition queue functionality
    console.log("\n5. Testing competition queue...");
    const queueResult = await pool.query(
      `
      SELECT cc.*, 
             COUNT(ccp.id) as participant_count,
             STRING_AGG(p.name, ', ') as participant_names
      FROM custom_competitions cc
      LEFT JOIN custom_competition_participants ccp ON cc.id = ccp.competition_id
      LEFT JOIN players p ON ccp.player_id = p.id
      WHERE cc.id = $1
      GROUP BY cc.id
    `,
      [competition.id]
    );

    const queueData = queueResult.rows[0];
    console.log(
      `Queue data: ${queueData.name} - ${queueData.participant_count} participants`
    );
    console.log(`Participants: ${queueData.participant_names || "None"}`);

    // Cleanup
    console.log("\n6. Cleaning up test data...");
    await pool.query(
      "DELETE FROM custom_competition_participants WHERE competition_id = $1",
      [competition.id]
    );
    await pool.query("DELETE FROM custom_competitions WHERE id = $1", [
      competition.id,
    ]);
    console.log("Test data cleaned up");

    console.log("\n✅ Competition system test completed successfully!");
  } catch (error) {
    console.error("❌ Competition system test failed:", error);
  } finally {
    await pool.end();
  }
}

testCompetitionSystem();
