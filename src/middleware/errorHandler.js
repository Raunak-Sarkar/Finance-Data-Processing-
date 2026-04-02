import { ZodError } from "zod";
import { AppError } from "../utils/AppError.js";

export function errorHandler(err, _req, res, _next) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Validation failed",
      code: "VALIDATION_ERROR",
      details: err.flatten(),
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
    });
  }

  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ error: "Invalid token", code: "INVALID_TOKEN" });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({ error: "Token expired", code: "TOKEN_EXPIRED" });
  }

  console.error(err);
  return res.status(500).json({
    error: "Internal server error",
    code: "INTERNAL_ERROR",
  });
}
