const { pool } = require("./dist/config/db");

async function createTestNotifications() {
  try {
    // Get the first player from the database
    const playersResult = await pool.query("SELECT id FROM players LIMIT 1");

    if (playersResult.rows.length === 0) {
      console.log("No players found in database");
      return;
    }

    const playerId = playersResult.rows[0].id;
    console.log(`Creating test notifications for player ${playerId}`);

    // Create test notifications
    const notifications = [
      {
        player_id: playerId,
        title: "Welcome!",
        type: "info",
        message:
          "Welcome to Striker Splash! Your profile has been set up successfully.",
        is_read: false,
      },
      {
        player_id: playerId,
        title: "Queue Update",
        type: "success",
        message:
          "You have been added to the queue for Team A practice session.",
        is_read: false,
      },
      {
        player_id: playerId,
        title: "Training Schedule",
        type: "info",
        message: "Team training session scheduled for tomorrow at 3 PM.",
        is_read: true,
      },
      {
        player_id: playerId,
        title: "Achievement Unlocked",
        type: "success",
        message: "Congratulations! You scored 5 goals in the last session.",
        is_read: false,
      },
    ];

    // Insert notifications
    for (const notification of notifications) {
      await pool.query(
        `INSERT INTO notifications (player_id, title, type, message, is_read, created_at) 
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          notification.player_id,
          notification.title,
          notification.type,
          notification.message,
          notification.is_read,
        ]
      );
    }

    console.log(`Created ${notifications.length} test notifications`);

    // Show the notifications
    const result = await pool.query(
      "SELECT * FROM notifications WHERE player_id = $1 ORDER BY created_at DESC",
      [playerId]
    );

    console.log("Current notifications:");
    result.rows.forEach((row, index) => {
      console.log(
        `${index + 1}. [${row.type}] ${row.message} (Read: ${row.is_read})`
      );
    });
  } catch (error) {
    console.error("Error creating test notifications:", error);
  } finally {
    await pool.end();
  }
}

createTestNotifications();
