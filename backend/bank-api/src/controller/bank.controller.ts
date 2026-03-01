import type { Request, Response } from "express";
import crypto from "node:crypto";
import axios from "axios";
import { createBankOrder, getBankOrder, updateBankOrderStatus } from "../store/bank.store.js";

const DEFAULT_WEBHOOK_URL = "http://localhost:4000/api/webhook/bank";

const parseAmount = (rawAmount: unknown): bigint | null => {
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

export const createOrder = (req: Request, res: Response) => {
  const ref = req.body?.ref as string | undefined;
  const rawAmount = req.body?.amount;
  const returnUrl = req.body?.returnUrl as string | undefined;
  const amount = parseAmount(rawAmount);

  if (!ref || amount === null || !returnUrl) {
    return res.status(400).json({
      error: "Missing or invalid ref, amount or returnUrl",
    });
  }

  const token = `bank_session_${crypto.randomBytes(8).toString("hex")}`;

  createBankOrder({
    token,
    ref,
    amount,
    returnUrl,
  });

  return res.status(201).json({
    bank_token: token,
  });
};

export const registerWithdrawal = (req: Request, res: Response) => {
  const ref = req.body?.ref as string | undefined;
  const rawAmount = req.body?.amount;
  const amount = parseAmount(rawAmount);

  if (!ref || amount === null) {
    return res.status(400).json({
      error: "Missing or invalid ref/amount",
    });
  }

  const bankReference = `bank_wdr_${crypto.randomBytes(8).toString("hex")}`;

  return res.status(201).json({
    accepted: true,
    bank_reference: bankReference,
  });
};

export const renderApprovalPage = (req: Request, res: Response) => {
  const token = req.query.token as string | undefined;

  if (!token) {
    return res.status(400).send("Missing token");
  }

  const order = getBankOrder(token);

  if (!order) {
    return res.status(404).send("Bank session not found");
  }

  const actionHtml =
    order.status === "PENDING"
      ? `
      <form method="post" action="/api/bank/approve">
        <input type="hidden" name="token" value="${order.token}" />
        <button type="submit" name="action" value="approve">Approve</button>
        <button type="submit" name="action" value="fail">Fail</button>
      </form>
    `
      : `<p>This order is already ${order.status}.</p>`;

  return res.send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1.0" />
        <title>Bank Approval</title>
      </head>
      <body style="font-family: sans-serif; max-width: 480px; margin: 40px auto; padding: 0 16px;">
        <h1>Bank Approval</h1>
        <p><strong>Ref:</strong> ${order.ref}</p>
        <p><strong>Amount:</strong> ${order.amount.toString()}</p>
        <p><strong>Status:</strong> ${order.status}</p>
        ${actionHtml}
      </body>
    </html>
  `);
};

export const approveOrder = async (req: Request, res: Response) => {
  const token = req.body?.token as string | undefined;
  const action = req.body?.action as string | undefined;

  if (!token || !action) {
    return res.status(400).send("Missing token or action");
  }

  const order = getBankOrder(token);

  if (!order) {
    return res.status(404).send("Bank session not found");
  }

  if (order.status !== "PENDING") {
    return res.redirect(order.returnUrl);
  }

  const status = action === "approve" ? "SUCCESS" : "FAILED";
  const webhookUrl = process.env.USER_APP_WEBHOOK_URL ?? DEFAULT_WEBHOOK_URL;
  const webhookSecret = process.env.BANK_WEBHOOK_SECRET;

  try {
    const requestConfig: {
      timeout: number;
      headers?: Record<string, string>;
    } = {
      timeout: 10_000,
    };

    if (webhookSecret) {
      requestConfig.headers = {
        "x-bank-webhook-secret": webhookSecret,
      };
    }

    await axios.post(
      webhookUrl,
      {
        token: order.token,
        status,
      },
      requestConfig
    );
  } catch (error) {
    console.error("Webhook delivery failed", error);
    return res.status(502).send("Unable to settle transaction");
  }

  updateBankOrderStatus(order.token, status);
  return res.redirect(order.returnUrl);
};
