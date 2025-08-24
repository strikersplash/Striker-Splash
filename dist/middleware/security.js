"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeResponse = sanitizeResponse;
exports.securityHeaders = securityHeaders;
// Remove sensitive data from API responses
function sanitizeResponse(req, res, next) {
    const originalJson = res.json;
    res.json = function (obj) {
        if (obj && typeof obj === "object") {
            // Skip removal for specific cashier endpoints where staff need contact info
            const path = req.path || "";
            // Allow disabling sanitization for targeted debug using query debug_raw=1
            if (req.query.debug_raw === "1") {
                if (process.env.DEBUG_SANITIZE === "true") {
                    console.log("[SANITIZE DEBUG] Bypassing sanitization via debug_raw for path", path);
                }
                return originalJson.call(this, obj);
            }
            // Skip if controller purposely disabled sanitization
            if (res.locals.skipSanitize) {
                if (process.env.DEBUG_SANITIZE === "true") {
                    console.log("[SANITIZE DEBUG] skipSanitize flag active for", path);
                }
                return originalJson.call(this, obj);
            }
            // Allow cashier API endpoints to include player contact/location fields for operational use
            const allowContactFields = path.startsWith("/cashier/api/") || path.startsWith("/referee/api/");
            if (allowContactFields && process.env.DEBUG_SANITIZE === "true") {
                try {
                    const sample = Array.isArray(obj.players)
                        ? obj.players[0]
                        : null;
                    if (sample) {
                        console.log(`[SANITIZE DEBUG] Before sanitize path=${path} keys=${Object.keys(sample)
                            .filter((k) => [
                            "phone",
                            "residence",
                            "city_village",
                            "parent_phone",
                            "email",
                        ].includes(k))
                            .join(",")}`);
                    }
                }
                catch (e) { }
            }
            obj = removeSensitiveData(obj, allowContactFields);
            if (allowContactFields && process.env.DEBUG_SANITIZE === "true") {
                try {
                    const sample = Array.isArray(obj.players)
                        ? obj.players[0]
                        : null;
                    if (sample) {
                        console.log(`[SANITIZE DEBUG] After sanitize path=${path} hasPhone=${"phone" in sample} hasResidence=${"residence" in sample} hasCity=${"city_village" in sample}`);
                    }
                }
                catch (e) { }
            }
        }
        return originalJson.call(this, obj);
    };
    next();
}
function removeSensitiveData(obj, allowContactFields = false) {
    if (Array.isArray(obj)) {
        return obj.map((item) => removeSensitiveData(item, allowContactFields));
    }
    if (obj && typeof obj === "object") {
        const cleaned = Object.assign({}, obj);
        // Remove sensitive fields
        const sensitiveFields = allowContactFields
            ? ["password", "password_hash", "token"] // preserve phone/residence/city for cashier
            : [
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
            cleaned[key] = removeSensitiveData(cleaned[key], allowContactFields);
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
    // Permissions Policy - allow camera for this origin so QR scanner works
    // (Remove experimental / unsupported directives that caused console warnings.)
    // If further tightening needed later, adjust to: camera=(self)
    res.setHeader("Permissions-Policy", "camera=(self)");
    next();
}
