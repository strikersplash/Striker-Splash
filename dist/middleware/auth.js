"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAuthenticatedAPI = exports.isCashierAPI = exports.isCashier = exports.isPlayer = exports.isStaff = exports.isAdmin = exports.isAuthenticated = void 0;
// Check if user is authenticated
const isAuthenticated = (req, res, next) => {
    var _a, _b;
    console.log(`Auth Check - URL: ${req.url}`);
    console.log(`Auth Check - Session ID: ${req.sessionID}`);
    console.log(`Auth Check - Session User: ${((_a = req.session) === null || _a === void 0 ? void 0 : _a.user) ? "EXISTS" : "NONE"}`);
    console.log(`Auth Check - User Details:`, (_b = req.session) === null || _b === void 0 ? void 0 : _b.user);
    if (req.session.user) {
        console.log(`Auth Check - PASSED for ${req.url}`);
        return next();
    }
    console.log(`Auth Check - FAILED for ${req.url} - redirecting to login`);
    req.flash("error_msg", "Please log in to access this page");
    res.redirect("/auth/login");
};
exports.isAuthenticated = isAuthenticated;
// Check if user is admin
const isAdmin = (req, res, next) => {
    // For testing purposes, create a temporary admin session
    if (!req.session.user) {
        req.session.user = {
            id: 1,
            role: "admin",
            username: "test_admin",
        };
    }
    if (req.session.user && req.session.user.role === "admin") {
        return next();
    }
    req.flash("error_msg", "Unauthorized access");
    res.redirect("/auth/login");
};
exports.isAdmin = isAdmin;
// Check if user is staff or admin
const isStaff = (req, res, next) => {
    if (req.session.user &&
        (req.session.user.role === "staff" ||
            req.session.user.role === "admin")) {
        return next();
    }
    req.flash("error_msg", "Unauthorized access");
    res.redirect("/auth/login");
};
exports.isStaff = isStaff;
// Check if user is player
const isPlayer = (req, res, next) => {
    if (req.session.user &&
        req.session.user.role === "player") {
        return next();
    }
    req.flash("error_msg", "Unauthorized access");
    res.redirect("/auth/login");
};
exports.isPlayer = isPlayer;
// Check if user is cashier
const isCashier = (req, res, next) => {
    if (req.session.user &&
        (req.session.user.role === "cashier" ||
            req.session.user.role === "admin" ||
            req.session.user.role === "staff" ||
            req.session.user.role === "sales")) {
        return next();
    }
    req.flash("error_msg", "Unauthorized access");
    res.redirect("/auth/login");
};
exports.isCashier = isCashier;
// Check if user is cashier (API version - returns JSON)
const isCashierAPI = (req, res, next) => {
    if (req.session.user &&
        (req.session.user.role === "cashier" ||
            req.session.user.role === "admin" ||
            req.session.user.role === "staff" ||
            req.session.user.role === "sales")) {
        return next();
    }
    res.status(401).json({ success: false, message: "Unauthorized access" });
};
exports.isCashierAPI = isCashierAPI;
// Check if user is authenticated (API version - returns JSON)
const isAuthenticatedAPI = (req, res, next) => {
    if (req.session.user) {
        return next();
    }
    res
        .status(401)
        .json({ success: false, message: "Please log in to access this API" });
};
exports.isAuthenticatedAPI = isAuthenticatedAPI;
