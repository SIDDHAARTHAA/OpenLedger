import db from "@openledger/db";
import axios from "axios";
import { type Request, type Response } from "express";
import crypto from "node:crypto"
import bcrypt from 'bcrypt'

export const authGoogleStart = (req: Request, res: Response) => {
    const params = new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
        response_type: "code",
        scope: "openid email profile",
        prompt: "select_account",
    });

    const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    return res.redirect(url);
};

export const authGoogleCallback = async (req: Request, res: Response) => {
    try {
        const code = req.query.code as string | undefined;

        if (!code) {
            return res.status(400).json({
                error: "Missing code",
            });
        }

        //exchange code => tokens
        const tokenRes = await axios.post(
            "https://oauth2.googleapis.com/token",
            new URLSearchParams({
                code,
                client_id: process.env.GOOGLE_CLIENT_ID!,
                client_secret: process.env.GOOGLE_CLIENT_SECRET!,
                redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
                grant_type: "authorization_code",
            }),
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            }
        );

        const { access_token } = tokenRes.data;

        //feth google user info
        const userRes = await axios.get(
            "https://openidconnect.googleapis.com/v1/userinfo",
            {
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }
        );

        const { sub, email, name, picture, }: {
            sub: string;
            email?: string;
            name?: string;
            picture?: string;
        } = userRes.data;


        //db transaction: user + auth account
        const user = await db.$transaction(async (tx) => {
            const existingAccount = await tx.authAccount.findUnique({
                where: {
                    provider_providerAccountId: {
                        provider: "GOOGLE",
                        providerAccountId: sub,
                    },
                },
                include: { user: true },
            });

            if (existingAccount) {
                return existingAccount.user;
            }

            return tx.user.create({
                data: {
                    email: email ?? null,
                    name: name ?? null,
                    image: picture ?? null,
                    authAccounts: {
                        create: {
                            provider: "GOOGLE",
                            providerAccountId: sub,
                        },
                    },
                    account: {
                        create: {},
                    },
                },
            });

        });


        //create session
        const sessionId = crypto.randomBytes(32).toString("hex");


        await db.session.create({
            data: {
                id: sessionId,
                userId: user.id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        });

        //set cookie
        res.cookie("session_id", sessionId, {
            httpOnly: true,
            secure: false, //as of now in dev
            sameSite: "lax",
            path: "/",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.redirect(process.env.FRONTEND_URL!)
    } catch (err) {
        console.error("Google auth callback failure", err);
        return res.status(500).json({
            error: "Authentication failed"
        })
    }
};

export const emailLogin = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            error: "Missing fields"
        });
    }

    const account = await db.authAccount.findUnique({
        where: {
            provider_providerAccountId: {
                provider: "EMAIL",
                providerAccountId: email,
            },
        },
        include: { user: true },
    });

    if (!account || !account.passwordHash) {
        return res.status(401).json({
            error: "Invalid credentials"
        });
    }

    const valid = await bcrypt.compare(password, account.passwordHash);

    if (!valid) {
        return res.status(401).json({
            error: "Invalid credentials"
        });
    }

    const sessionId = crypto.randomBytes(32).toString("hex");

    await db.session.create({
        data: {
            id: sessionId,
            userId: account.user.id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
    });

    res.cookie("session_id", sessionId, {
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
        user: account.user
    })
};

export const emailSignup = async (req: Request, res: Response) => {
    const { email, password, name } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            error: "Missing fileds"
        });
    }

    const existing = await db.user.findUnique({
        where: {
            email,
        },
    });

    if (existing) {
        return res.status(409).json({ error: "User or Email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await db.user.create({
        data: {
            email,
            name: name ?? null,
            authAccounts: {
                create: {
                    provider: "EMAIL",
                    providerAccountId: email,
                    passwordHash,
                },
            },
            account: {
                create: {},
            },
        },
    });

    const sessionId = crypto.randomBytes(32).toString("hex");

    await db.session.create({
        data: {
            id: sessionId,
            userId: user.id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
    });

    res.cookie("session_id", sessionId, {
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({ user });
};
