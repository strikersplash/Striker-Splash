import express from "express";
import fs from "fs";
import path from "path";
import { Request, Response } from "express";

const router = express.Router();

router.get("/debug-images", async (req: Request, res: Response) => {
  try {
    const uploadsDir = path.join(__dirname, "../../public/uploads");

    // Get a list of files in the uploads directory
    const files = fs.readdirSync(uploadsDir).slice(0, 10); // Get first 10 files

    res.render("debug-images", {
      uploadFiles: files,
    });
  } catch (error) {
    console.error("Debug route error:", error);
    res.status(500).send("Error in debug route");
  }
});

export default router;
