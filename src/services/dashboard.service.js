import { prisma } from "../lib/prisma.js";

function rangeWhere(from, to) {
  const where = { deletedAt: null };
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = from;
    if (to) where.date.lte = to;
  }
  return where;
}

export async function getSummary(query) {
  const { from, to } = query;
  const where = rangeWhere(from, to);

  const rows = await prisma.financialRecord.findMany({
    where,
    select: { amount: true, type: true, category: true, date: true, id: true, notes: true },
  });

  let totalIncome = 0;
  let totalExpense = 0;
  const byCategory = {};

  for (const r of rows) {
    const n = Number(r.amount);
    if (r.type === "INCOME") totalIncome += n;
    else totalExpense += n;

    const key = r.category;
    if (!byCategory[key]) {
      byCategory[key] = { category: key, income: 0, expense: 0, net: 0 };
    }
    if (r.type === "INCOME") byCategory[key].income += n;
    else byCategory[key].expense += n;
    byCategory[key].net = byCategory[key].income - byCategory[key].expense;
  }

  const netBalance = totalIncome - totalExpense;

  return {
    period: { from: from ?? null, to: to ?? null },
    totals: {
      totalIncome,
      totalExpense,
      netBalance,
    },
    categoryBreakdown: Object.values(byCategory).sort((a, b) =>
      Math.abs(b.net) - Math.abs(a.net)
    ),
  };
}

export async function getRecentActivity(query) {
  const { from, to } = query;
  const where = rangeWhere(from, to);

  const items = await prisma.financialRecord.findMany({
    where,
    orderBy: { date: "desc" },
    take: 10,
    select: {
      id: true,
      amount: true,
      type: true,
      category: true,
      date: true,
      notes: true,
    },
  });

  return {
    recent: items.map((r) => ({ ...r, amount: Number(r.amount) })),
  };
}

/**
 * Buckets by calendar week start (Monday) or calendar month.
 */
export async function getTrends(query) {
  const { from, to, trend } = query;
  const where = rangeWhere(from, to);

  const rows = await prisma.financialRecord.findMany({
    where,
    select: { amount: true, type: true, date: true },
  });

  const buckets = {};

  for (const r of rows) {
    const d = new Date(r.date);
    let key;
    if (trend === "weekly") {
      const monday = startOfWeekMonday(d);
      key = monday.toISOString().slice(0, 10);
    } else {
      key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    }

    if (!buckets[key]) {
      buckets[key] = { period: key, income: 0, expense: 0, net: 0 };
    }
    const n = Number(r.amount);
    if (r.type === "INCOME") buckets[key].income += n;
    else buckets[key].expense += n;
    buckets[key].net = buckets[key].income - buckets[key].expense;
  }

  const series = Object.values(buckets).sort((a, b) => a.period.localeCompare(b.period));

  return { trend, series };
}

function startOfWeekMonday(d) {
  const x = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = x.getUTCDay();
  const diff = (day + 6) % 7;
  x.setUTCDate(x.getUTCDate() - diff);
  return x;
}
