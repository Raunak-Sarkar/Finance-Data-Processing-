import { Router } from "express";
import * as recordsService from "../services/records.service.js";
import { authenticate } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { validateBody, validateParams, validateQuery } from "../middleware/validate.js";
import {
  createRecordSchema,
  listRecordsQuerySchema,
  recordIdParamSchema,
  updateRecordSchema,
} from "../validators/schemas.js";

const router = Router();

const readWrite = [authenticate, requireRole("ANALYST", "ADMIN")];

router.get("/", ...readWrite, validateQuery(listRecordsQuerySchema), async (req, res, next) => {
  try {
    const result = await recordsService.listRecords(req.query);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.get("/:id", ...readWrite, validateParams(recordIdParamSchema), async (req, res, next) => {
  try {
    const record = await recordsService.getRecordById(req.params.id);
    res.json({ record });
  } catch (e) {
    next(e);
  }
});

router.post("/", ...readWrite, validateBody(createRecordSchema), async (req, res, next) => {
  try {
    const record = await recordsService.createRecord(req.body, req.user.id);
    res.status(201).json({ record });
  } catch (e) {
    next(e);
  }
});

router.patch(
  "/:id",
  ...readWrite,
  validateParams(recordIdParamSchema),
  validateBody(updateRecordSchema),
  async (req, res, next) => {
    try {
      const record = await recordsService.updateRecord(req.params.id, req.body);
      res.json({ record });
    } catch (e) {
      next(e);
    }
  }
);

router.delete("/:id", ...readWrite, validateParams(recordIdParamSchema), async (req, res, next) => {
  try {
    await recordsService.softDeleteRecord(req.params.id);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

export default router;
