"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.postNameChange = exports.postProfileEdit = exports.getNameChangeInterface = void 0;
const Player_1 = __importDefault(require("../../models/Player"));
const db_1 = require("../../config/db");
// Display name change interface
const getNameChangeInterface = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Only allow staff to access this page
        if (!req.session.user ||
            (req.session.user.role !== "admin" &&
                req.session.user.role !== "staff")) {
            req.flash("error_msg", "Unauthorized access");
            return res.redirect("/auth/login");
        }
        // Get search query
        const { search } = req.query;
        // Get players if search query provided
        let players = [];
        if (search) {
            players = yield Player_1.default.search(search);
        }
        res.render("staff/name-change", {
            title: "Edit User Profile",
            players,
            search: search || "",
        });
    }
    catch (error) {
        console.error("Edit profile interface error:", error);
        req.flash("error_msg", "An error occurred while loading the edit profile interface");
        res.redirect("/staff/dashboard");
    }
});
exports.getNameChangeInterface = getNameChangeInterface;
// Process full profile edit
const postProfileEdit = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Only allow staff to access this API
        if (!req.session.user ||
            (req.session.user.role !== "admin" &&
                req.session.user.role !== "staff")) {
            res.status(401).json({ success: false, message: "Unauthorized access" });
            return;
        }
        const { playerId, name, phone, email, district, cityVillage, ageGroup, gender, } = req.body;
        // Validate input
        if (!playerId || !name || !phone || !district || !cityVillage) {
            res.status(400).json({
                success: false,
                message: "Player ID, name, phone, district, and city/village are required",
            });
            return;
        }
        // Find player
        const player = yield Player_1.default.findById(parseInt(playerId));
        if (!player) {
            res.status(404).json({ success: false, message: "Player not found" });
            return;
        }
        // Check if name is being changed and if changes are allowed
        let nameChangeCount = player.name_change_count || 0;
        let updateData = {
            phone,
            email: email || null,
            residence: district,
            city_village: cityVillage,
            age_group: ageGroup,
            gender: gender || null,
        };
        // Only update name if it's actually changed
        if (name !== player.name) {
            if (nameChangeCount >= 2) {
                res.status(400).json({
                    success: false,
                    message: "Player name has already been changed twice and cannot be changed again",
                });
                return;
            }
            updateData.name = name;
            updateData.name_change_count = nameChangeCount + 1;
        }
        // Add photo path if file was uploaded
        if (req.file) {
            console.log("File uploaded:", {
                filename: req.file.filename,
                size: req.file.size,
                mimetype: req.file.mimetype,
                destination: req.file.destination,
                path: req.file.path,
            });
            // Store the full relative path to avoid path resolution issues
            updateData.photo_path = "/uploads/" + req.file.filename;
            // Enhanced file verification
            const fs = require("fs");
            // Use the actual destination directory that multer used
            const fullPath = req.file.path; // This is the full path where multer saved the file
            console.log("Photo upload verification:");
            console.log("- Original filename:", req.file.originalname);
            console.log("- Saved filename:", req.file.filename);
            console.log("- Multer destination:", req.file.destination);
            console.log("- Full path (from multer):", fullPath);
            if (fs.existsSync(fullPath)) {
                const stats = fs.statSync(fullPath);
                console.log("File verification successful:");
                console.log("- File size on disk:", stats.size, "bytes");
                console.log("- File modified time:", stats.mtime);
                // Double-check the file is readable
                try {
                    fs.accessSync(fullPath, fs.constants.R_OK);
                    console.log("- File is readable: YES");
                }
                catch (accessError) {
                    console.error("- File is readable: NO", accessError);
                }
            }
            else {
                console.error("File upload failed: File not found at", fullPath);
                res.status(500).json({
                    success: false,
                    message: "File upload failed - file not saved properly",
                });
                return;
            }
        }
        else {
            console.log("No file uploaded in this request");
        }
        // Update player
        const updatedPlayer = yield Player_1.default.update(player.id, updateData);
        if (!updatedPlayer) {
            res
                .status(500)
                .json({ success: false, message: "Failed to update player profile" });
            return;
        }
        // Insert upload record if photo was uploaded
        if (req.file) {
            try {
                yield db_1.pool.query("INSERT INTO uploads (player_id, filename, filepath, mimetype, size) VALUES ($1, $2, $3, $4, $5)", [
                    player.id,
                    req.file.filename,
                    updateData.photo_path,
                    req.file.mimetype,
                    req.file.size,
                ]);
            }
            catch (uploadError) {
                console.error("Error recording upload:", uploadError);
                // Continue anyway - the photo is saved, just not tracked in uploads table
            }
        }
        if (!updatedPlayer) {
            res
                .status(500)
                .json({ success: false, message: "Failed to update player profile" });
            return;
        }
        const remainingChanges = 2 - (updatedPlayer.name_change_count || 0);
        // Add specific message if photo was uploaded
        const message = req.file
            ? "Player profile updated successfully with new profile picture"
            : "Player profile updated successfully";
        res.json({
            success: true,
            message,
            player: updatedPlayer,
            remainingChanges,
            photoUploaded: !!req.file,
            photoPath: req.file ? updateData.photo_path : null,
            timestamp: new Date().getTime(), // Add timestamp for client-side cache busting
            playerId: player.id, // Include player ID for reference
        });
    }
    catch (error) {
        console.error("Profile edit error:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while updating the profile",
        });
    }
});
exports.postProfileEdit = postProfileEdit;
// Process name change
const postNameChange = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Only allow staff to access this API
        if (!req.session.user ||
            (req.session.user.role !== "admin" &&
                req.session.user.role !== "staff")) {
            res.status(401).json({ success: false, message: "Unauthorized access" });
            return;
        }
        const { playerId, name } = req.body;
        // Validate input
        if (!playerId || !name) {
            res
                .status(400)
                .json({ success: false, message: "Player ID and name are required" });
            return;
        }
        // Find player
        const player = yield Player_1.default.findById(parseInt(playerId));
        if (!player) {
            res.status(404).json({ success: false, message: "Player not found" });
            return;
        }
        // Check if name change count is already at 2
        const nameChangeCount = player.name_change_count || 0;
        if (nameChangeCount >= 2) {
            res.status(400).json({
                success: false,
                message: "Player name has already been changed twice and cannot be changed again",
            });
            return;
        }
        // Update player name and increment change count
        const updatedPlayer = yield Player_1.default.update(player.id, {
            name,
            name_locked: nameChangeCount === 1, // Lock after second change
            name_change_count: nameChangeCount + 1,
        });
        if (!updatedPlayer) {
            res
                .status(500)
                .json({ success: false, message: "Failed to update player name" });
            return;
        }
        res.json({
            success: true,
            player: updatedPlayer,
            remainingChanges: 2 - (nameChangeCount + 1),
        });
    }
    catch (error) {
        console.error("Update player name error:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while updating player name",
        });
    }
});
exports.postNameChange = postNameChange;
