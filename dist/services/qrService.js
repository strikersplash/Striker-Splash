"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateQRCode = exports.generateQRHash = void 0;
const qrcode_1 = require("qrcode");
const crypto_1 = require("crypto");
// Generate a unique hash for QR code
const generateQRHash = () => {
    return crypto_1.default.randomBytes(16).toString('hex');
};
exports.generateQRHash = generateQRHash;
// Generate QR code as base64
const generateQRCode = async (playerId, qrHash) => {
    try {
        // QR code data with timestamp for expiration
        const qrData = JSON.stringify({
            playerId,
            hash: qrHash,
            timestamp: Date.now()
        });
        // Generate QR code as base64
        const qrCodeBase64 = await qrcode_1.default.toDataURL(qrData, {
            errorCorrectionLevel: 'H',
            margin: 1,
            width: 300
        });
        // Return just the base64 data without the data:image/png;base64, prefix
        return qrCodeBase64.replace('data:image/png;base64,', '');
    }
    catch (error) {
        console.error('QR code generation error:', error);
        throw new Error('Failed to generate QR code');
    }
};
exports.generateQRCode = generateQRCode;
