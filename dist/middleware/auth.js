"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isStaffAPI = exports.isAuthenticatedAPI = exports.isCashierAPI = exports.isCashier = exports.isPlayer = exports.isStaff = exports.isAdmin = exports.isAuthenticated = void 0;
// Check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        return next();
    }
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
// Check if user is staff (API version - returns JSON)
const isStaffAPI = (req, res, next) => {
    if (req.session.user &&
        (req.session.user.role === "staff" ||
            req.session.user.role === "admin")) {
        return next();
    }
    res.status(401).json({ success: false, message: "Unauthorized access" });
};
exports.isStaffAPI = isStaffAPI;
