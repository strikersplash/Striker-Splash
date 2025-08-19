"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const loginController_1 = require("../../controllers/auth/loginController");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const router = express_1.default.Router();
// Create uploads directory if it doesn't exist - use absolute path
const rootDir = path.resolve(__dirname, "../../../");
const uploadsDir = path.join(rootDir, "public/uploads");
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}
// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, uniqueSuffix + ext);
    },
});
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: function (req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            return cb(null, false);
        }
        cb(null, true);
    },
});
// Login routes
router.get("/login", loginController_1.getLogin);
router.post("/login", loginController_1.postLogin);
// Registration routes
router.get("/register", loginController_1.getRegister);
router.post("/register", upload.single("photo"), loginController_1.postRegister);
// Logout route
router.get("/logout", loginController_1.logout);
exports.default = router;
