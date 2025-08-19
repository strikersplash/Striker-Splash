"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Simplified API routes for debugging
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
// Simple test route
router.get("/test", (req, res) => {
    console.log("Test route hit!");
    res.json({ message: "API working!" });
});
exports.default = router;
