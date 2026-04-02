import { z } from "zod";

const roleEnum = z.enum(["VIEWER", "ANALYST", "ADMIN"]);
const statusEnum = z.enum(["ACTIVE", "INACTIVE"]);
const entryTypeEnum = z.enum(["INCOME", "EXPENSE"]);

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1).max(200),
  role: roleEnum,
});

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1).max(200),
  role: roleEnum,
  status: statusEnum.optional(),
});

export const updateUserSchema = z
  .object({
    email: z.string().email().optional(),
    password: z.string().min(8).optional(),
    name: z.string().min(1).max(200).optional(),
    role: roleEnum.optional(),
    status: statusEnum.optional(),
  })
  .refine((o) => Object.keys(o).length > 0, { message: "At least one field required" });

export const userIdParamSchema = z.object({
  id: z.string().min(1),
});

export const createRecordSchema = z.object({
  amount: z.coerce.number().positive("Amount must be positive"),
  type: entryTypeEnum,
  category: z.string().min(1).max(100),
  date: z.coerce.date(),
  notes: z.string().max(2000).optional().nullable(),
});

export const updateRecordSchema = z
  .object({
    amount: z.coerce.number().positive().optional(),
    type: entryTypeEnum.optional(),
    category: z.string().min(1).max(100).optional(),
    date: z.coerce.date().optional(),
    notes: z.string().max(2000).optional().nullable(),
  })
  .refine((o) => Object.keys(o).length > 0, { message: "At least one field required" });

export const recordIdParamSchema = z.object({
  id: z.string().min(1),
});

export const listRecordsQuerySchema = z.object({
  type: entryTypeEnum.optional(),
  category: z.string().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
  search: z.string().max(200).optional(),
});

export const dashboardQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  trend: z.enum(["weekly", "monthly"]).optional().default("monthly"),
});
