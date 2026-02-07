"use client";

import { useState } from "react";
import { login } from "@/lib/auth/client";
import { signIn } from "next-auth/react";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    async function handleLogin() {
        const res = await login(email, password);
        if (res?.error) setError("Invalid credentials");
    }

    return (
        <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center">
            <div className="w-full max-w-md bg-[#121826] p-8 rounded-xl border border-[#1F2937]">
                <h1 className="text-2xl font-semibold text-white mb-6">
                    OpenLedger Login
                </h1>

                <input
                    className="w-full mb-3 p-3 rounded bg-[#0B0F1A] text-white border border-[#1F2937]"
                    placeholder="Email"
                    onChange={(e) => setEmail(e.target.value)}
                />

                <input
                    type="password"
                    className="w-full mb-4 p-3 rounded bg-[#0B0F1A] text-white border border-[#1F2937]"
                    placeholder="Password"
                    onChange={(e) => setPassword(e.target.value)}
                />

                {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

                <button
                    onClick={handleLogin}
                    className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white py-3 rounded font-medium"
                >
                    Login
                </button>
                <button
                    onClick={() => signIn("google", { callbackUrl: "/" })}
                    className="w-full mt-4 border border-[#1F2937] text-white py-3 rounded hover:bg-[#1F2937]"
                >
                    Continue with Google
                </button>

            </div>
        </div>
    );
}
