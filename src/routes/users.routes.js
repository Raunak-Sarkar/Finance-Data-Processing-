import { Router } from "express";
import * as usersService from "../services/users.service.js";
import { authenticate } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { validateBody, validateParams } from "../middleware/validate.js";
import {
  createUserSchema,
  updateUserSchema,
  userIdParamSchema,
} from "../validators/schemas.js";

const router = Router();

router.use(authenticate, requireRole("ADMIN"));

router.get("/", async (_req, res, next) => {
  try {
    const users = await usersService.listUsers();
    res.json({ users });
  } catch (e) {
    next(e);
  }
});

router.post("/", validateBody(createUserSchema), async (req, res, next) => {
  try {
    const user = await usersService.createUser(req.body);
    res.status(201).json({ user });
  } catch (e) {
    next(e);
  }
});

router.get("/:id", validateParams(userIdParamSchema), async (req, res, next) => {
  try {
    const user = await usersService.getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found", code: "NOT_FOUND" });
    }
    res.json({ user });
  } catch (e) {
    next(e);
  }
});

router.patch("/:id", validateParams(userIdParamSchema), validateBody(updateUserSchema), async (req, res, next) => {
  try {
    const user = await usersService.updateUser(req.params.id, req.body);
    res.json({ user });
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", validateParams(userIdParamSchema), async (req, res, next) => {
  try {
    await usersService.deleteUser(req.params.id);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

export default router;
