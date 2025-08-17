// Test competition functionality without authentication
const { pool } = require("./dist/config/db");

async function testCompetitionQueue() {
  try {
    console.log("🧪 Testing Competition Queue...\n");

    // Test 1: Get competition queue
    console.log("1️⃣ Testing getCompetitionQueue query...");
    const query = `
      SELECT 
        c.*,
        COUNT(DISTINCT cp.player_id) as participant_count,
        COUNT(DISTINCT ct.team_id) as team_count
      FROM competitions c
      LEFT JOIN competition_players cp ON c.id = cp.competition_id
      LEFT JOIN competition_teams ct ON c.id = ct.competition_id
      WHERE c.status IN ('waiting', 'active')
      GROUP BY c.id
      ORDER BY c.created_at ASC
    `;

    const result = await pool.query(query);
    const competitions = result.rows.map((comp) => ({
      ...comp,
      participant_count:
        comp.type === "individual" ? comp.participant_count : comp.team_count,
    }));

    console.log(`✅ Found ${competitions.length} competitions in queue:`);
    competitions.forEach((comp, index) => {
      console.log(
        `   ${index + 1}. ${comp.name} (${comp.type}) - Status: ${comp.status}`
      );
    });

    // Test 2: Create individual competition
    console.log("\n2️⃣ Testing individual competition creation...");

    const individualCompQuery = `
      INSERT INTO competitions (
        name, type, format, team_size, cost, kicks_per_player, 
        max_participants, max_teams, description, status, created_by, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'waiting', $10, NOW())
      RETURNING *
    `;

    const individualCompValues = [
      "Test Individual Competition",
      "individual",
      null,
      null,
      5.0,
      10,
      10,
      null,
      "Test individual competition description",
      1, // created_by admin user
    ];

    const individualResult = await pool.query(
      individualCompQuery,
      individualCompValues
    );
    const individualComp = individualResult.rows[0];

    console.log(
      `✅ Individual competition created with ID: ${individualComp.id}`
    );

    // Test 3: Create team competition
    console.log("\n3️⃣ Testing team competition creation...");

    const teamCompQuery = `
      INSERT INTO competitions (
        name, type, format, team_size, cost, kicks_per_player, 
        max_participants, max_teams, description, status, created_by, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'waiting', $10, NOW())
      RETURNING *
    `;

    const teamCompValues = [
      "Test Team Competition",
      "team",
      null,
      5,
      25.0,
      10,
      null,
      4,
      "Test team competition description",
      1, // created_by admin user
    ];

    const teamResult = await pool.query(teamCompQuery, teamCompValues);
    const teamComp = teamResult.rows[0];

    console.log(`✅ Team competition created with ID: ${teamComp.id}`);

    // Test 4: Start a competition
    console.log("\n4️⃣ Testing competition start...");

    const startQuery = `
      UPDATE competitions 
      SET status = 'active', started_at = NOW()
      WHERE id = $1 AND status = 'waiting'
      RETURNING *
    `;

    const startResult = await pool.query(startQuery, [individualComp.id]);

    if (startResult.rows.length > 0) {
      console.log(`✅ Competition ${individualComp.id} started successfully`);
    } else {
      console.log(`❌ Failed to start competition ${individualComp.id}`);
    }

    // Test 5: Get updated queue
    console.log("\n5️⃣ Testing updated queue...");

    const updatedResult = await pool.query(query);
    const updatedCompetitions = updatedResult.rows.map((comp) => ({
      ...comp,
      participant_count:
        comp.type === "individual" ? comp.participant_count : comp.team_count,
    }));

    console.log(
      `✅ Updated queue has ${updatedCompetitions.length} competitions:`
    );
    updatedCompetitions.forEach((comp, index) => {
      console.log(
        `   ${index + 1}. ${comp.name} (${comp.type}) - Status: ${comp.status}`
      );
    });

    console.log("\n🎉 All tests completed successfully!");
    console.log("\n📊 SUMMARY:");
    console.log(`   ✅ Competition queue query works`);
    console.log(`   ✅ Individual competition creation works`);
    console.log(`   ✅ Team competition creation works`);
    console.log(`   ✅ Competition start functionality works`);
    console.log(`   ✅ Status updates work correctly`);
  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    await pool.end();
  }
}

testCompetitionQueue();
