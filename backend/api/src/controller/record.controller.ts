import db from "@openledger/db";
import type { Response } from "express";
import {
  buildRecordFilters,
  handleApiError,
  parseRecordPayload,
  serializeFinancialRecord,
} from "src/lib/record-helpers.js";
import type { AuthenticateRequest } from "src/middleware/auth.middleware.js";

const recordSelect = {
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
};

export const listRecords = async (req: AuthenticateRequest, res: Response) => {
  try {
    const { where, page, pageSize, skip, take } = buildRecordFilters(req.query as Record<string, unknown>);

    const [records, total] = await Promise.all([
      db.financialRecord.findMany({
        where,
        orderBy: [{ entryDate: "desc" }, { createdAt: "desc" }],
        skip,
        take,
        select: recordSelect,
      }),
      db.financialRecord.count({ where }),
    ]);

    return res.json({
      records: records.map(serializeFinancialRecord),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    });
  } catch (error) {
    handleApiError(error, "Unable to list records", (status, body) => res.status(status).json(body));
  }
};

export const getRecordById = async (req: AuthenticateRequest, res: Response) => {
  const recordId = req.params.recordId;

  if (!recordId) {
    return res.status(400).json({ error: "recordId is required" });
  }

  const record = await db.financialRecord.findUnique({
    where: { id: recordId },
    select: recordSelect,
  });

  if (!record) {
    return res.status(404).json({ error: "Record not found" });
  }

  return res.json({
    record: serializeFinancialRecord(record),
  });
};

export const createRecord = async (req: AuthenticateRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const parsed = parseRecordPayload(req.body);
    const record = await db.financialRecord.create({
      data: {
        createdById: userId,
        amount: parsed.amount!,
        type: parsed.type!,
        category: parsed.category!,
        entryDate: parsed.entryDate!,
        notes: parsed.notes ?? null,
      },
      select: recordSelect,
    });

    return res.status(201).json({
      record: serializeFinancialRecord(record),
    });
  } catch (error) {
    handleApiError(error, "Unable to create record", (status, body) => res.status(status).json(body));
  }
};

export const updateRecord = async (req: AuthenticateRequest, res: Response) => {
  const recordId = req.params.recordId;

  if (!recordId) {
    return res.status(400).json({ error: "recordId is required" });
  }

  const existingRecord = await db.financialRecord.findUnique({
    where: { id: recordId },
    select: { id: true },
  });

  if (!existingRecord) {
    return res.status(404).json({ error: "Record not found" });
  }

  try {
    const parsed = parseRecordPayload(req.body, true);
    const record = await db.financialRecord.update({
      where: { id: recordId },
      data: parsed,
      select: recordSelect,
    });

    return res.json({
      record: serializeFinancialRecord(record),
    });
  } catch (error) {
    handleApiError(error, "Unable to update record", (status, body) => res.status(status).json(body));
  }
};

export const deleteRecord = async (req: AuthenticateRequest, res: Response) => {
  const recordId = req.params.recordId;

  if (!recordId) {
    return res.status(400).json({ error: "recordId is required" });
  }

  const existingRecord = await db.financialRecord.findUnique({
    where: { id: recordId },
    select: { id: true },
  });

  if (!existingRecord) {
    return res.status(404).json({ error: "Record not found" });
  }

  await db.financialRecord.delete({
    where: { id: recordId },
  });

  return res.status(204).send();
};
