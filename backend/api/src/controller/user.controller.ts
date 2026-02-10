import db from "@openledger/db";
import type { Request, Response } from "express";

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