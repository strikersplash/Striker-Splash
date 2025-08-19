"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
// Production-safe logging utility
const isProduction = process.env.NODE_ENV === 'production';
const enableDebugLogging = process.env.ENABLE_DEBUG_LOGGING === 'true';
const enableSensitiveLogging = process.env.ENABLE_SENSITIVE_LOGGING === 'true';
class Logger {
    static info(message, data) {
        if (!isProduction || enableDebugLogging) {
            console.log('[INFO]', message, data ? JSON.stringify(data) : '');
        }
    }
    static warn(message, data) {
        console.warn('[WARN]', message, data ? JSON.stringify(data) : '');
    }
    static error(message, error) {
        console.error('[ERROR]', message, (error === null || error === void 0 ? void 0 : error.message) || error);
    }
    static debug(message, data) {
        if (!isProduction && enableDebugLogging) {
            console.log('[DEBUG]', message, data ? JSON.stringify(data) : '');
        }
    }
    static sensitive(message, data) {
        if (!isProduction && enableSensitiveLogging) {
            console.log('[SENSITIVE]', message, data ? JSON.stringify(data) : '');
        }
    }
}
exports.Logger = Logger;
