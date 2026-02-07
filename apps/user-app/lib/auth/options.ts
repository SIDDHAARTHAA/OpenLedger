import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

import { prisma } from "@repo/db/prisma";
import { hashPassword, verifyPassword } from "@repo/db/auth";
import { credentialsSchema } from "./schemas";

export const authOptions: NextAuthOptions = {
    session: {
        strategy: "jwt",
    },

    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),

        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
                name: { label: "Name", type: "text" },
                mode: { label: "Mode", type: "text" },
            },

            async authorize(raw) {
                const parsed = credentialsSchema.safeParse(raw);
                if (!parsed.success) return null;

                const { email, password, name, mode } = parsed.data;

                const user = await prisma.user.findUnique({
                    where: { email },
                });

                /* ---------------- LOGIN ---------------- */
                if (mode === "login") {
                    if (!user || !user.password) return null;

                    const ok = await verifyPassword(password, user.password);
                    if (!ok) return null;

                    return {
                        id: user.id.toString(),
                        email: user.email,
                        name: user.name,
                    };
                }

                /* ---------------- SIGNUP ---------------- */
                if (mode === "signup") {
                    if (user) return null; // email already exists

                    const hashed = await hashPassword(password);

                    const created = await prisma.user.create({
                        data: {
                            email,
                            password: hashed,
                            name: name ?? "User",
                        },
                    });

                    return {
                        id: created.id.toString(),
                        email: created.email,
                        name: created.name,
                    };
                }

                return null;
            },
        }),
    ],

    callbacks: {
        async signIn({ user, account }) {
            if (account?.provider === "google" && user.email) {
                await prisma.user.upsert({
                    where: { email: user.email },
                    create: {
                        email: user.email,
                        name: user.name ?? undefined,
                        password: null,
                    },
                    update: {
                        name: user.name ?? undefined,
                    },
                });
            }
            return true;
        },

        async jwt({ token, user, account }) {
            if (user) {
                if (account?.provider === "google" && user.email) {
                    const dbUser = await prisma.user.findUnique({
                        where: { email: user.email },
                    });
                    token.uid = dbUser ? String(dbUser.id) : user.id;
                } else {
                    token.uid = user.id;
                }
            }
            return token;
        },

        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.uid as string;
            }
            return session;
        },

        redirect() {
            return "/";
        },
    },

    pages: {
        signIn: "/login",
    },

    secret: process.env.NEXTAUTH_SECRET,
};
