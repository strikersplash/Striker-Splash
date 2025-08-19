"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.postRegister = exports.getRegister = exports.postLogin = exports.getLogin = void 0;
const Staff_1 = require("../../models/Staff");
const Player_1 = require("../../models/Player");
const bcrypt = require("bcryptjs");
const db_1 = require("../../config/db");
const app_1 = require("../../app");
// Display login form
const getLogin = (req, res) => {
    res.render("auth/login", { title: "Login" });
};
exports.getLogin = getLogin;
// Process login form
const postLogin = async (req, res) => {
    try {
        const { username, password, userType } = req.body;
        // Validate input
        if (!username || !password) {
            req.flash("error_msg", "Please enter all fields");
            return res.redirect("/auth/login");
        }
        // Staff login
        if (userType === "staff") {
            // Find staff member
            const query = "SELECT * FROM staff WHERE username = $1";
            const { rows } = await Staff_1.default.query(query, [username]);
            const staff = rows[0];
            if (!staff) {
                console.log("Staff not found");
                req.flash("error_msg", "Invalid credentials");
                return res.redirect("/auth/login");
            }
            // Check if staff account is active
            if (staff.active === false) {
                console.log("Staff account is deactivated");
                req.flash("error_msg", "Account has been deactivated. Please contact an administrator.");
                return res.redirect("/auth/login");
            }
            // Verify password
            const isMatch = await bcrypt.compare(password, staff.password_hash);
            if (!isMatch) {
                req.flash("error_msg", "Invalid credentials");
                return res.redirect("/auth/login");
            }
            // Create session
            req.session.user = {
                id: staff.id.toString(),
                username: staff.username,
                name: staff.name,
                role: staff.role,
                type: "staff",
            };
            // Mark session with current server start time
            req.session.serverStartTime = app_1.SERVER_START_TIME;
            req.flash("success_msg", `Welcome back, ${staff.name}`);
            // Check if there's a return URL stored in the session
            if (req.session.returnTo) {
                const returnTo = req.session.returnTo;
                delete req.session.returnTo;
                return res.redirect(returnTo);
            }
            // Redirect based on role
            if (staff.role === "admin") {
                res.redirect("/admin/dashboard");
            }
            else if (staff.role === "sales") {
                res.redirect("/cashier/interface");
            }
            else {
                res.redirect("/staff/interface");
            }
        }
        // Player login
        else {
            // Find player by phone (used as username) - exclude deleted players
            const query = "SELECT * FROM players WHERE phone = $1 AND deleted_at IS NULL";
            const { rows } = await Player_1.default.query(query, [username]);
            const player = rows[0];
            if (!player || !player.password_hash) {
                req.flash("error_msg", "Invalid credentials or account no longer active");
                return res.redirect("/auth/login");
            }
            // Verify password
            const isMatch = await bcrypt.compare(password, player.password_hash);
            if (!isMatch) {
                req.flash("error_msg", "Invalid credentials");
                return res.redirect("/auth/login");
            }
            // Create session with valid ID
            req.session.user = {
                id: player.id.toString(),
                name: player.name,
                role: "player",
                type: "player",
            };
            // Mark session with current server start time
            req.session.serverStartTime = app_1.SERVER_START_TIME;
            req.flash("success_msg", `Welcome back, ${player.name}`);
            res.redirect("/player/dashboard");
        }
    }
    catch (error) {
        console.error("Login error:", error);
        req.flash("error_msg", "An error occurred during login");
        res.redirect("/auth/login");
    }
};
exports.postLogin = postLogin;
// Display registration form
const getRegister = (req, res) => {
    res.render("auth/register", { title: "Register" });
};
exports.getRegister = getRegister;
// Process registration form
const postRegister = async (req, res) => {
    try {
        const { name, countryCode, phone, email, gender, dob, district, cityVillage, password, isChildAccount, } = req.body;
        // Combine country code and phone number
        const fullPhoneNumber = countryCode && phone ? `${countryCode}${phone}` : phone;
        // Validate input
        if (!name ||
            !countryCode ||
            !phone ||
            !dob ||
            !district ||
            !cityVillage ||
            !password) {
            req.flash("error_msg", "Please fill in all required fields");
            return res.redirect("/auth/register");
        }
        // Handle child registration logic
        const isChild = isChildAccount === "on" || isChildAccount === true;
        let actualPhone = fullPhoneNumber;
        let parentPhone = null;
        if (isChild) {
            // For child accounts, the phone entered is the parent's phone
            parentPhone = fullPhoneNumber;
            // Generate a unique phone identifier for the child
            // Check how many children this parent already has
            const existingChildren = await db_1.pool.query("SELECT COUNT(*) as count FROM players WHERE parent_phone = $1", [parentPhone]);
            const childNumber = parseInt(existingChildren.rows[0].count) + 1;
            actualPhone = `${parentPhone}-C${childNumber}`;
        }
        // Check if player already exists (including deleted players to prevent conflicts)
        const existingPlayerQuery = "SELECT * FROM players WHERE phone = $1";
        const existingPlayerResult = await db_1.pool.query(existingPlayerQuery, [
            actualPhone,
        ]);
        const existingPlayer = existingPlayerResult.rows[0];
        if (existingPlayer) {
            if (existingPlayer.deleted_at) {
                // Player exists but is deleted - offer restoration option
                req.flash("error_msg", `This phone number was previously registered to ${existingPlayer.name} but the account was deleted. Please contact staff to restore your account or use a different phone number.`);
            }
            else if (isChild) {
                req.flash("error_msg", "A child account with this parent phone already exists. Please contact staff for assistance.");
            }
            else {
                req.flash("error_msg", "Phone number already registered");
            }
            return res.redirect("/auth/register");
        }
        // Generate QR hash
        const qrHash = require("crypto").randomBytes(16).toString("hex");
        // Prepare player data
        const playerData = {
            name,
            phone: actualPhone,
            email: email || null,
            gender: gender || null,
            dob,
            residence: district,
            city_village: cityVillage,
            qr_hash: qrHash,
            age_group: calculateAgeGroup(new Date(dob)),
            password_hash: password,
            is_child_account: isChild,
            parent_phone: parentPhone,
        };
        // Add photo path if file was uploaded
        if (req.file) {
            playerData.photo_path = "/uploads/" + req.file.filename;
        }
        // Create new player
        const player = await Player_1.default.create(playerData);
        if (!player) {
            req.flash("error_msg", "Failed to create account");
            return res.redirect("/auth/register");
        }
        // Insert upload record if photo was uploaded
        if (req.file) {
            try {
                await db_1.pool.query("INSERT INTO uploads (player_id, filename, filepath, mimetype, size) VALUES ($1, $2, $3, $4, $5)", [
                    player.id,
                    req.file.filename,
                    playerData.photo_path,
                    req.file.mimetype,
                    req.file.size,
                ]);
            }
            catch (uploadError) {
                console.error("Error recording upload:", uploadError);
                // Continue anyway - the photo is saved, just not tracked in uploads table
            }
        }
        req.flash("success_msg", "Account created successfully. You can now log in.");
        res.redirect("/auth/login");
    }
    catch (error) {
        console.error("Registration error:", error);
        req.flash("error_msg", "An error occurred during registration");
        res.redirect("/auth/register");
    }
};
exports.postRegister = postRegister;
// Logout
const logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Logout error:", err);
        }
        res.redirect("/auth/login");
    });
};
exports.logout = logout;
// Helper function to calculate age group
function calculateAgeGroup(dob) {
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
    }
    if (age <= 10) {
        return "Up to 10 years";
    }
    else if (age <= 17) {
        return "Teens 11-17 years";
    }
    else if (age <= 30) {
        return "Young Adults 18-30 years";
    }
    else if (age <= 50) {
        return "Adults 31-50 years";
    }
    else {
        return "Seniors 51+ years";
    }
}
