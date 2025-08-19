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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEditableContent = exports.updateContent = exports.getContentBySection = void 0;
const db_1 = require("../config/db");
// Get content by section
const getContentBySection = (section) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const query = `
      SELECT content_key, content_value 
      FROM site_content 
      WHERE section = $1
    `;
        const result = yield db_1.pool.query(query, [section]);
        const content = {};
        result.rows.forEach((row) => {
            content[row.content_key] = row.content_value;
        });
        return content;
    }
    catch (error) {
        console.error(`Error fetching content for section ${section}:`, error);
        return {};
    }
});
exports.getContentBySection = getContentBySection;
// Update content
const updateContent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { section, updates } = req.body;
        if (!section || !updates || typeof updates !== "object") {
            res.status(400).json({ success: false, message: "Invalid request data" });
            return;
        }
        const client = yield db_1.pool.connect();
        try {
            yield client.query("BEGIN");
            for (const [key, value] of Object.entries(updates)) {
                const query = `
          INSERT INTO site_content (section, content_key, content_value, updated_at) 
          VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
          ON CONFLICT (section, content_key) 
          DO UPDATE SET content_value = $3, updated_at = CURRENT_TIMESTAMP
        `;
                yield client.query(query, [section, key, value]);
            }
            yield client.query("COMMIT");
            res.json({ success: true, message: "Content updated successfully" });
        }
        catch (error) {
            yield client.query("ROLLBACK");
            throw error;
        }
        finally {
            client.release();
        }
    }
    catch (error) {
        console.error("Error updating content:", error);
        res
            .status(500)
            .json({ success: false, message: "Failed to update content" });
    }
});
exports.updateContent = updateContent;
// Get editable content for admin panel
const getEditableContent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { section } = req.params;
        const content = yield (0, exports.getContentBySection)(section);
        res.json({ success: true, content });
    }
    catch (error) {
        console.error("Error fetching editable content:", error);
        res
            .status(500)
            .json({ success: false, message: "Failed to fetch content" });
    }
});
exports.getEditableContent = getEditableContent;
