import db from "@openledger/db";
import type { Response } from "express";
import crypto from "node:crypto";
import { ASSET_CATALOG, getAssetById } from "src/data/assets.js";
import type { AuthenticateRequest } from "src/middleware/auth.middleware.js";

class AssetError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const isPrismaUniqueViolation = (error: unknown) => {
  if (!error || typeof error !== "object") {
    return false;
  }

  const maybeCode = (error as { code?: unknown }).code;
  return maybeCode === "P2002";
};

export const listAssetCatalog = (_req: AuthenticateRequest, res: Response) => {
  return res.json({
    assets: ASSET_CATALOG.map((asset) => ({
      ...asset,
      price: asset.price.toString(),
    })),
  });
};

export const listMyAssets = async (req: AuthenticateRequest, res: Response) => {
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const purchases = await db.assetPurchase.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      assetId: true,
      assetName: true,
      price: true,
      createdAt: true,
      transaction: {
        select: {
          reference: true,
        },
      },
    },
  });

  return res.json({
    purchases: purchases.map((purchase) => ({
      assetId: purchase.assetId,
      assetName: purchase.assetName,
      price: purchase.price.toString(),
      createdAt: purchase.createdAt,
      transactionRef: purchase.transaction.reference,
    })),
  });
};

export const buyAsset = async (req: AuthenticateRequest, res: Response) => {
  const userId = req.userId;
  const assetId = req.body?.assetId as string | undefined;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!assetId) {
    return res.status(400).json({ error: "assetId is required" });
  }

  const asset = getAssetById(assetId);

  if (!asset) {
    return res.status(404).json({ error: "Asset not found" });
  }

  try {
    const result = await db.$transaction(async (tx) => {
      const account = await tx.account.findUnique({
        where: { userId },
        select: { id: true },
      });

      if (!account) {
        throw new AssetError("Account not found", 404);
      }

      const updated = await tx.account.updateMany({
        where: {
          id: account.id,
          balance: {
            gte: asset.price,
          },
        },
        data: {
          balance: {
            decrement: asset.price,
          },
        },
      });

      if (updated.count === 0) {
        throw new AssetError("Insufficient balance", 400);
      }

      const reference = `asset_${crypto.randomBytes(8).toString("hex")}`;

      const transaction = await tx.transaction.create({
        data: {
          accountId: account.id,
          amount: asset.price,
          type: "TRANSFER_OUT",
          status: "SUCCESS",
          reference,
        },
      });

      await tx.assetPurchase.create({
        data: {
          userId,
          transactionId: transaction.id,
          assetId: asset.id,
          assetName: asset.name,
          price: asset.price,
        },
      });

      const currentBalance = await tx.account.findUnique({
        where: { id: account.id },
        select: { balance: true },
      });

      return {
        reference,
        balance: currentBalance?.balance ?? 0n,
      };
    });

    return res.status(201).json({
      ok: true,
      assetId: asset.id,
      balance: result.balance.toString(),
      reference: result.reference,
    });
  } catch (error) {
    if (error instanceof AssetError) {
      return res.status(error.status).json({ error: error.message });
    }

    if (isPrismaUniqueViolation(error)) {
      return res.status(409).json({ error: "Asset already purchased" });
    }

    console.error("Asset purchase failed", error);
    return res.status(500).json({ error: "Unable to complete purchase" });
  }
};
