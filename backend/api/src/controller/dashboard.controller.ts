import db from "@openledger/db";
import type { Response } from "express";
import {
  buildRecordFilters,
  handleApiError,
  serializeFinancialRecord,
} from "src/lib/record-helpers.js";
import type { AuthenticateRequest } from "src/middleware/auth.middleware.js";

type TrendBucket = {
  label: string;
  periodStart: string;
  income: bigint;
  expenses: bigint;
};

const createTrendKey = (date: Date, period: "monthly" | "weekly") => {
  const utcDate = new Date(date);

  if (period === "monthly") {
    const year = utcDate.getUTCFullYear();
    const month = `${utcDate.getUTCMonth() + 1}`.padStart(2, "0");

    return {
      key: `${year}-${month}`,
      periodStart: `${year}-${month}-01`,
    };
  }

  const weekDate = new Date(Date.UTC(
    utcDate.getUTCFullYear(),
    utcDate.getUTCMonth(),
    utcDate.getUTCDate(),
  ));
  const dayOfWeek = weekDate.getUTCDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  weekDate.setUTCDate(weekDate.getUTCDate() + diffToMonday);

  return {
    key: weekDate.toISOString().slice(0, 10),
    periodStart: weekDate.toISOString().slice(0, 10),
  };
};

export const getDashboardSummary = async (req: AuthenticateRequest, res: Response) => {
  try {
    const { where } = buildRecordFilters(req.query as Record<string, unknown>);

    const [records, recentActivity] = await Promise.all([
      db.financialRecord.findMany({
        where,
        orderBy: [{ entryDate: "desc" }, { createdAt: "desc" }],
        select: {
          id: true,
          amount: true,
          type: true,
          category: true,
          entryDate: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      db.financialRecord.findMany({
        where,
        orderBy: [{ entryDate: "desc" }, { createdAt: "desc" }],
        take: 5,
        select: {
          id: true,
          amount: true,
          type: true,
          category: true,
          entryDate: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
          createdBy: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
            },
          },
        },
      }),
    ]);

    let totalIncome = 0n;
    let totalExpenses = 0n;
    const categories = new Map<string, { income: bigint; expenses: bigint }>();

    for (const record of records) {
      const categoryTotals = categories.get(record.category) ?? { income: 0n, expenses: 0n };

      if (record.type === "INCOME") {
        totalIncome += record.amount;
        categoryTotals.income += record.amount;
      } else {
        totalExpenses += record.amount;
        categoryTotals.expenses += record.amount;
      }

      categories.set(record.category, categoryTotals);
    }

    const categoryTotals = Array.from(categories.entries())
      .map(([category, totals]) => ({
        category,
        income: totals.income.toString(),
        expenses: totals.expenses.toString(),
        net: (totals.income - totals.expenses).toString(),
      }))
      .sort((left, right) => left.category.localeCompare(right.category));

    return res.json({
      totals: {
        income: totalIncome.toString(),
        expenses: totalExpenses.toString(),
        netBalance: (totalIncome - totalExpenses).toString(),
        recordCount: records.length,
      },
      categoryTotals,
      recentActivity: recentActivity.map(serializeFinancialRecord),
    });
  } catch (error) {
    handleApiError(error, "Unable to build dashboard summary", (status, body) => res.status(status).json(body));
  }
};

export const getDashboardTrends = async (req: AuthenticateRequest, res: Response) => {
  const rawPeriod = typeof req.query.period === "string" ? req.query.period : "monthly";
  const period = rawPeriod === "weekly" ? "weekly" : rawPeriod === "monthly" ? "monthly" : null;

  if (!period) {
    return res.status(400).json({ error: "period must be either monthly or weekly" });
  }

  try {
    const { where } = buildRecordFilters(req.query as Record<string, unknown>);
    const records = await db.financialRecord.findMany({
      where,
      orderBy: [{ entryDate: "asc" }, { createdAt: "asc" }],
      select: {
        amount: true,
        type: true,
        entryDate: true,
      },
    });

    const buckets = new Map<string, TrendBucket>();

    for (const record of records) {
      const { key, periodStart } = createTrendKey(record.entryDate, period);
      const bucket = buckets.get(key) ?? {
        label: key,
        periodStart,
        income: 0n,
        expenses: 0n,
      };

      if (record.type === "INCOME") {
        bucket.income += record.amount;
      } else {
        bucket.expenses += record.amount;
      }

      buckets.set(key, bucket);
    }

    const trends = Array.from(buckets.values())
      .sort((left, right) => left.periodStart.localeCompare(right.periodStart))
      .map((bucket) => ({
        label: bucket.label,
        periodStart: bucket.periodStart,
        income: bucket.income.toString(),
        expenses: bucket.expenses.toString(),
        net: (bucket.income - bucket.expenses).toString(),
      }));

    return res.json({
      period,
      trends,
    });
  } catch (error) {
    handleApiError(error, "Unable to build dashboard trends", (status, body) => res.status(status).json(body));
  }
};
