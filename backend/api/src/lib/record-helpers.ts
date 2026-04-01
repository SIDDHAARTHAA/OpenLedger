type RecordType = "INCOME" | "EXPENSE";

type ParsedRecordPayload = {
  amount?: bigint;
  type?: RecordType;
  category?: string;
  entryDate?: Date;
  notes?: string | null;
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

const MAX_CATEGORY_LENGTH = 80;
const MAX_NOTES_LENGTH = 500;
const VALID_RECORD_TYPES = new Set<RecordType>(["INCOME", "EXPENSE"]);

const getSingleValue = (value: unknown) => {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value) && typeof value[0] === "string") {
    return value[0];
  }

  return null;
};

const parseIntegerQuery = (value: string | null, fallback: number, fieldName: string) => {
  if (value === null || value.trim() === "") {
    return fallback;
  }

  if (!/^[0-9]+$/.test(value)) {
    throw new ApiError(`${fieldName} must be a positive integer.`);
  }

  const parsed = Number.parseInt(value, 10);

  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new ApiError(`${fieldName} must be a positive integer.`);
  }

  return parsed;
};

export const parsePositiveAmount = (rawAmount: unknown) => {
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

    const parsed = BigInt(trimmed);
    return parsed > 0n ? parsed : null;
  }

  return null;
};

const parseRecordType = (rawType: unknown, fieldName: string, required: boolean) => {
  if (rawType === undefined || rawType === null || rawType === "") {
    if (required) {
      throw new ApiError(`${fieldName} is required.`);
    }

    return undefined;
  }

  if (typeof rawType !== "string") {
    throw new ApiError(`${fieldName} must be a string.`);
  }

  const normalized = rawType.trim().toUpperCase() as RecordType;

  if (!VALID_RECORD_TYPES.has(normalized)) {
    throw new ApiError(`${fieldName} must be either INCOME or EXPENSE.`);
  }

  return normalized;
};

const parseDateInput = (rawDate: unknown, fieldName: string, required: boolean) => {
  if (rawDate === undefined || rawDate === null || rawDate === "") {
    if (required) {
      throw new ApiError(`${fieldName} is required.`);
    }

    return undefined;
  }

  if (typeof rawDate !== "string") {
    throw new ApiError(`${fieldName} must be a valid ISO date string.`);
  }

  const parsed = new Date(rawDate);

  if (Number.isNaN(parsed.getTime())) {
    throw new ApiError(`${fieldName} must be a valid ISO date string.`);
  }

  return parsed;
};

const parseCategory = (rawCategory: unknown, required: boolean) => {
  if (rawCategory === undefined || rawCategory === null || rawCategory === "") {
    if (required) {
      throw new ApiError("category is required.");
    }

    return undefined;
  }

  if (typeof rawCategory !== "string") {
    throw new ApiError("category must be a string.");
  }

  const category = rawCategory.trim();

  if (category.length === 0) {
    throw new ApiError("category cannot be empty.");
  }

  if (category.length > MAX_CATEGORY_LENGTH) {
    throw new ApiError(`category must be ${MAX_CATEGORY_LENGTH} characters or fewer.`);
  }

  return category;
};

const parseNotes = (rawNotes: unknown, required: boolean) => {
  if (rawNotes === undefined) {
    if (required) {
      return null;
    }

    return undefined;
  }

  if (rawNotes === null || rawNotes === "") {
    return null;
  }

  if (typeof rawNotes !== "string") {
    throw new ApiError("notes must be a string.");
  }

  const notes = rawNotes.trim();

  if (notes.length > MAX_NOTES_LENGTH) {
    throw new ApiError(`notes must be ${MAX_NOTES_LENGTH} characters or fewer.`);
  }

  return notes.length === 0 ? null : notes;
};

const startOfDay = (date: Date) => {
  const normalized = new Date(date);
  normalized.setUTCHours(0, 0, 0, 0);
  return normalized;
};

const endOfDay = (date: Date) => {
  const normalized = new Date(date);
  normalized.setUTCHours(23, 59, 59, 999);
  return normalized;
};

export const parseRecordPayload = (body: unknown, partial = false): ParsedRecordPayload => {
  if (!body || typeof body !== "object") {
    throw new ApiError("Request body must be a JSON object.");
  }

  const payload = body as Record<string, unknown>;
  const parsed: ParsedRecordPayload = {};

  if (!partial || "amount" in payload) {
    const amount = parsePositiveAmount(payload.amount);

    if (amount === null) {
      throw new ApiError("amount must be a positive integer.");
    }

    parsed.amount = amount;
  }

  const type = parseRecordType(payload.type, "type", !partial);
  if (type) {
    parsed.type = type;
  }

  const category = parseCategory(payload.category, !partial);
  if (category !== undefined) {
    parsed.category = category;
  }

  const entryDate = parseDateInput(payload.entryDate, "entryDate", !partial);
  if (entryDate) {
    parsed.entryDate = entryDate;
  }

  const notes = parseNotes(payload.notes, !partial);
  if (notes !== undefined) {
    parsed.notes = notes;
  }

  if (partial && Object.keys(parsed).length === 0) {
    throw new ApiError("Provide at least one field to update.");
  }

  return parsed;
};

export const buildRecordFilters = (query: Record<string, unknown>) => {
  const where: Record<string, unknown> = {};

  const type = parseRecordType(getSingleValue(query.type), "type", false);
  if (type) {
    where.type = type;
  }

  const category = getSingleValue(query.category)?.trim();
  if (category) {
    where.category = {
      equals: category,
      mode: "insensitive",
    };
  }

  const search = getSingleValue(query.search)?.trim();
  if (search) {
    where.notes = {
      contains: search,
      mode: "insensitive",
    };
  }

  const fromValue = getSingleValue(query.from);
  const toValue = getSingleValue(query.to);
  const from = fromValue ? parseDateInput(fromValue, "from", true) : undefined;
  const to = toValue ? parseDateInput(toValue, "to", true) : undefined;

  if (from && to && from > to) {
    throw new ApiError("from cannot be later than to.");
  }

  if (from || to) {
    where.entryDate = {
      ...(from ? { gte: startOfDay(from) } : {}),
      ...(to ? { lte: endOfDay(to) } : {}),
    };
  }

  const page = parseIntegerQuery(getSingleValue(query.page), 1, "page");
  const requestedPageSize = parseIntegerQuery(getSingleValue(query.pageSize), 20, "pageSize");
  const pageSize = Math.min(requestedPageSize, 100);

  return {
    where,
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    take: pageSize,
  };
};

export const serializeFinancialRecord = (record: {
  id: string;
  amount: bigint;
  type: string;
  category: string;
  entryDate: Date;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: {
    id: string;
    email: string | null;
    name: string | null;
    role?: string;
  } | null;
}) => {
  return {
    id: record.id,
    amount: record.amount.toString(),
    type: record.type,
    category: record.category,
    entryDate: record.entryDate,
    notes: record.notes,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    createdBy: record.createdBy
      ? {
          id: record.createdBy.id,
          email: record.createdBy.email,
          name: record.createdBy.name,
          role: record.createdBy.role ?? null,
        }
      : null,
  };
};

export const handleApiError = (error: unknown, fallbackMessage: string, responder: (status: number, body: { error: string }) => void) => {
  if (error instanceof ApiError) {
    responder(error.status, { error: error.message });
    return;
  }

  console.error(fallbackMessage, error);
  responder(500, { error: fallbackMessage });
};
