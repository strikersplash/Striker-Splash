const { pool } = require("./dist/config/db");

async function checkTables() {
  try {
    console.log("Checking available tables...");

    const query = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    const result = await pool.query(query);

    console.log("Available tables:");
    result.rows.forEach((row) => {
      console.log(`- ${row.table_name}`);
    });

    // Check for staff table which might be the admin table
    const staffQuery =
      "SELECT id, email, role FROM staff WHERE role = 'admin' LIMIT 5";
    try {
      const staffResult = await pool.query(staffQuery);
      console.log("\nAdmin staff found:");
      staffResult.rows.forEach((user) => {
        console.log(
          `- ID: ${user.id}, Email: ${user.email}, Role: ${user.role}`
        );
      });
    } catch (error) {
      console.log(
        "\nNo admin staff found or staff table structure is different"
      );
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    process.exit(0);
  }
}

checkTables();
