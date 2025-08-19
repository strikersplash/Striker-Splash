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
exports.generateQRCode = exports.generateQRHash = void 0;
const qrcode_1 = __importDefault(require("qrcode"));
const crypto_1 = __importDefault(require("crypto"));
// Generate a unique hash for QR code
const generateQRHash = () => {
    return crypto_1.default.randomBytes(16).toString('hex');
};
exports.generateQRHash = generateQRHash;
// Generate QR code as base64
const generateQRCode = (playerId, qrHash) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // QR code data with timestamp for expiration
        const qrData = JSON.stringify({
            playerId,
            hash: qrHash,
            timestamp: Date.now()
        });
        // Generate QR code as base64
        const qrCodeBase64 = yield qrcode_1.default.toDataURL(qrData, {
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
});
exports.generateQRCode = generateQRCode;
