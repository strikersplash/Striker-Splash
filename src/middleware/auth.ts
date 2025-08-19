import { Request, Response, NextFunction } from "express";

// Check if user is authenticated
export const isAuthenticated = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.log(`Auth Check - URL: ${req.url}`);
  console.log(`Auth Check - Session ID: ${req.sessionID}`);
  console.log(`Auth Check - Session User: ${(req.session as any)?.user ? 'EXISTS' : 'NONE'}`);
  console.log(`Auth Check - User Details:`, (req.session as any)?.user);
  
  if ((req.session as any).user) {
    console.log(`Auth Check - PASSED for ${req.url}`);
    return next();
  }
  
  console.log(`Auth Check - FAILED for ${req.url} - redirecting to login`);
  req.flash("error_msg", "Please log in to access this page");
  res.redirect("/auth/login");
};

// Check if user is admin
export const isAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // For testing purposes, create a temporary admin session
  if (!(req.session as any).user) {
    (req.session as any).user = {
      id: 1,
      role: "admin",
      username: "test_admin",
    };
  }

  if ((req.session as any).user && (req.session as any).user.role === "admin") {
    return next();
  }
  req.flash("error_msg", "Unauthorized access");
  res.redirect("/auth/login");
};

// Check if user is staff or admin
export const isStaff = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (
    (req.session as any).user &&
    ((req.session as any).user.role === "staff" ||
      (req.session as any).user.role === "admin")
  ) {
    return next();
  }
  req.flash("error_msg", "Unauthorized access");
  res.redirect("/auth/login");
};

// Check if user is player
export const isPlayer = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (
    (req.session as any).user &&
    (req.session as any).user.role === "player"
  ) {
    return next();
  }
  req.flash("error_msg", "Unauthorized access");
  res.redirect("/auth/login");
};

// Check if user is cashier
export const isCashier = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (
    (req.session as any).user &&
    ((req.session as any).user.role === "cashier" ||
      (req.session as any).user.role === "admin" ||
      (req.session as any).user.role === "staff" ||
      (req.session as any).user.role === "sales")
  ) {
    return next();
  }
  req.flash("error_msg", "Unauthorized access");
  res.redirect("/auth/login");
};

// Check if user is cashier (API version - returns JSON)
export const isCashierAPI = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (
    (req.session as any).user &&
    ((req.session as any).user.role === "cashier" ||
      (req.session as any).user.role === "admin" ||
      (req.session as any).user.role === "staff" ||
      (req.session as any).user.role === "sales")
  ) {
    return next();
  }
  res.status(401).json({ success: false, message: "Unauthorized access" });
};

// Check if user is authenticated (API version - returns JSON)
export const isAuthenticatedAPI = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if ((req.session as any).user) {
    return next();
  }
  res
    .status(401)
    .json({ success: false, message: "Please log in to access this API" });
};
