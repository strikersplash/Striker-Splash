// Simple password hash generator using the existing compiled code
const bcrypt = require("bcryptjs");

async function generateCorrectHash() {
  try {
    const password = "password123";
    const hash = await bcrypt.hash(password, 10);

    console.log('Generated hash for "password123":');
    console.log(hash);

    // Test it
    const isValid = await bcrypt.compare(password, hash);
    console.log("Verification test:", isValid ? "PASSED" : "FAILED");

    // Also test the old wrong hash
    const oldHash =
      "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi";
    const oldTest = await bcrypt.compare(password, oldHash);
    console.log("Old hash test:", oldTest ? "PASSED" : "FAILED");
  } catch (error) {
    console.error("Error:", error);
  }
}

generateCorrectHash();
