"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeResponse = sanitizeResponse;
exports.securityHeaders = securityHeaders;
// Remove sensitive data from API responses
function sanitizeResponse(req, res, next) {
    const originalJson = res.json;
    res.json = function (obj) {
        if (obj && typeof obj === "object") {
            // Recursively remove sensitive fields
            obj = removeSensitiveData(obj);
        }
        return originalJson.call(this, obj);
    };
    next();
}
function removeSensitiveData(obj) {
    if (Array.isArray(obj)) {
        return obj.map((item) => removeSensitiveData(item));
    }
    if (obj && typeof obj === "object") {
        const cleaned = { ...obj };
        // Remove sensitive fields
        const sensitiveFields = [
            "phone",
            "email",
            "parent_phone",
            "residence",
            "city_village",
            "password",
            "password_hash",
            "token",
        ];
        sensitiveFields.forEach((field) => {
            if (field in cleaned) {
                delete cleaned[field];
            }
        });
        // Recursively clean nested objects
        Object.keys(cleaned).forEach((key) => {
            cleaned[key] = removeSensitiveData(cleaned[key]);
        });
        return cleaned;
    }
    return obj;
}
// Add security headers
function securityHeaders(req, res, next) {
    // Prevent information disclosure
    res.setHeader("X-Powered-By", "Striker Splash");
    // Strict Transport Security (HTTPS only)
    if (req.secure || req.headers["x-forwarded-proto"] === "https") {
        res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
    }
    // Content Security Policy - Allow CDN resources
    res.setHeader("Content-Security-Policy", "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com; " +
        "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; " +
        "font-src 'self' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; " +
        "img-src 'self' data: https:; " +
        "connect-src 'self';");
    // Prevent clickjacking
    res.setHeader("X-Frame-Options", "DENY");
    // Prevent MIME type sniffing
    res.setHeader("X-Content-Type-Options", "nosniff");
    // XSS Protection
    res.setHeader("X-XSS-Protection", "1; mode=block");
    // Referrer Policy
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    // Permissions Policy
    res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
    next();
}
