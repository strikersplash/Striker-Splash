"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const fs_1 = require("fs");
const path_1 = require("path");
const router = express_1.default.Router();
router.get("/debug-images", async (req, res) => {
    try {
        const uploadsDir = path_1.default.join(__dirname, "../../public/uploads");
        // Get a list of files in the uploads directory
        const files = fs_1.default.readdirSync(uploadsDir).slice(0, 10); // Get first 10 files
        res.render("debug-images", {
            uploadFiles: files,
        });
    }
    catch (error) {
        console.error("Debug route error:", error);
        res.status(500).send("Error in debug route");
    }
});
exports.default = router;
