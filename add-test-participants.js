// Add test participants to the created competition
const { pool } = require("./dist/config/db.js");

async function addTestParticipants() {
  try {
    // First create some test players if they don't exist
    console.log("Creating test players...");

    const players = [
      {
        name: "Test Player 1",
        phone: "1234567890",
        dob: "1990-01-01",
        residence: "Test City",
        qr_hash: "test1hash",
        age_group: "adult",
      },
      {
        name: "Test Player 2",
        phone: "1234567891",
        dob: "1992-01-01",
        residence: "Test City",
        qr_hash: "test2hash",
        age_group: "adult",
      },
      {
        name: "Test Player 3",
        phone: "1234567892",
        dob: "1994-01-01",
        residence: "Test City",
        qr_hash: "test3hash",
        age_group: "adult",
      },
    ];

    const playerIds = [];

    for (const player of players) {
      const playerResult = await pool.query(
        `
        INSERT INTO players (name, phone, dob, residence, qr_hash, age_group, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        ON CONFLICT (phone) DO UPDATE SET name = $1
        RETURNING id, name
      `,
        [
          player.name,
          player.phone,
          player.dob,
          player.residence,
          player.qr_hash,
          player.age_group,
        ]
      );

      playerIds.push(playerResult.rows[0].id);
      console.log("Created/found player:", playerResult.rows[0]);
    }

    // Get the latest competition
    const competitionResult = await pool.query(`
      SELECT id FROM competitions WHERE status = 'active' ORDER BY created_at DESC LIMIT 1
    `);

    if (competitionResult.rows.length === 0) {
      console.log("No active competition found");
      return;
    }

    const competitionId = competitionResult.rows[0].id;
    console.log("Adding participants to competition:", competitionId);

    // Add participants to competition
    for (const playerId of playerIds) {
      await pool.query(
        `
        INSERT INTO competition_players (competition_id, player_id, created_at)
        VALUES ($1, $2, NOW())
      `,
        [competitionId, playerId]
      );
    }

    console.log("Added participants to competition");

    // Verify participants
    const participantsResult = await pool.query(
      `
      SELECT cp.id, p.name, p.phone
      FROM competition_players cp
      JOIN players p ON cp.player_id = p.id
      WHERE cp.competition_id = $1
    `,
      [competitionId]
    );

    console.log("Competition participants:", participantsResult.rows);

    console.log(`\nCompetition ${competitionId} is ready for testing!`);
    console.log(
      `Visit: http://localhost:3000/staff/competition-setup/${competitionId}/live`
    );

    pool.end();
  } catch (error) {
    console.error("Error:", error);
    pool.end();
  }
}

addTestParticipants();
