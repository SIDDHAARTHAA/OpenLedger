"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type User = {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
    role: "VIEWER" | "ANALYST" | "ADMIN";
    status: "ACTIVE" | "INACTIVE";
};

type DashboardSummary = {
    totals: {
        income: string;
        expenses: string;
        netBalance: string;
        recordCount: number;
    };
    categoryTotals: Array<{
        category: string;
        income: string;
        expenses: string;
        net: string;
    }>;
    recentActivity: Array<{
        id: string;
        amount: string;
        type: "INCOME" | "EXPENSE";
        category: string;
        entryDate: string;
        notes: string | null;
        createdAt: string;
    }>;
};

type RecordItem = {
    id: string;
    amount: string;
    type: "INCOME" | "EXPENSE";
    category: string;
    entryDate: string;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const formatAmount = (value: string) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed.toLocaleString("en-IN") : value;
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
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const [summary, setSummary] = useState<DashboardSummary | null>(null);
    const [records, setRecords] = useState<RecordItem[]>([]);
    const [recordsError, setRecordsError] = useState<string | null>(null);

    useEffect(() => {
        const loadDashboard = async () => {
            try {
                const [meRes, summaryRes] = await Promise.all([
                    axios.get(`${API_BASE_URL}/api/users/me`, { withCredentials: true }),
                    axios.get(`${API_BASE_URL}/api/dashboard/summary`, { withCredentials: true }),
                ]);

                setUser(meRes.data.user ?? null);
                setSummary(summaryRes.data ?? null);

                try {
                    const recordsRes = await axios.get(`${API_BASE_URL}/api/records?pageSize=10`, {
                        withCredentials: true,
                    });

                    setRecords(Array.isArray(recordsRes.data.records) ? recordsRes.data.records : []);
                    setRecordsError(null);
                } catch (error) {
                    setRecords([]);
                    setRecordsError(parseErrorMessage(error, "Unable to load records."));
                }
            } catch (error) {
                console.error("Failed to load dashboard", error);
                router.push("/login");
                return;
            } finally {
                setLoading(false);
            }
        };

        loadDashboard();
    }, [router]);

    const handleLogout = async () => {
        try {
            await axios.post(`${API_BASE_URL}/api/auth/logout`, {}, { withCredentials: true });
        } finally {
            router.push("/login");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-white">
                Loading...
            </div>
        );
    }

    if (!user || !summary) {
        return null;
    }

    return (
        <main className="min-h-screen p-8">
            <div className="max-w-5xl mx-auto space-y-8">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white font-[var(--font-plex)]">
                            Finance Dashboard
                        </h1>
                        <p className="mt-2 text-sm text-gray-400">
                            Signed in as {user.name || user.email} · {user.role} · {user.status}
                        </p>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 border border-white/20 text-white text-sm hover:bg-white/10 transition-colors"
                    >
                        Logout
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <div className="rounded-lg border border-white/10 bg-white/5 p-5">
                        <div className="text-xs uppercase tracking-wide text-gray-400">Income</div>
                        <div className="mt-2 text-3xl font-semibold text-white">
                            ₹ {formatAmount(summary.totals.income)}
                        </div>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-white/5 p-5">
                        <div className="text-xs uppercase tracking-wide text-gray-400">Expenses</div>
                        <div className="mt-2 text-3xl font-semibold text-white">
                            ₹ {formatAmount(summary.totals.expenses)}
                        </div>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-white/5 p-5">
                        <div className="text-xs uppercase tracking-wide text-gray-400">Net Balance</div>
                        <div className="mt-2 text-3xl font-semibold text-white">
                            ₹ {formatAmount(summary.totals.netBalance)}
                        </div>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-white/5 p-5">
                        <div className="text-xs uppercase tracking-wide text-gray-400">Records</div>
                        <div className="mt-2 text-3xl font-semibold text-white">
                            {summary.totals.recordCount}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <section className="rounded-lg border border-white/10 bg-white/5 p-6">
                        <h2 className="text-lg font-semibold text-white">Category Totals</h2>
                        <div className="mt-4 space-y-3">
                            {summary.categoryTotals.length === 0 ? (
                                <p className="text-sm text-gray-400">No records yet.</p>
                            ) : (
                                summary.categoryTotals.map((item) => (
                                    <div key={item.category} className="rounded-md border border-white/10 p-4">
                                        <div className="font-medium text-white">{item.category}</div>
                                        <div className="mt-2 text-sm text-gray-300">
                                            Income: ₹ {formatAmount(item.income)}
                                        </div>
                                        <div className="text-sm text-gray-300">
                                            Expenses: ₹ {formatAmount(item.expenses)}
                                        </div>
                                        <div className="text-sm text-gray-300">
                                            Net: ₹ {formatAmount(item.net)}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>

                    <section className="rounded-lg border border-white/10 bg-white/5 p-6">
                        <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
                        <div className="mt-4 space-y-3">
                            {summary.recentActivity.length === 0 ? (
                                <p className="text-sm text-gray-400">No recent activity.</p>
                            ) : (
                                summary.recentActivity.map((record) => (
                                    <div key={record.id} className="rounded-md border border-white/10 p-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="font-medium text-white">{record.category}</div>
                                            <div className="text-sm text-white">
                                                {record.type === "INCOME" ? "+" : "-"}₹ {formatAmount(record.amount)}
                                            </div>
                                        </div>
                                        <div className="mt-1 text-sm text-gray-400">
                                            {new Date(record.entryDate).toLocaleDateString("en-IN")}
                                        </div>
                                        {record.notes ? (
                                            <div className="mt-2 text-sm text-gray-300">{record.notes}</div>
                                        ) : null}
                                    </div>
                                ))
                            )}
                        </div>
                    </section>
                </div>

                <section className="rounded-lg border border-white/10 bg-white/5 p-6">
                    <div className="flex items-center justify-between gap-4">
                        <h2 className="text-lg font-semibold text-white">Latest Records</h2>
                        {recordsError ? (
                            <span className="text-sm text-amber-300">{recordsError}</span>
                        ) : null}
                    </div>

                    <div className="mt-4 overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead className="text-gray-400">
                                <tr>
                                    <th className="px-3 py-2 font-medium">Date</th>
                                    <th className="px-3 py-2 font-medium">Type</th>
                                    <th className="px-3 py-2 font-medium">Category</th>
                                    <th className="px-3 py-2 font-medium">Amount</th>
                                    <th className="px-3 py-2 font-medium">Notes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {records.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-3 py-4 text-gray-400">
                                            No record data available for this role yet.
                                        </td>
                                    </tr>
                                ) : (
                                    records.map((record) => (
                                        <tr key={record.id} className="border-t border-white/10">
                                            <td className="px-3 py-3 text-gray-200">
                                                {new Date(record.entryDate).toLocaleDateString("en-IN")}
                                            </td>
                                            <td className="px-3 py-3 text-gray-200">{record.type}</td>
                                            <td className="px-3 py-3 text-gray-200">{record.category}</td>
                                            <td className="px-3 py-3 text-gray-200">
                                                ₹ {formatAmount(record.amount)}
                                            </td>
                                            <td className="px-3 py-3 text-gray-400">
                                                {record.notes || "—"}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </main>
    );
}
