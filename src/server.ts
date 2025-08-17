import app from "./app";
import connectDB from "./config/db";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Set port
const PORT = process.env.PORT || 3000;

// Connect to database
connectDB();

// Start server - Teams & Competition module ready
app.listen(PORT, () => {
  console.log(
    `Server running on: http://localhost:${PORT} in ${
      process.env.NODE_ENV || "development"
    } mode`
  );
});
