import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/AppError.js";

function sanitizeUser(user) {
  if (!user) return null;
  const { passwordHash: _, ...rest } = user;
  return rest;
}

export async function listUsers() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  });
  return users.map(sanitizeUser);
}

export async function getUserById(id) {
  const user = await prisma.user.findUnique({ where: { id } });
  return sanitizeUser(user);
}

export async function createUser(data) {
  const email = data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError("Email already registered", 409, "CONFLICT");
  }

  const passwordHash = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: data.name,
      role: data.role,
      status: data.status ?? "ACTIVE",
    },
  });
  return sanitizeUser(user);
}

export async function updateUser(id, data) {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError("User not found", 404, "NOT_FOUND");
  }

  if (data.email && data.email.toLowerCase() !== existing.email) {
    const clash = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
    if (clash) {
      throw new AppError("Email already registered", 409, "CONFLICT");
    }
  }

  const update = {};
  if (data.email) update.email = data.email.toLowerCase();
  if (data.name) update.name = data.name;
  if (data.role) update.role = data.role;
  if (data.status) update.status = data.status;
  if (data.password) {
    update.passwordHash = await bcrypt.hash(data.password, 10);
  }

  const user = await prisma.user.update({
    where: { id },
    data: update,
  });
  return sanitizeUser(user);
}

export async function deleteUser(id) {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError("User not found", 404, "NOT_FOUND");
  }
  await prisma.user.delete({ where: { id } });
}
