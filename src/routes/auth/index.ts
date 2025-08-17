import express from "express";
import {
  getLogin,
  postLogin,
  logout,
  getRegister,
  postRegister,
} from "../../controllers/auth/loginController";
import multer = require("multer");
import path = require("path");
import fs = require("fs");

const router = express.Router();

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
  fileFilter: function (req: any, file: any, cb: any) {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(null, false);
    }
    cb(null, true);
  },
});

// Login routes
router.get("/login", getLogin);
router.post("/login", postLogin);

// Registration routes
router.get("/register", getRegister);
router.post("/register", upload.single("photo"), postRegister);

// Logout route
router.get("/logout", logout);

export default router;
