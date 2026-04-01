import type { Request, Response, NextFunction } from "express";
import db from "@openledger/db";

export interface AuthenticateRequest extends Request {
    userId?: string;
    authUser?: {
        id: string;
        email: string | null;
        name: string | null;
        role: "VIEWER" | "ANALYST" | "ADMIN";
        status: "ACTIVE" | "INACTIVE";
    };
}

export const requireAuth = async (req: AuthenticateRequest, res: Response, next: NextFunction) => {
    const sessionId = req.cookies?.session_id;

    if (!sessionId) {
        return res.status(401).json({ error: "Unauthorized" });
    }


    const session = await db.session.findUnique({
        where: {
            id: sessionId
        },
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                    status: true,
                },
            },
        },
    });

    if (!session || session.expiresAt < new Date()) {
        return res.status(401).json({
            error: "Unauthorized"
        });
    }

    if (session.user.status !== "ACTIVE") {
        return res.status(403).json({
            error: "User account is inactive"
        });
    }

    req.userId = session.userId;
    req.authUser = session.user;
    next();
}
