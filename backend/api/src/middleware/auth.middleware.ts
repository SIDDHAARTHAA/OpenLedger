import type { Request, Response, NextFunction } from "express";
import db from "@openledger/db";

export interface AuthenticateRequest extends Request {
    userId?: string;
}

export const requireAuth = async (req: AuthenticateRequest, res: Response, next: NextFunction) => {
    const sessionId = req.cookies?.session_id;

    if (!sessionId) {
        return res.status(401).json({ error: "Unauthorized" });
    }


    const session = await db.session.findUnique({
        where: {
            id: sessionId
        }
    });

    if (!session || session.expiresAt < new Date()) {
        return res.status(401).json({
            error: "Unauthorized"
        });
    }

    req.userId = session.userId;
    next();
}
