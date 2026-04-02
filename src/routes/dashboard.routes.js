import { Router } from "express";
import * as dashboardService from "../services/dashboard.service.js";
import { authenticate } from "../middleware/auth.js";
import { validateQuery } from "../middleware/validate.js";
import { dashboardQuerySchema } from "../validators/schemas.js";

const router = Router();

router.use(authenticate);

router.get("/summary", validateQuery(dashboardQuerySchema), async (req, res, next) => {
  try {
    const summary = await dashboardService.getSummary(req.query);
    res.json(summary);
  } catch (e) {
    next(e);
  }
});

router.get("/recent", validateQuery(dashboardQuerySchema), async (req, res, next) => {
  try {
    const data = await dashboardService.getRecentActivity(req.query);
    res.json(data);
  } catch (e) {
    next(e);
  }
});

router.get("/trends", validateQuery(dashboardQuerySchema), async (req, res, next) => {
  try {
    const data = await dashboardService.getTrends(req.query);
    res.json(data);
  } catch (e) {
    next(e);
  }
});

export default router;
