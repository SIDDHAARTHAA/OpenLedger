import db from "@openledger/db";
import axios from "axios";
import type { Request, Response } from "express";
import crypto from "node:crypto";
import type { AuthenticateRequest } from "src/middleware/auth.middleware.js";

const DEFAULT_BANK_API_URL = "http://localhost:8081";
const DEFAULT_FRONTEND_URL = "http://localhost:3000";

const parseDepositAmount = (rawAmount: unknown): bigint | null => {
  if (typeof rawAmount === "bigint") {
    return rawAmount > 0n ? rawAmount : null;
  }

  if (typeof rawAmount === "number") {
    if (!Number.isFinite(rawAmount) || rawAmount <= 0 || !Number.isInteger(rawAmount)) {
      return null;
    }

    return BigInt(rawAmount);
  }

  if (typeof rawAmount === "string") {
    const trimmed = rawAmount.trim();

    if (!/^[0-9]+$/.test(trimmed)) {
      return null;
    }

    const value = BigInt(trimmed);
    return value > 0n ? value : null;
  }

  return null;
};

class TransactionError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export const depositTransaction = async (req: AuthenticateRequest, res: Response) => {
  const userId = req.userId;
  const amount = parseDepositAmount(req.body?.amount);

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (amount === null) {
    return res.status(400).json({ error: "Amount must be a positive integer." });
  }

  const account = await db.account.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!account) {
    return res.status(404).json({ error: "Account not found" });
  }

  const reference = `txn_${crypto.randomBytes(8).toString("hex")}`;
  const bankApiUrl = process.env.BANK_API_URL ?? DEFAULT_BANK_API_URL;
  const frontendUrl = process.env.FRONTEND_URL ?? DEFAULT_FRONTEND_URL;
  const returnUrl = `${frontendUrl.replace(/\/$/, "")}/me`;

  try {
    const bankOrder = await axios.post(
      `${bankApiUrl}/api/bank/create-order`,
      {
        ref: reference,
        amount: amount.toString(),
        returnUrl,
      },
      { timeout: 10_000 }
    );

    const bankToken = bankOrder.data?.bank_token as string | undefined;

    if (!bankToken) {
      return res.status(502).json({ error: "Bank API did not return a bank token." });
    }

    await db.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          accountId: account.id,
          amount,
          type: "DEPOSIT",
          status: "PENDING",
          reference,
        },
      });

      await tx.processing.create({
        data: {
          bankToken,
          transactionId: transaction.id,
        },
      });
    });

    const bankFrontendUrl = process.env.BANK_FRONTEND_URL ?? bankApiUrl;
    const approvalUrl = `${bankFrontendUrl.replace(/\/$/, "")}/bank/approve?token=${encodeURIComponent(bankToken)}`;

    return res.status(201).json({
      reference,
      bank_token: bankToken,
      url: approvalUrl,
    });
  } catch (error) {
    console.error("Deposit registration failed", error);
    return res.status(502).json({ error: "Unable to register deposit with bank API." });
  }
};

export const bankWebhook = async (req: Request, res: Response) => {
  const expectedWebhookSecret = process.env.BANK_WEBHOOK_SECRET;
  const webhookSecret = req.header("x-bank-webhook-secret");

  if (expectedWebhookSecret && webhookSecret !== expectedWebhookSecret) {
    return res.status(401).json({ error: "Invalid webhook signature" });
  }

  const token = req.body?.token as string | undefined;
  const rawStatus = req.body?.status as string | undefined;
  const status = rawStatus?.toUpperCase();

  if (!token || (status !== "SUCCESS" && status !== "FAILED")) {
    return res.status(400).json({ error: "Invalid webhook payload" });
  }

  const processing = await db.processing.findUnique({
    where: { bankToken: token },
    include: {
      transaction: {
        select: {
          id: true,
          accountId: true,
          amount: true,
          status: true,
        },
      },
    },
  });

  if (!processing) {
    return res.status(404).json({ error: "Unknown bank token" });
  }

  if (processing.transaction.status !== "PENDING") {
    return res.json({ ok: true, alreadySettled: true });
  }

  const settled = await db.$transaction(async (tx) => {
    const updated = await tx.transaction.updateMany({
      where: {
        id: processing.transaction.id,
        status: "PENDING",
      },
      data: {
        status,
      },
    });

    if (updated.count === 0) {
      return false;
    }

    if (status === "SUCCESS") {
      await tx.account.update({
        where: { id: processing.transaction.accountId },
        data: {
          balance: {
            increment: processing.transaction.amount,
          },
        },
      });
    }

    await tx.processing.update({
      where: { id: processing.id },
      data: { settledAt: new Date() },
    });

    return true;
  });

  return res.json({ ok: true, settled });
};

export const withdrawTransaction = async (req: AuthenticateRequest, res: Response) => {
  const userId = req.userId;
  const amount = parseDepositAmount(req.body?.amount);

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (amount === null) {
    return res.status(400).json({ error: "Amount must be a positive integer." });
  }

  const reference = `wdr_${crypto.randomBytes(8).toString("hex")}`;
  const bankApiUrl = process.env.BANK_API_URL ?? DEFAULT_BANK_API_URL;
  let pendingWithdraw:
    | {
        transactionId: string;
        accountId: string;
        balanceAfterDebit: bigint;
      }
    | null = null;

  try {
    pendingWithdraw = await db.$transaction(async (tx) => {
      const account = await tx.account.findUnique({
        where: { userId },
        select: { id: true },
      });

      if (!account) {
        throw new TransactionError("Account not found", 404);
      }

      const updated = await tx.account.updateMany({
        where: {
          id: account.id,
          balance: {
            gte: amount,
          },
        },
        data: {
          balance: {
            decrement: amount,
          },
        },
      });

      if (updated.count === 0) {
        throw new TransactionError("Insufficient balance", 400);
      }

      const transaction = await tx.transaction.create({
        data: {
          accountId: account.id,
          amount,
          type: "WITHDRAW",
          status: "PENDING",
          reference,
        },
      });

      const currentBalance = await tx.account.findUnique({
        where: { id: account.id },
        select: { balance: true },
      });

      return {
        transactionId: transaction.id,
        accountId: account.id,
        balanceAfterDebit: currentBalance?.balance ?? 0n,
      };
    });

    const withdrawRes = await axios.post(
      `${bankApiUrl}/api/bank/withdraw`,
      {
        ref: reference,
        userId,
        amount: amount.toString(),
      },
      { timeout: 10_000 }
    );

    if (!withdrawRes.data?.accepted) {
      throw new TransactionError("Bank rejected withdrawal request.", 502);
    }

    await db.transaction.update({
      where: { id: pendingWithdraw.transactionId },
      data: { status: "SUCCESS" },
    });

    return res.status(201).json({
      ok: true,
      reference,
      balance: pendingWithdraw.balanceAfterDebit.toString(),
    });
  } catch (error) {
    if (pendingWithdraw) {
      const failedWithdraw = pendingWithdraw;

      await db.$transaction(async (tx) => {
        const reverted = await tx.transaction.updateMany({
          where: {
            id: failedWithdraw.transactionId,
            status: "PENDING",
          },
          data: { status: "FAILED" },
        });

        if (reverted.count > 0) {
          await tx.account.update({
            where: { id: failedWithdraw.accountId },
            data: {
              balance: {
                increment: amount,
              },
            },
          });
        }
      });
    }

    if (error instanceof TransactionError) {
      return res.status(error.status).json({ error: error.message });
    }

    console.error("Withdraw failed", error);
    return res.status(502).json({ error: "Unable to complete withdraw" });
  }
};

export const getTransactions = async (req: AuthenticateRequest, res: Response) => {
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const account = await db.account.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!account) {
    return res.status(404).json({ error: "Account not found" });
  }

  const transactions = await db.transaction.findMany({
    where: { accountId: account.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      type: true,
      status: true,
      amount: true,
      reference: true,
      createdAt: true,
    },
  });

  return res.json({
    transactions: transactions.map((txn) => ({
      ...txn,
      amount: txn.amount.toString(),
    })),
  });
};
