"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serverError = exports.notFound = void 0;
// Handle 404 errors
const notFound = (req, res) => {
    res.status(404).render('system/error', {
        title: 'Page Not Found',
        code: 404,
        message: 'The page you are looking for does not exist'
    });
};
exports.notFound = notFound;
// Handle 500 errors
const serverError = (err, req, res) => {
    console.error('Server error:', err);
    res.status(500).render('system/error', {
        title: 'Server Error',
        code: 500,
        message: 'Something went wrong on our end'
    });
};
exports.serverError = serverError;
