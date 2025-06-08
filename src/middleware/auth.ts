import { Request, Response, NextFunction } from 'express';

// Check if user is authenticated
export const isAuthenticated = (req: Request, res: Response, next: NextFunction): void => {
  if (req.session.user) {
    return next();
  }
  req.flash('error_msg', 'Please log in to access this page');
  res.redirect('/auth/login');
};

// Check if user is admin
export const isAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (req.session.user && req.session.user.role === 'admin') {
    return next();
  }
  req.flash('error_msg', 'Unauthorized access');
  res.redirect('/auth/login');
};

// Check if user is staff or admin
export const isStaff = (req: Request, res: Response, next: NextFunction): void => {
  if (req.session.user && (req.session.user.role === 'staff' || req.session.user.role === 'admin')) {
    return next();
  }
  req.flash('error_msg', 'Unauthorized access');
  res.redirect('/auth/login');
};

// Check if user is player
export const isPlayer = (req: Request, res: Response, next: NextFunction): void => {
  if (req.session.user && req.session.user.role === 'player') {
    return next();
  }
  req.flash('error_msg', 'Unauthorized access');
  res.redirect('/auth/login');
};