import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/AppError.js";

export async function authenticate(req, _res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(new AppError("Missing or invalid Authorization header", 401, "UNAUTHORIZED"));
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    const userId = payload.sub;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true, status: true },
    });

    if (!user) {
      return next(new AppError("User not found", 401, "UNAUTHORIZED"));
    }

    if (user.status !== "ACTIVE") {
      return next(new AppError("Account is inactive", 403, "FORBIDDEN"));
    }

    req.user = user;
    return next();
  } catch (e) {
    return next(e);
  }
}
