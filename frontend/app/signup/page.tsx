"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import { useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const parseErrorMessage = (error: unknown, fallback: string) => {
    if (axios.isAxiosError(error)) {
        const message = error.response?.data?.error;
        if (typeof message === "string" && message.length > 0) {
            return message;
        }
    }

    return fallback;
};

export default function SignupPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleGoogleSignup = (e: React.MouseEvent) => {
        e.preventDefault();
        window.location.href = `${API_BASE_URL}/api/auth/google`;
    };

    const handleEmailSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post(
                `${API_BASE_URL}/api/auth/signup`,
                { name, email, password },
                { withCredentials: true }
            );
            router.push("/me");
        } catch (error) {
            console.error("Signup failed", error);
            alert(parseErrorMessage(error, "Signup failed. Please check your details."));
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center px-6">
            <div className="app-panel w-full max-w-sm p-8">
                <h2 className="text-2xl font-semibold mb-6 font-[var(--font-plex)]">
                    Create account
                </h2>

                {/* Google signup */}
                <button
                    onClick={handleGoogleSignup}
                    className="app-button-primary mb-6 block w-full text-center"
                >
                    Sign up with Google
                </button>

                <div className="text-center text-white/40 text-sm mb-6">
                    or
                </div>

                {/* Email signup */}
                <form className="space-y-4" onSubmit={handleEmailSignup}>
                    <input
                        type="text"
                        placeholder="Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="app-input"
                        required
                    />
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="app-input"
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="app-input"
                        required
                    />

                    <button
                        type="submit"
                        disabled={loading}
                        className="app-button-secondary flex w-full items-center justify-center"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-[#00B5EF] border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            "Create account"
                        )}
                    </button>
                </form>
            </div>
        </main>
    );
}
