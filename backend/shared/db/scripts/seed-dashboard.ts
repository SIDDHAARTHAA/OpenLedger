import "dotenv/config";
import db from "../index.js";

const seedNotes = [
  "[seed] April enterprise consulting invoice",
  "[seed] Team lunch and client hospitality",
  "[seed] Retainer payout for analytics audit",
  "[seed] Cloud hosting for dashboard workloads",
  "[seed] Annual support renewal from a key client",
  "[seed] Design tool subscription expense",
  "[seed] Workshop revenue from backend training",
  "[seed] Contractor payout for API documentation",
];

const sampleRecords = [
  {
    amount: 185000n,
    type: "INCOME" as const,
    category: "Consulting",
    entryDate: new Date("2026-01-12T00:00:00.000Z"),
    notes: seedNotes[0],
  },
  {
    amount: 12000n,
    type: "EXPENSE" as const,
    category: "Operations",
    entryDate: new Date("2026-01-18T00:00:00.000Z"),
    notes: seedNotes[1],
  },
  {
    amount: 93000n,
    type: "INCOME" as const,
    category: "Analytics",
    entryDate: new Date("2026-02-04T00:00:00.000Z"),
    notes: seedNotes[2],
  },
  {
    amount: 21000n,
    type: "EXPENSE" as const,
    category: "Infrastructure",
    entryDate: new Date("2026-02-15T00:00:00.000Z"),
    notes: seedNotes[3],
  },
  {
    amount: 142000n,
    type: "INCOME" as const,
    category: "Support",
    entryDate: new Date("2026-03-07T00:00:00.000Z"),
    notes: seedNotes[4],
  },
  {
    amount: 8000n,
    type: "EXPENSE" as const,
    category: "Software",
    entryDate: new Date("2026-03-13T00:00:00.000Z"),
    notes: seedNotes[5],
  },
  {
    amount: 68000n,
    type: "INCOME" as const,
    category: "Training",
    entryDate: new Date("2026-03-24T00:00:00.000Z"),
    notes: seedNotes[6],
  },
  {
    amount: 26000n,
    type: "EXPENSE" as const,
    category: "People",
    entryDate: new Date("2026-03-28T00:00:00.000Z"),
    notes: seedNotes[7],
  },
];

const seedDashboard = async () => {
  const adminUser = await db.user.findFirst({
    where: {
      role: "ADMIN",
      status: "ACTIVE",
    },
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
      email: true,
    },
  });

  if (!adminUser) {
    throw new Error("No active admin user found. Create or promote an admin user before seeding.");
  }

  const existingSeedRecords = await db.financialRecord.findMany({
    where: {
      createdById: adminUser.id,
      notes: {
        in: seedNotes,
      },
    },
    select: {
      notes: true,
    },
  });

  const existingNotes = new Set(existingSeedRecords.map((record) => record.notes).filter(Boolean));
  const recordsToCreate = sampleRecords.filter((record) => !existingNotes.has(record.notes));

  if (recordsToCreate.length === 0) {
    console.log(`Sample records already exist for ${adminUser.email}. Nothing to add.`);
    return;
  }

  await db.financialRecord.createMany({
    data: recordsToCreate.map((record) => ({
      ...record,
      createdById: adminUser.id,
    })),
  });

  console.log(`Inserted ${recordsToCreate.length} sample financial records for ${adminUser.email}.`);
};

seedDashboard()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
