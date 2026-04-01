import db from "@openledger/db";
import bcrypt from "bcrypt";
import type { Request, Response } from "express";
import type { AuthenticateRequest } from "src/middleware/auth.middleware.js";

const VALID_USER_ROLES = new Set(["VIEWER", "ANALYST", "ADMIN"] as const);
const VALID_USER_STATUSES = new Set(["ACTIVE", "INACTIVE"] as const);

const userSelect = {
    id: true,
    email: true,
    name: true,
    image: true,
    role: true,
    status: true,
    createdAt: true,
    updatedAt: true,
};

const parseRole = (value: unknown) => {
    if (value === undefined) {
        return undefined;
    }

    if (typeof value !== "string") {
        return null;
    }

    const normalized = value.trim().toUpperCase() as "VIEWER" | "ANALYST" | "ADMIN";
    return VALID_USER_ROLES.has(normalized) ? normalized : null;
};

const parseStatus = (value: unknown) => {
    if (value === undefined) {
        return undefined;
    }

    if (typeof value !== "string") {
        return null;
    }

    const normalized = value.trim().toUpperCase() as "ACTIVE" | "INACTIVE";
    return VALID_USER_STATUSES.has(normalized) ? normalized : null;
};

const countOtherActiveAdmins = async (userId: string) => {
    return db.user.count({
        where: {
            role: "ADMIN",
            status: "ACTIVE",
            id: {
                not: userId,
            },
        },
    });
};

export const getMe = async (req: AuthenticateRequest, res: Response) => {
    const userId = req.userId;

    if (!userId) {
        return res.status(401).json({
            error: "Unauthorized"
        });
    }

    const user = await db.user.findUnique({
        where: {
            id: userId
        },
        select: userSelect,
    });

    if (!user) {
        return res.status(404).json({
            error: "User not found"
        });
    }

    return res.json({
        user
    });
}

export const listUsers = async (_req: Request, res: Response) => {
    const users = await db.user.findMany({
        orderBy: {
            createdAt: "desc",
        },
        select: userSelect,
    });

    return res.json({
        users,
    });
};

export const createUser = async (req: AuthenticateRequest, res: Response) => {
    const { email, password, name, role: rawRole, status: rawStatus } = req.body ?? {};

    if (typeof email !== "string" || email.trim().length === 0) {
        return res.status(400).json({
            error: "email is required"
        });
    }

    if (typeof password !== "string" || password.length < 8) {
        return res.status(400).json({
            error: "password must be at least 8 characters long"
        });
    }

    const role = parseRole(rawRole);

    if (role === null) {
        return res.status(400).json({
            error: "role must be one of VIEWER, ANALYST, or ADMIN"
        });
    }

    const status = parseStatus(rawStatus);

    if (status === null) {
        return res.status(400).json({
            error: "status must be ACTIVE or INACTIVE"
        });
    }

    const existingUser = await db.user.findUnique({
        where: {
            email: email.trim(),
        },
        select: {
            id: true,
        },
    });

    if (existingUser) {
        return res.status(409).json({
            error: "Email is already in use"
        });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await db.user.create({
        data: {
            email: email.trim(),
            name: typeof name === "string" && name.trim().length > 0 ? name.trim() : null,
            role: role ?? "VIEWER",
            status: status ?? "ACTIVE",
            authAccounts: {
                create: {
                    provider: "EMAIL",
                    providerAccountId: email.trim(),
                    passwordHash,
                },
            },
        },
        select: userSelect,
    });

    return res.status(201).json({
        user,
    });
};

export const updateUser = async (req: AuthenticateRequest, res: Response) => {
    const targetUserId = req.params.userId;
    const { name, role: rawRole, status: rawStatus, password } = req.body ?? {};

    if (!targetUserId) {
        return res.status(400).json({
            error: "userId is required"
        });
    }

    const existingUser = await db.user.findUnique({
        where: {
            id: targetUserId,
        },
        select: {
            id: true,
            role: true,
            status: true,
        },
    });

    if (!existingUser) {
        return res.status(404).json({
            error: "User not found"
        });
    }

    const role = parseRole(rawRole);

    if (role === null) {
        return res.status(400).json({
            error: "role must be one of VIEWER, ANALYST, or ADMIN"
        });
    }

    const status = parseStatus(rawStatus);

    if (status === null) {
        return res.status(400).json({
            error: "status must be ACTIVE or INACTIVE"
        });
    }

    const nextRole = role ?? existingUser.role;
    const nextStatus = status ?? existingUser.status;

    if (existingUser.role === "ADMIN" && (nextRole !== "ADMIN" || nextStatus !== "ACTIVE")) {
        const remainingAdmins = await countOtherActiveAdmins(existingUser.id);

        if (remainingAdmins === 0) {
            return res.status(400).json({
                error: "At least one active admin must remain in the system"
            });
        }
    }

    if (password !== undefined && (typeof password !== "string" || password.length < 8)) {
        return res.status(400).json({
            error: "password must be at least 8 characters long"
        });
    }

    const updatedUser = await db.$transaction(async (tx: any) => {
        if (typeof password === "string") {
            const passwordHash = await bcrypt.hash(password, 12);

            await tx.authAccount.updateMany({
                where: {
                    userId: targetUserId,
                    provider: "EMAIL",
                },
                data: {
                    passwordHash,
                },
            });
        }

        return tx.user.update({
            where: {
                id: targetUserId,
            },
            data: {
                name: typeof name === "string" ? name.trim() || null : undefined,
                role,
                status,
            },
            select: userSelect,
        });
    });

    return res.json({
        user: updatedUser,
    });
};
