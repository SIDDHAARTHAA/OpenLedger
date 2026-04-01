import type { NextFunction, Response } from "express";
import type { AuthenticateRequest } from "./auth.middleware.js";

type UserRole = "VIEWER" | "ANALYST" | "ADMIN";

export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: AuthenticateRequest, res: Response, next: NextFunction) => {
    const role = req.authUser?.role;

    if (!role) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    next();
  };
};
