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

interface CatalogAsset {
    id: string;
    name: string;
    description: string;
    price: string;
}

interface OwnedAsset {
    assetId: string;
    assetName: string;
    price: string;
    createdAt: string;
    transactionRef: string | null;
}

interface LedgerTransaction {
    id: string;
    type: string;
    status: string;
    amount: string;
    reference: string | null;
    createdAt: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const formatBalance = (value: string) => {
    const asNumber = Number(value);

    if (!Number.isFinite(asNumber)) {
        return value;
    }

    return asNumber.toLocaleString("en-IN");
};

const parseErrorMessage = (error: unknown, fallback: string) => {
    if (axios.isAxiosError(error)) {
        const message = error.response?.data?.error;
        if (typeof message === "string" && message.length > 0) {
            return message;
        }
    }

    return fallback;
};

export default function DashboardPage() {
    const [user, setUser] = useState<User | null>(null);
    const [balance, setBalance] = useState("0");
    const [assets, setAssets] = useState<CatalogAsset[]>([]);
    const [ownedAssets, setOwnedAssets] = useState<OwnedAsset[]>([]);
    const [recentTransactions, setRecentTransactions] = useState<LedgerTransaction[]>([]);
    const [loading, setLoading] = useState(true);

    const [depositAmount, setDepositAmount] = useState("");
    const [depositing, setDepositing] = useState(false);

    const [withdrawAmount, setWithdrawAmount] = useState("");
    const [withdrawing, setWithdrawing] = useState(false);

    const [buyingAssetId, setBuyingAssetId] = useState<string | null>(null);

    const router = useRouter();

    const loadDashboard = async () => {
        const [meRes, balanceRes, catalogRes, ownedRes, transactionRes] = await Promise.all([
            axios.get(`${API_BASE_URL}/api/user/me`, { withCredentials: true }),
            axios.get(`${API_BASE_URL}/api/user/balance`, { withCredentials: true }),
            axios.get(`${API_BASE_URL}/api/assets/catalog`, { withCredentials: true }),
            axios.get(`${API_BASE_URL}/api/assets/my`, { withCredentials: true }),
            axios.get(`${API_BASE_URL}/api/transaction`, { withCredentials: true }),
        ]);

        if (!meRes.data.user) {
            router.push("/login");
            return;
        }

        setUser(meRes.data.user);
        setBalance(balanceRes.data.balance ?? "0");
        setAssets(Array.isArray(catalogRes.data.assets) ? catalogRes.data.assets : []);
        setOwnedAssets(Array.isArray(ownedRes.data.purchases) ? ownedRes.data.purchases : []);
        setRecentTransactions(Array.isArray(transactionRes.data.transactions) ? transactionRes.data.transactions : []);
    };

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                await loadDashboard();
            } catch (error) {
                console.error("Failed to fetch dashboard", error);
                router.push("/login");
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
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

    const handleWithdraw = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!/^[1-9][0-9]*$/.test(withdrawAmount.trim())) {
            alert("Enter a valid positive whole number.");
            return;
        }

        setWithdrawing(true);

        try {
            const response = await axios.post(
                `${API_BASE_URL}/api/withdraw`,
                { amount: withdrawAmount.trim() },
                { withCredentials: true }
            );

            setBalance(response.data?.balance ?? balance);
            setWithdrawAmount("");
            await loadDashboard();
        } catch (error) {
            console.error("Withdraw failed", error);
            alert(parseErrorMessage(error, "Unable to withdraw right now."));
        } finally {
            setWithdrawing(false);
        }
    };

    const handleBuyAsset = async (assetId: string) => {
        setBuyingAssetId(assetId);

        try {
            const response = await axios.post(
                `${API_BASE_URL}/api/assets/buy`,
                { assetId },
                { withCredentials: true }
            );

            setBalance(response.data?.balance ?? balance);
            await loadDashboard();
        } catch (error) {
            console.error("Asset purchase failed", error);
            alert(parseErrorMessage(error, "Unable to purchase this asset."));
        } finally {
            setBuyingAssetId(null);
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

    const ownedSet = new Set(ownedAssets.map((asset) => asset.assetId));

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

                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border border-white/10 rounded-lg bg-white/5 backdrop-blur-sm p-6">
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

                    <div className="border border-white/10 rounded-lg bg-white/5 backdrop-blur-sm p-6">
                        <h2 className="text-gray-300 text-sm font-medium mb-4">Withdraw To Bank</h2>

                        <form onSubmit={handleWithdraw} className="flex flex-col sm:flex-row gap-3">
                            <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                placeholder="Enter amount"
                                value={withdrawAmount}
                                onChange={(event) => setWithdrawAmount(event.target.value)}
                                className="flex-1 bg-transparent border border-white/20 px-4 py-3 text-sm outline-none focus:border-[#00B5EF]"
                                required
                            />
                            <button
                                type="submit"
                                disabled={withdrawing}
                                className="px-6 py-3 border border-[#00B5EF] text-[#00B5EF] text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {withdrawing ? "Processing..." : "Withdraw"}
                            </button>
                        </form>
                    </div>
                </div>

                <div className="mt-8 border border-white/10 rounded-lg bg-white/5 backdrop-blur-sm p-6">
                    <h2 className="text-gray-300 text-sm font-medium mb-4">Inbuilt Asset Store</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {assets.map((asset) => {
                            const owned = ownedSet.has(asset.id);
                            const buying = buyingAssetId === asset.id;

                            return (
                                <div key={asset.id} className="border border-white/10 rounded-lg p-4">
                                    <div className="text-white font-medium">{asset.name}</div>
                                    <div className="text-white/60 text-sm mt-1">{asset.description}</div>
                                    <div className="mt-3 text-[#00B5EF] font-medium">₹ {formatBalance(asset.price)}</div>
                                    <button
                                        type="button"
                                        disabled={owned || buyingAssetId !== null}
                                        onClick={() => handleBuyAsset(asset.id)}
                                        className="mt-4 px-4 py-2 text-sm border border-[#00B5EF] text-[#00B5EF] disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {owned ? "Owned" : buying ? "Buying..." : "Buy Now"}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border border-white/10 rounded-lg bg-white/5 backdrop-blur-sm p-6">
                        <h2 className="text-gray-300 text-sm font-medium mb-4">Owned Assets</h2>
                        <div className="space-y-3">
                            {ownedAssets.length === 0 ? (
                                <div className="text-white/60 text-sm">No purchases yet.</div>
                            ) : (
                                ownedAssets.map((asset) => (
                                    <div key={asset.assetId} className="border border-white/10 rounded-lg p-3">
                                        <div className="text-white text-sm font-medium">{asset.assetName}</div>
                                        <div className="text-white/60 text-xs mt-1">
                                            ₹ {formatBalance(asset.price)} • {new Date(asset.createdAt).toLocaleString()}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="border border-white/10 rounded-lg bg-white/5 backdrop-blur-sm p-6">
                        <h2 className="text-gray-300 text-sm font-medium mb-4">Recent Transactions</h2>
                        <div className="space-y-3">
                            {recentTransactions.length === 0 ? (
                                <div className="text-white/60 text-sm">No transactions yet.</div>
                            ) : (
                                recentTransactions.slice(0, 8).map((txn) => (
                                    <div key={txn.id} className="border border-white/10 rounded-lg p-3">
                                        <div className="text-white text-sm font-medium">
                                            {txn.type} • {txn.status}
                                        </div>
                                        <div className="text-white/60 text-xs mt-1">
                                            ₹ {formatBalance(txn.amount)} • {txn.reference ?? "no-ref"}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
