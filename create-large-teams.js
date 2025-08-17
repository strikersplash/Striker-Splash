const { pool } = require("./dist/config/db.js");

async function createLargeTeams() {
  try {
    console.log(
      "🏆 Creating teams with 11+ players for competition testing..."
    );

    // First, let's see what players and teams already exist
    const existingPlayersResult = await pool.query(`
      SELECT COUNT(*) as count FROM players
    `);
    const playerCount = parseInt(existingPlayersResult.rows[0].count);
    console.log(`📊 Current players in database: ${playerCount}`);

    const existingTeamsResult = await pool.query(`
      SELECT id, name, team_size FROM teams ORDER BY id
    `);
    console.log("📊 Current teams:");
    existingTeamsResult.rows.forEach((team) => {
      console.log(
        `  - Team ${team.id}: ${team.name} (size: ${team.team_size})`
      );
    });

    // Create additional players for testing
    const newPlayers = [
      // Team A Players (11 players total)
      {
        name: "Marcus Rodriguez",
        phone: "+501-610-1001",
        dob: "1995-03-15",
        residence: "Belize City",
        gender: "male",
        age_group: "18-30",
      },
      {
        name: "David Chen",
        phone: "+501-610-1002",
        dob: "1997-07-22",
        residence: "San Pedro",
        gender: "male",
        age_group: "18-30",
      },
      {
        name: "Carlos Mendez",
        phone: "+501-610-1003",
        dob: "1993-11-08",
        residence: "Orange Walk",
        gender: "male",
        age_group: "18-30",
      },
      {
        name: "Antonio Silva",
        phone: "+501-610-1004",
        dob: "1996-01-30",
        residence: "Belmopan",
        gender: "male",
        age_group: "18-30",
      },
      {
        name: "Roberto Martinez",
        phone: "+501-610-1005",
        dob: "1994-09-12",
        residence: "Corozal",
        gender: "male",
        age_group: "18-30",
      },
      {
        name: "Miguel Garcia",
        phone: "+501-610-1006",
        dob: "1998-05-18",
        residence: "Dangriga",
        gender: "male",
        age_group: "18-30",
      },
      {
        name: "Fernando Lopez",
        phone: "+501-610-1007",
        dob: "1992-12-03",
        residence: "Punta Gorda",
        gender: "male",
        age_group: "18-30",
      },
      {
        name: "Jose Ramirez",
        phone: "+501-610-1008",
        dob: "1995-08-25",
        residence: "Placencia",
        gender: "male",
        age_group: "18-30",
      },
      {
        name: "Luis Hernandez",
        phone: "+501-610-1009",
        dob: "1997-04-14",
        residence: "Benque Viejo",
        gender: "male",
        age_group: "18-30",
      },
      {
        name: "Diego Morales",
        phone: "+501-610-1010",
        dob: "1996-10-07",
        residence: "Spanish Lookout",
        gender: "male",
        age_group: "18-30",
      },
      {
        name: "Pablo Santos",
        phone: "+501-610-1011",
        dob: "1994-06-21",
        residence: "San Ignacio",
        gender: "male",
        age_group: "18-30",
      },

      // Team B Players (15 players total)
      {
        name: "Gabriel Torres",
        phone: "+501-610-2001",
        dob: "1995-02-28",
        residence: "Belize City",
        gender: "male",
        age_group: "18-30",
      },
      {
        name: "Rafael Flores",
        phone: "+501-610-2002",
        dob: "1993-09-15",
        residence: "San Pedro",
        gender: "male",
        age_group: "18-30",
      },
      {
        name: "Sebastian Vega",
        phone: "+501-610-2003",
        dob: "1997-01-10",
        residence: "Orange Walk",
        gender: "male",
        age_group: "18-30",
      },
      {
        name: "Alejandro Cruz",
        phone: "+501-610-2004",
        dob: "1996-12-05",
        residence: "Belmopan",
        gender: "male",
        age_group: "18-30",
      },
      {
        name: "Andres Perez",
        phone: "+501-610-2005",
        dob: "1994-07-18",
        residence: "Corozal",
        gender: "male",
        age_group: "18-30",
      },
      {
        name: "Manuel Guerrero",
        phone: "+501-610-2006",
        dob: "1998-03-11",
        residence: "Dangriga",
        gender: "male",
        age_group: "18-30",
      },
      {
        name: "Francisco Ruiz",
        phone: "+501-610-2007",
        dob: "1992-11-24",
        residence: "Punta Gorda",
        gender: "male",
        age_group: "18-30",
      },
      {
        name: "Ricardo Vargas",
        phone: "+501-610-2008",
        dob: "1995-05-07",
        residence: "Placencia",
        gender: "male",
        age_group: "18-30",
      },
      {
        name: "Joaquin Rivera",
        phone: "+501-610-2009",
        dob: "1997-08-13",
        residence: "Benque Viejo",
        gender: "male",
        age_group: "18-30",
      },
      {
        name: "Eduardo Castillo",
        phone: "+501-610-2010",
        dob: "1996-04-29",
        residence: "Spanish Lookout",
        gender: "male",
        age_group: "18-30",
      },
      {
        name: "Sergio Jimenez",
        phone: "+501-610-2011",
        dob: "1994-10-16",
        residence: "San Ignacio",
        gender: "male",
        age_group: "18-30",
      },
      {
        name: "Arturo Navarro",
        phone: "+501-610-2012",
        dob: "1993-06-02",
        residence: "Hopkins",
        gender: "male",
        age_group: "18-30",
      },
      {
        name: "Emilio Romero",
        phone: "+501-610-2013",
        dob: "1998-01-20",
        residence: "Sarteneja",
        gender: "male",
        age_group: "18-30",
      },
      {
        name: "Gonzalo Ortega",
        phone: "+501-610-2014",
        dob: "1995-09-08",
        residence: "Monkey River",
        gender: "male",
        age_group: "18-30",
      },
      {
        name: "Esteban Delgado",
        phone: "+501-610-2015",
        dob: "1997-12-14",
        residence: "Bullet Tree Falls",
        gender: "male",
        age_group: "18-30",
      },
    ];

    console.log(`\n🆕 Creating ${newPlayers.length} new players...`);

    const createdPlayers = [];
    for (const player of newPlayers) {
      try {
        const qr_hash = `QR_${player.name
          .replace(/\s+/g, "_")
          .toUpperCase()}_${Date.now()}`;

        const insertQuery = `
          INSERT INTO players (name, phone, dob, residence, gender, age_group, qr_hash, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
          RETURNING id, name
        `;

        const result = await pool.query(insertQuery, [
          player.name,
          player.phone,
          player.dob,
          player.residence,
          player.gender,
          player.age_group,
          qr_hash,
        ]);

        createdPlayers.push(result.rows[0]);
        console.log(
          `✅ Created player: ${result.rows[0].name} (ID: ${result.rows[0].id})`
        );
      } catch (error) {
        if (error.code === "23505") {
          console.log(
            `⚠️  Player ${player.name} already exists (phone number conflict)`
          );
        } else {
          console.error(
            `❌ Error creating player ${player.name}:`,
            error.message
          );
        }
      }
    }

    // Create Team A (11 players)
    console.log("\n🏆 Creating Team A with 11 players...");
    let teamAResult;
    try {
      teamAResult = await pool.query(`
        INSERT INTO teams (name, team_size, max_members, is_recruiting, is_active, created_at)
        VALUES ('Thunder Strikers FC', 11, 11, false, true, NOW())
        RETURNING id, name
      `);
      console.log(
        `✅ Created team: ${teamAResult.rows[0].name} (ID: ${teamAResult.rows[0].id})`
      );
    } catch (error) {
      if (error.code === "23505") {
        // Team name already exists, get the existing team
        teamAResult = await pool.query(
          `SELECT id, name FROM teams WHERE name = 'Thunder Strikers FC'`
        );
        console.log(
          `⚠️  Team already exists: ${teamAResult.rows[0].name} (ID: ${teamAResult.rows[0].id})`
        );
      } else {
        throw error;
      }
    }

    // Create Team B (15 players)
    console.log("\n🏆 Creating Team B with 15 players...");
    let teamBResult;
    try {
      teamBResult = await pool.query(`
        INSERT INTO teams (name, team_size, max_members, is_recruiting, is_active, created_at)
        VALUES ('Lightning Bolts United', 15, 15, false, true, NOW())
        RETURNING id, name
      `);
      console.log(
        `✅ Created team: ${teamBResult.rows[0].name} (ID: ${teamBResult.rows[0].id})`
      );
    } catch (error) {
      if (error.code === "23505") {
        // Team name already exists, get the existing team
        teamBResult = await pool.query(
          `SELECT id, name FROM teams WHERE name = 'Lightning Bolts United'`
        );
        console.log(
          `⚠️  Team already exists: ${teamBResult.rows[0].name} (ID: ${teamBResult.rows[0].id})`
        );
      } else {
        throw error;
      }
    }

    const teamA = teamAResult.rows[0];
    const teamB = teamBResult.rows[0];

    // Add players to teams
    console.log("\n👥 Adding players to teams...");

    // Get the player IDs we just created (or existing ones)
    const allPlayersResult = await pool.query(
      `
      SELECT id, name FROM players 
      WHERE name = ANY($1)
      ORDER BY name
    `,
      [newPlayers.map((p) => p.name)]
    );

    const teamAPlayers = allPlayersResult.rows.slice(0, 11);
    const teamBPlayers = allPlayersResult.rows.slice(11, 26);

    // Add players to Team A
    console.log(
      `\n👥 Adding ${teamAPlayers.length} players to ${teamA.name}...`
    );
    for (let i = 0; i < teamAPlayers.length; i++) {
      const player = teamAPlayers[i];
      const isCaptain = i === 0; // First player is captain

      try {
        await pool.query(
          `
          INSERT INTO team_members (team_id, player_id, is_captain, joined_at)
          VALUES ($1, $2, $3, NOW())
        `,
          [teamA.id, player.id, isCaptain]
        );

        console.log(
          `✅ Added ${player.name} to ${teamA.name}${
            isCaptain ? " (Captain)" : ""
          }`
        );
      } catch (error) {
        if (error.code === "23505") {
          console.log(`⚠️  ${player.name} already in ${teamA.name}`);
        } else {
          console.error(
            `❌ Error adding ${player.name} to team:`,
            error.message
          );
        }
      }
    }

    // Add players to Team B
    console.log(
      `\n👥 Adding ${teamBPlayers.length} players to ${teamB.name}...`
    );
    for (let i = 0; i < teamBPlayers.length; i++) {
      const player = teamBPlayers[i];
      const isCaptain = i === 0; // First player is captain

      try {
        await pool.query(
          `
          INSERT INTO team_members (team_id, player_id, is_captain, joined_at)
          VALUES ($1, $2, $3, NOW())
        `,
          [teamB.id, player.id, isCaptain]
        );

        console.log(
          `✅ Added ${player.name} to ${teamB.name}${
            isCaptain ? " (Captain)" : ""
          }`
        );
      } catch (error) {
        if (error.code === "23505") {
          console.log(`⚠️  ${player.name} already in ${teamB.name}`);
        } else {
          console.error(
            `❌ Error adding ${player.name} to team:`,
            error.message
          );
        }
      }
    }

    // Verify the final setup
    console.log("\n📊 FINAL TEAM SETUP:");

    const teamAMembersResult = await pool.query(
      `
      SELECT p.name, tm.is_captain
      FROM team_members tm
      JOIN players p ON tm.player_id = p.id
      WHERE tm.team_id = $1
      ORDER BY tm.is_captain DESC, p.name
    `,
      [teamA.id]
    );

    const teamBMembersResult = await pool.query(
      `
      SELECT p.name, tm.is_captain
      FROM team_members tm
      JOIN players p ON tm.player_id = p.id
      WHERE tm.team_id = $1
      ORDER BY tm.is_captain DESC, p.name
    `,
      [teamB.id]
    );

    console.log(
      `\n🏆 ${teamA.name} (${teamAMembersResult.rows.length} players):`
    );
    teamAMembersResult.rows.forEach((member, index) => {
      console.log(
        `  ${index + 1}. ${member.name}${member.is_captain ? " (Captain)" : ""}`
      );
    });

    console.log(
      `\n🏆 ${teamB.name} (${teamBMembersResult.rows.length} players):`
    );
    teamBMembersResult.rows.forEach((member, index) => {
      console.log(
        `  ${index + 1}. ${member.name}${member.is_captain ? " (Captain)" : ""}`
      );
    });

    console.log(`\n✅ SETUP COMPLETE!`);
    console.log(
      `📝 You can now create a team competition and test the 11+ player selection feature.`
    );
    console.log(`📝 Team A has exactly 11 players, Team B has 15 players.`);
    console.log(
      `📝 Both teams should require you to select exactly 11 active players for competition.`
    );
  } catch (error) {
    console.error("❌ Error creating large teams:", error);
  } finally {
    await pool.end();
  }
}

createLargeTeams();
