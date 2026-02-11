"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

interface User {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
}

export default function DashboardPage() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await axios.get("http://localhost:4000/api/user/me", {
                    withCredentials: true // Important for cookies
                });
                if (res.data.user) {
                    setUser(res.data.user);
                } else {
                    router.push("/login"); // Redirect if not logged in
                }
            } catch (error) {
                console.error("Failed to fetch user", error);
                router.push("/login");
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-white">
                Loading...
            </div>
        );
    }

    if (!user) return null;

    return (
        <main className="min-h-screen p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-white mb-8 font-[var(--font-plex)]">
                    Dashboard
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Balance Card */}
                    <div className="p-6 border border-white/10 rounded-lg bg-white/5 backdrop-blur-sm">
                        <h2 className="text-gray-400 text-sm font-medium mb-2">Total Balance</h2>
                        <div className="text-4xl font-semibold text-white">
                            ₹ 0.00
                        </div>
                        <div className="mt-4 text-xs text-gray-500">
                            Available for transfer
                        </div>
                    </div>

                    {/* User Details Card */}
                    <div className="p-6 border border-white/10 rounded-lg bg-white/5 backdrop-blur-sm">
                        <h2 className="text-gray-400 text-sm font-medium mb-4">Profile</h2>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-[#00B5EF] flex items-center justify-center text-black font-bold text-xl">
                                {user.name ? user.name[0].toUpperCase() : user.email[0].toUpperCase()}
                            </div>
                            <div>
                                <div className="text-white font-medium">{user.name || "User"}</div>
                                <div className="text-gray-400 text-sm">{user.email}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
