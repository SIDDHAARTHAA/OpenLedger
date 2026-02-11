import db from "@openledger/db";
import type { Request, Response } from "express";
import type { AuthenticateRequest } from "src/middleware/auth.middleware.js";

export const getMe = async (req: Request, res: Response) => {
    const sessionId = req.cookies?.session_id;

    if (!sessionId) {
        return res.status(400).json({
            user: null
        });
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
                    image: true,
                    createdAt: true,
                },
            },
        },
    });

    if (!session) {
        return res.status(401).json({
            user: null
        });
    }

    return res.json({
        user: session.user
    });
}

export const getBalance = async (req: AuthenticateRequest, res: Response) => {
    const userId = req.userId!;

    const account = await db.account.findUnique({
        where: {
            userId
        },
        select: {
            balance: true
        },
    });

    if (!account) {
        return res.status(404).json({
            error: "Account not found"
        });
    }

    return res.json({
        balance: account.balance.toString(),
    });
};