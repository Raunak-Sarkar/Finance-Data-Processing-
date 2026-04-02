import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Admin123!", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      passwordHash,
      name: "Admin User",
      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  const analyst = await prisma.user.upsert({
    where: { email: "analyst@example.com" },
    update: {},
    create: {
      email: "analyst@example.com",
      passwordHash: await bcrypt.hash("Analyst123!", 10),
      name: "Analyst User",
      role: "ANALYST",
      status: "ACTIVE",
    },
  });

  const viewer = await prisma.user.upsert({
    where: { email: "viewer@example.com" },
    update: {},
    create: {
      email: "viewer@example.com",
      passwordHash: await bcrypt.hash("Viewer123!", 10),
      name: "Viewer User",
      role: "VIEWER",
      status: "ACTIVE",
    },
  });

  const count = await prisma.financialRecord.count();
  if (count === 0) {
    const base = [
      { amount: 5000, type: "INCOME", category: "Salary", daysAgo: 5 },
      { amount: 120, type: "EXPENSE", category: "Utilities", daysAgo: 4 },
      { amount: 45, type: "EXPENSE", category: "Food", daysAgo: 3 },
      { amount: 200, type: "INCOME", category: "Freelance", daysAgo: 2 },
      { amount: 80, type: "EXPENSE", category: "Food", daysAgo: 1 },
    ];

    for (const row of base) {
      const date = new Date();
      date.setDate(date.getDate() - row.daysAgo);
      await prisma.financialRecord.create({
        data: {
          amount: row.amount,
          type: row.type,
          category: row.category,
          date,
          notes: "Seed data",
          createdById: admin.id,
        },
      });
    }
  }

  console.log("Seed OK:", { admin: admin.email, analyst: analyst.email, viewer: viewer.email });
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
