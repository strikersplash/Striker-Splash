const { pool } = require("./dist/config/db");

async function checkAdminUsers() {
  try {
    console.log("Checking for admin users...");

    const query =
      "SELECT id, email, role FROM users WHERE role = 'admin' LIMIT 5";
    const result = await pool.query(query);

    if (result.rows.length === 0) {
      console.log("No admin users found. Checking all user roles...");
      const allUsersQuery = "SELECT id, email, role FROM users LIMIT 10";
      const allUsers = await pool.query(allUsersQuery);

      console.log("Available users:");
      allUsers.rows.forEach((user) => {
        console.log(
          `- ID: ${user.id}, Email: ${user.email}, Role: ${user.role}`
        );
      });
    } else {
      console.log("Admin users found:");
      result.rows.forEach((user) => {
        console.log(
          `- ID: ${user.id}, Email: ${user.email}, Role: ${user.role}`
        );
      });
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    process.exit(0);
  }
}

checkAdminUsers();
