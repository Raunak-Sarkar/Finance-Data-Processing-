import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/AppError.js";

function baseWhere(filters) {
  const where = { deletedAt: null };
  if (filters.type) where.type = filters.type;
  if (filters.category) where.category = filters.category;
  if (filters.from || filters.to) {
    where.date = {};
    if (filters.from) where.date.gte = filters.from;
    if (filters.to) where.date.lte = filters.to;
  }
  if (filters.search) {
    where.OR = [
      { notes: { contains: filters.search } },
      { category: { contains: filters.search } },
    ];
  }
  return where;
}

export async function listRecords(query) {
  const { page, pageSize, ...filters } = query;
  const where = baseWhere(filters);

  const [items, total] = await Promise.all([
    prisma.financialRecord.findMany({
      where,
      orderBy: { date: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.financialRecord.count({ where }),
  ]);

  return {
    items: items.map(serializeRecord),
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize) || 1,
  };
}

export async function getRecordById(id) {
  const record = await prisma.financialRecord.findFirst({
    where: { id, deletedAt: null },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });
  if (!record) {
    throw new AppError("Record not found", 404, "NOT_FOUND");
  }
  return serializeRecord(record);
}

export async function createRecord(data, createdById) {
  const record = await prisma.financialRecord.create({
    data: {
      amount: new Prisma.Decimal(data.amount),
      type: data.type,
      category: data.category,
      date: data.date,
      notes: data.notes ?? null,
      createdById,
    },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });
  return serializeRecord(record);
}

export async function updateRecord(id, data) {
  const existing = await prisma.financialRecord.findFirst({
    where: { id, deletedAt: null },
  });
  if (!existing) {
    throw new AppError("Record not found", 404, "NOT_FOUND");
  }

  const update = {};
  if (data.amount !== undefined) update.amount = new Prisma.Decimal(data.amount);
  if (data.type) update.type = data.type;
  if (data.category) update.category = data.category;
  if (data.date) update.date = data.date;
  if (data.notes !== undefined) update.notes = data.notes;

  const record = await prisma.financialRecord.update({
    where: { id },
    data: update,
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });
  return serializeRecord(record);
}

export async function softDeleteRecord(id) {
  const existing = await prisma.financialRecord.findFirst({
    where: { id, deletedAt: null },
  });
  if (!existing) {
    throw new AppError("Record not found", 404, "NOT_FOUND");
  }
  await prisma.financialRecord.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

function serializeRecord(record) {
  return {
    ...record,
    amount: Number(record.amount),
  };
}
