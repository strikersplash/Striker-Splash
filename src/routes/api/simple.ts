// Simplified API routes for debugging
import express from "express";

const router = express.Router();

console.log("API Routes module loaded!");

// Simple test route
router.get("/test", (req, res) => {
  console.log("Test route hit!");
  res.json({ message: "API working!" });
});

export default router;
