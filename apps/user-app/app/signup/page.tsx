"use client";

import { useState } from "react";
import { signup } from "@/lib/auth/client";
import { signIn } from "next-auth/react";

export default function SignupPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    async function handleSignup() {
        const res = await signup(name, email, password);
        if (res?.error) setError("User already exists");
    }

    return (
        <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center">
            <div className="w-full max-w-md bg-[#121826] p-8 rounded-xl border border-[#1F2937]">
                <h1 className="text-2xl font-semibold text-white mb-6">
                    Create OpenLedger Account
                </h1>

                <input
                    className="w-full mb-3 p-3 rounded bg-[#0B0F1A] text-white border border-[#1F2937]"
                    placeholder="Full name"
                    onChange={(e) => setName(e.target.value)}
                />

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
                    onClick={handleSignup}
                    className="w-full bg-[#16A34A] hover:bg-[#15803D] text-white py-3 rounded font-medium"
                >
                    Sign up
                </button>

                <button
                    onClick={() => signIn("google")}
                    className="w-full mt-4 border border-[#1F2937] text-white py-3 rounded hover:bg-[#1F2937]"
                >
                    Sign up with Google
                </button>

            </div>
        </div>
    );
}
