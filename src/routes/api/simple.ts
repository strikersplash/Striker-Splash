// Simplified API routes for debugging
import express from "express";

const router = express.Router();

// Simple test route
router.get("/test", (req, res) => {
  console.log("Test route hit!");
  res.json({ message: "API working!" });
});

export default router;
