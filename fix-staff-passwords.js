const { pool } = require("./dist/config/db");
const bcrypt = require("bcryptjs");

async function fixStaffPasswords() {
  try {
    console.log("Fixing staff passwords...");

    // Get all staff users with plaintext passwords (not starting with $2a$)
    const staffQuery = `
      SELECT id, username, password_hash 
      FROM staff 
      WHERE password_hash IS NOT NULL 
      AND password_hash NOT LIKE '$2a$%'
    `;

    const staffResult = await pool.query(staffQuery);
    console.log(
      `Found ${staffResult.rows.length} staff users with unhashed passwords:`
    );

    for (const staff of staffResult.rows) {
      console.log(`- ${staff.username}: ${staff.password_hash}`);

      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(staff.password_hash, salt);

      // Update the database
      const updateQuery = `
        UPDATE staff 
        SET password_hash = $1 
        WHERE id = $2
      `;

      await pool.query(updateQuery, [hashedPassword, staff.id]);
      console.log(`✅ Fixed password for ${staff.username}`);
    }

    console.log("\n✅ All staff passwords have been properly hashed!");

    // Verify the fix
    const verifyQuery = `
      SELECT username, 
             CASE 
               WHEN password_hash LIKE '$2a$%' THEN 'Properly hashed'
               ELSE 'Plain text' 
             END as status
      FROM staff
    `;

    const verifyResult = await pool.query(verifyQuery);
    console.log("\nVerification - Staff password status:");
    verifyResult.rows.forEach((row) => {
      console.log(`- ${row.username}: ${row.status}`);
    });
  } catch (error) {
    console.error("Error fixing staff passwords:", error);
  } finally {
    process.exit(0);
  }
}

fixStaffPasswords();
