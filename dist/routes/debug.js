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
const express_1 = __importDefault(require("express"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const router = express_1.default.Router();
router.get("/debug-images", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
}));
exports.default = router;
