import { Request, Response, NextFunction } from "express";

// Check if user is authenticated
export const isAuthenticated = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if ((req.session as any).user) {
    return next();
  }
  req.flash("error_msg", "Please log in to access this page");
  res.redirect("/auth/login");
};

// Check if user is admin
export const isAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
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
      (req.session as any).user.role === "admin" ||
      (req.session as any).user.role === "sales")
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

// Check if user is staff (API version - returns JSON)
export const isStaffAPI = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (
    (req.session as any).user &&
    ((req.session as any).user.role === "staff" ||
      (req.session as any).user.role === "admin" ||
      (req.session as any).user.role === "sales")
  ) {
    return next();
  }
  res.status(401).json({ success: false, message: "Unauthorized access" });
};
