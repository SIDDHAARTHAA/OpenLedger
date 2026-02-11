"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignupPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleGoogleSignup = (e: React.MouseEvent) => {
        e.preventDefault();
        const width = 500;
        const height = 600;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;

        const popup = window.open(
            "http://localhost:4000/api/auth/google",
            "Google Signup",
            `width=${width},height=${height},left=${left},top=${top}`
        );

        const messageHandler = (event: MessageEvent) => {
            if (event.data === "login-success") {
                window.removeEventListener("message", messageHandler);
                router.push("/me");
            }
        };

        window.addEventListener("message", messageHandler);
    };

    const handleEmailSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post(
                "http://localhost:4000/api/auth/signup",
                { name, email, password },
                { withCredentials: true }
            );
            router.push("/me");
        } catch (error) {
            console.error("Signup failed", error);
            alert("Signup failed. Please check your details.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center px-6">
            <div className="w-full max-w-sm border border-white/10 p-8">
                <h2 className="text-2xl font-semibold mb-6 font-[var(--font-plex)]">
                    Create account
                </h2>

                {/* Google signup */}
                <button
                    onClick={handleGoogleSignup}
                    className="block w-full text-center py-3 bg-[#00B5EF] text-black text-sm font-medium mb-6 hover:opacity-90 transition-opacity"
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
                        className="w-full bg-transparent border border-white/20 px-4 py-3 text-sm outline-none focus:border-[#00B5EF]"
                        required
                    />
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-transparent border border-white/20 px-4 py-3 text-sm outline-none focus:border-[#00B5EF]"
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-transparent border border-white/20 px-4 py-3 text-sm outline-none focus:border-[#00B5EF]"
                        required
                    />

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 border border-[#00B5EF] text-[#00B5EF] text-sm hover:bg-[#00B5EF]/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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
