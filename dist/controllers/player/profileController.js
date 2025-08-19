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
exports.postEditProfile = exports.getEditProfile = exports.downloadQRCode = exports.getDashboard = void 0;
const Player_1 = __importDefault(require("../../models/Player"));
const GameStat_1 = __importDefault(require("../../models/GameStat"));
const QueueTicket_1 = __importDefault(require("../../models/QueueTicket"));
const qrService_1 = require("../../services/qrService");
const db_1 = require("../../config/db");
// Display player dashboard
const getDashboard = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { phone } = req.query;
        // If logged in as player, use session data
        if (req.session.user && req.session.user.role === 'player' && !phone) {
            // Make sure we have a valid ID
            const playerId = parseInt(req.session.user.id);
            if (isNaN(playerId)) {
                req.flash('error_msg', 'Invalid player ID');
                return res.redirect('/');
            }
            const player = yield Player_1.default.findById(playerId);
            if (!player) {
                req.flash('error_msg', 'Player not found');
                return res.redirect('/');
            }
            return renderDashboard(req, res, player);
        }
        // Otherwise, use phone parameter
        if (!phone) {
            req.flash('error_msg', 'Phone number is required');
            return res.redirect('/');
        }
        // Find player
        const player = yield Player_1.default.findByPhone(phone);
        if (!player) {
            req.flash('error_msg', 'Player not found');
            return res.redirect('/');
        }
        renderDashboard(req, res, player);
    }
    catch (error) {
        console.error('Dashboard error:', error);
        req.flash('error_msg', 'An error occurred while retrieving player data');
        res.redirect('/');
    }
});
exports.getDashboard = getDashboard;
// Helper function to render dashboard
function renderDashboard(req, res, player) {
    return __awaiter(this, void 0, void 0, function* () {
        // Get player stats
        const stats = yield GameStat_1.default.find({ player_id: player.id });
        // Calculate total goals
        const totalGoals = stats.reduce((sum, stat) => sum + stat.goals, 0);
        // Generate QR code as base64
        const qrCodeBase64 = yield (0, qrService_1.generateQRCode)(player.id, player.qr_hash);
        // Check if player is logged in
        const isLoggedIn = req.session.user &&
            req.session.user.role === 'player' &&
            parseInt(req.session.user.id) === player.id;
        // Get active queue tickets
        const activeTickets = yield QueueTicket_1.default.findActiveByPlayerId(player.id);
        // Get current queue position
        const currentQueuePosition = yield QueueTicket_1.default.getCurrentQueuePosition();
        // Render dashboard
        res.render('player/dashboard', {
            title: 'Player Dashboard',
            player,
            stats,
            totalGoals,
            qrCodeBase64,
            isLoggedIn,
            activeTickets,
            currentQueuePosition,
            kicksBalance: player.kicks_balance || 0
        });
    });
}
// Download QR code
const downloadQRCode = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Find player
        const player = yield Player_1.default.findById(parseInt(id));
        if (!player) {
            req.flash('error_msg', 'Player not found');
            return res.redirect('/');
        }
        // Generate QR code as base64
        const qrCodeBase64 = yield (0, qrService_1.generateQRCode)(player.id, player.qr_hash);
        // Convert base64 to buffer
        const qrBuffer = Buffer.from(qrCodeBase64, 'base64');
        // Set headers
        res.setHeader('Content-Disposition', `attachment; filename="qrcode-${player.id}.png"`);
        res.setHeader('Content-Type', 'image/png');
        // Send file
        res.send(qrBuffer);
    }
    catch (error) {
        console.error('Download QR code error:', error);
        req.flash('error_msg', 'An error occurred while downloading QR code');
        res.redirect('/');
    }
});
exports.downloadQRCode = downloadQRCode;
// Display profile edit form
const getEditProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Only allow logged in players
        if (!req.session.user || req.session.user.role !== 'player') {
            req.flash('error_msg', 'Please log in to edit your profile');
            return res.redirect('/auth/login');
        }
        // Make sure we have a valid ID
        const playerId = parseInt(req.session.user.id);
        if (isNaN(playerId)) {
            req.flash('error_msg', 'Invalid player ID');
            return res.redirect('/');
        }
        // Find player
        const player = yield Player_1.default.findById(playerId);
        if (!player) {
            req.flash('error_msg', 'Player not found');
            return res.redirect('/');
        }
        // Render edit form
        res.render('player/edit-profile', {
            title: 'Edit Profile',
            player
        });
    }
    catch (error) {
        console.error('Edit profile error:', error);
        req.flash('error_msg', 'An error occurred while retrieving player data');
        res.redirect('/');
    }
});
exports.getEditProfile = getEditProfile;
// Process profile edit form
const postEditProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Only allow logged in players
        if (!req.session.user || req.session.user.role !== 'player') {
            req.flash('error_msg', 'Please log in to edit your profile');
            return res.redirect('/auth/login');
        }
        // Make sure we have a valid ID
        const playerId = parseInt(req.session.user.id);
        if (isNaN(playerId)) {
            req.flash('error_msg', 'Invalid player ID');
            return res.redirect('/');
        }
        // Process file upload
        req.fileUpload(req, res, function (err) {
            return __awaiter(this, void 0, void 0, function* () {
                if (err) {
                    req.flash('error_msg', 'Error uploading file: ' + err.message);
                    return res.redirect('/player/edit-profile');
                }
                const { phone, email, residence, password } = req.body;
                // Update player - name is excluded as only staff can change names
                const updateData = {
                    phone,
                    email,
                    residence
                };
                // Only update password if provided
                if (password) {
                    updateData.password_hash = password;
                }
                // Add photo path if file was uploaded
                if (req.file) {
                    updateData.photo_path = '/uploads/' + req.file.filename;
                    // Insert into uploads table
                    yield db_1.pool.query('INSERT INTO uploads (player_id, filename, filepath, mimetype, size) VALUES ($1, $2, $3, $4, $5)', [playerId, req.file.filename, updateData.photo_path, req.file.mimetype, req.file.size]);
                }
                const updatedPlayer = yield Player_1.default.update(playerId, updateData);
                if (!updatedPlayer) {
                    req.flash('error_msg', 'Failed to update profile');
                    return res.redirect('/player/edit-profile');
                }
                req.flash('success_msg', 'Profile updated successfully');
                res.redirect(`/player/dashboard?phone=${updatedPlayer.phone}`);
            });
        });
    }
    catch (error) {
        console.error('Update profile error:', error);
        req.flash('error_msg', 'An error occurred while updating profile');
        res.redirect('/player/edit-profile');
    }
});
exports.postEditProfile = postEditProfile;
