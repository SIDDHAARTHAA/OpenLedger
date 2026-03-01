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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const formatBalance = (value: string) => {
    const asNumber = Number(value);

    if (!Number.isFinite(asNumber)) {
        return value;
    }

    return asNumber.toLocaleString("en-IN");
};

export default function DashboardPage() {
    const [user, setUser] = useState<User | null>(null);
    const [balance, setBalance] = useState("0");
    const [loading, setLoading] = useState(true);
    const [depositAmount, setDepositAmount] = useState("");
    const [depositing, setDepositing] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const fetchUserAndBalance = async () => {
            try {
                const [meRes, balanceRes] = await Promise.all([
                    axios.get(`${API_BASE_URL}/api/user/me`, {
                        withCredentials: true,
                    }),
                    axios.get(`${API_BASE_URL}/api/user/balance`, {
                        withCredentials: true,
                    }),
                ]);

                if (!meRes.data.user) {
                    router.push("/login");
                    return;
                }

                setUser(meRes.data.user);
                setBalance(balanceRes.data.balance ?? "0");
            } catch (error) {
                console.error("Failed to fetch user", error);
                router.push("/login");
            } finally {
                setLoading(false);
            }
        };

        fetchUserAndBalance();
    }, [router]);

    const handleDeposit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!/^[1-9][0-9]*$/.test(depositAmount.trim())) {
            alert("Enter a valid positive whole number.");
            return;
        }

        setDepositing(true);

        try {
            const response = await axios.post(
                `${API_BASE_URL}/api/deposit`,
                { amount: depositAmount.trim() },
                { withCredentials: true }
            );

            const redirectUrl = response.data?.url as string | undefined;

            if (!redirectUrl) {
                alert("Bank redirect URL is missing.");
                return;
            }

            window.location.href = redirectUrl;
        } catch (error) {
            console.error("Deposit initiation failed", error);
            alert("Unable to initiate deposit right now.");
        } finally {
            setDepositing(false);
        }
    };

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
                            ₹ {formatBalance(balance)}
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

                <div className="mt-8 border border-white/10 rounded-lg bg-white/5 backdrop-blur-sm p-6">
                    <h2 className="text-gray-300 text-sm font-medium mb-4">Add Balance</h2>

                    <form onSubmit={handleDeposit} className="flex flex-col sm:flex-row gap-3">
                        <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder="Enter amount"
                            value={depositAmount}
                            onChange={(event) => setDepositAmount(event.target.value)}
                            className="flex-1 bg-transparent border border-white/20 px-4 py-3 text-sm outline-none focus:border-[#00B5EF]"
                            required
                        />
                        <button
                            type="submit"
                            disabled={depositing}
                            className="px-6 py-3 bg-[#00B5EF] text-black text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {depositing ? "Redirecting..." : "Add"}
                        </button>
                    </form>
                </div>
            </div>
        </main>
    );
}
