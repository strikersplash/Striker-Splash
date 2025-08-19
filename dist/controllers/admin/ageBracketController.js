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
exports.deleteAgeBracket = exports.updateAgeBracket = exports.addAgeBracket = exports.getAgeBrackets = void 0;
const db_1 = require("../../config/db");
// Display age bracket management page
const getAgeBrackets = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Only allow admin to access this page
        if (!req.session.user || req.session.user.role !== 'admin') {
            req.flash('error_msg', 'Unauthorized access');
            return res.redirect('/auth/login');
        }
        // Get all age brackets
        const bracketsQuery = `
      SELECT * FROM age_brackets
      ORDER BY min_age
    `;
        const bracketsResult = yield db_1.pool.query(bracketsQuery);
        const ageBrackets = bracketsResult.rows;
        res.render('admin/age-brackets', {
            title: 'Age Brackets',
            ageBrackets
        });
    }
    catch (error) {
        console.error('Age brackets error:', error);
        req.flash('error_msg', 'An error occurred while loading age brackets');
        res.redirect('/admin/dashboard');
    }
});
exports.getAgeBrackets = getAgeBrackets;
// Add age bracket
const addAgeBracket = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Only allow admin to access this API
        if (!req.session.user || req.session.user.role !== 'admin') {
            res.status(401).json({ success: false, message: 'Unauthorized access' });
            return;
        }
        const { name, minAge, maxAge } = req.body;
        // Validate input
        if (!name || minAge === undefined || maxAge === undefined) {
            res.status(400).json({ success: false, message: 'Name, minimum age, and maximum age are required' });
            return;
        }
        // Check for overlapping age ranges
        const overlapQuery = `
      SELECT * FROM age_brackets
      WHERE 
        (min_age <= $1 AND max_age >= $1) OR
        (min_age <= $2 AND max_age >= $2) OR
        (min_age >= $1 AND max_age <= $2)
    `;
        const overlapResult = yield db_1.pool.query(overlapQuery, [minAge, maxAge]);
        if (overlapResult.rows.length > 0) {
            res.status(400).json({ success: false, message: 'Age range overlaps with existing bracket' });
            return;
        }
        // Add new age bracket
        const insertQuery = `
      INSERT INTO age_brackets (name, min_age, max_age, active)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
        const insertResult = yield db_1.pool.query(insertQuery, [name, minAge, maxAge, true]);
        res.json({
            success: true,
            ageBracket: insertResult.rows[0]
        });
    }
    catch (error) {
        console.error('Add age bracket error:', error);
        res.status(500).json({ success: false, message: 'An error occurred while adding age bracket' });
    }
});
exports.addAgeBracket = addAgeBracket;
// Update age bracket
const updateAgeBracket = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Only allow admin to access this API
        if (!req.session.user || req.session.user.role !== 'admin') {
            res.status(401).json({ success: false, message: 'Unauthorized access' });
            return;
        }
        const { id } = req.params;
        const { name, minAge, maxAge, active } = req.body;
        // Validate input
        if (!name || minAge === undefined || maxAge === undefined || active === undefined) {
            res.status(400).json({ success: false, message: 'Name, minimum age, maximum age, and active status are required' });
            return;
        }
        // Check for overlapping age ranges (excluding this bracket)
        const overlapQuery = `
      SELECT * FROM age_brackets
      WHERE 
        id != $1 AND
        (
          (min_age <= $2 AND max_age >= $2) OR
          (min_age <= $3 AND max_age >= $3) OR
          (min_age >= $2 AND max_age <= $3)
        )
    `;
        const overlapResult = yield db_1.pool.query(overlapQuery, [id, minAge, maxAge]);
        if (overlapResult.rows.length > 0) {
            res.status(400).json({ success: false, message: 'Age range overlaps with existing bracket' });
            return;
        }
        // Update age bracket
        const updateQuery = `
      UPDATE age_brackets
      SET name = $1, min_age = $2, max_age = $3, active = $4
      WHERE id = $5
      RETURNING *
    `;
        const updateResult = yield db_1.pool.query(updateQuery, [name, minAge, maxAge, active, id]);
        if (updateResult.rows.length === 0) {
            res.status(404).json({ success: false, message: 'Age bracket not found' });
            return;
        }
        res.json({
            success: true,
            ageBracket: updateResult.rows[0]
        });
    }
    catch (error) {
        console.error('Update age bracket error:', error);
        res.status(500).json({ success: false, message: 'An error occurred while updating age bracket' });
    }
});
exports.updateAgeBracket = updateAgeBracket;
// Delete age bracket
const deleteAgeBracket = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Only allow admin to access this API
        if (!req.session.user || req.session.user.role !== 'admin') {
            res.status(401).json({ success: false, message: 'Unauthorized access' });
            return;
        }
        const { id } = req.params;
        // Check if age bracket is in use
        const usageQuery = `
      SELECT COUNT(*) as count FROM players
      WHERE age_group = (SELECT name FROM age_brackets WHERE id = $1)
    `;
        const usageResult = yield db_1.pool.query(usageQuery, [id]);
        if (parseInt(usageResult.rows[0].count) > 0) {
            res.status(400).json({ success: false, message: 'Cannot delete age bracket that is in use' });
            return;
        }
        // Delete age bracket
        yield db_1.pool.query('DELETE FROM age_brackets WHERE id = $1', [id]);
        res.json({
            success: true,
            message: 'Age bracket deleted successfully'
        });
    }
    catch (error) {
        console.error('Delete age bracket error:', error);
        res.status(500).json({ success: false, message: 'An error occurred while deleting age bracket' });
    }
});
exports.deleteAgeBracket = deleteAgeBracket;
