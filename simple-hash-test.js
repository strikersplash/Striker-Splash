console.log("Testing basic password generation...");

try {
  const bcrypt = require("bcryptjs");

  bcrypt.hash("password123", 10, function (err, hash) {
    if (err) {
      console.error("Error generating hash:", err);
    } else {
      console.log('Generated hash for "password123":');
      console.log(hash);

      // Test the hash
      bcrypt.compare("password123", hash, function (err, result) {
        if (err) {
          console.error("Error comparing:", err);
        } else {
          console.log("Hash verification:", result ? "SUCCESS" : "FAILED");
        }
      });
    }
  });
} catch (error) {
  console.error("Error loading bcrypt:", error);
}
