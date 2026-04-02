import { AppError } from "../utils/AppError.js";

const ROLE_ORDER = { VIEWER: 0, ANALYST: 1, ADMIN: 2 };

/**
 * Require minimum role level (VIEWER < ANALYST < ADMIN).
 */
export function requireRole(...allowedRoles) {
  const set = new Set(allowedRoles);
  return (req, _res, next) => {
    if (!req.user) {
      return next(new AppError("Unauthorized", 401, "UNAUTHORIZED"));
    }
    if (!set.has(req.user.role)) {
      return next(
        new AppError("Insufficient permissions for this action", 403, "FORBIDDEN")
      );
    }
    return next();
  };
}

export function requireMinRole(minRole) {
  const min = ROLE_ORDER[minRole];
  return (req, _res, next) => {
    if (!req.user) {
      return next(new AppError("Unauthorized", 401, "UNAUTHORIZED"));
    }
    if (ROLE_ORDER[req.user.role] < min) {
      return next(
        new AppError("Insufficient permissions for this action", 403, "FORBIDDEN")
      );
    }
    return next();
  };
}
