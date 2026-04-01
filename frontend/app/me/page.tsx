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

type RecordFormState = {
    amount: string;
    type: "INCOME" | "EXPENSE";
    category: string;
    entryDate: string;
    notes: string;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const emptyForm: RecordFormState = {
    amount: "",
    type: "INCOME",
    category: "",
    entryDate: new Date().toISOString().slice(0, 10),
    notes: "",
};

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
    const [formState, setFormState] = useState<RecordFormState>(emptyForm);
    const [submitting, setSubmitting] = useState(false);

    const canReadRecords = user?.role === "ADMIN" || user?.role === "ANALYST";
    const canCreateRecords = user?.role === "ADMIN";

    const loadDashboard = async () => {
        const [meRes, summaryRes] = await Promise.all([
            axios.get(`${API_BASE_URL}/api/users/me`, { withCredentials: true }),
            axios.get(`${API_BASE_URL}/api/dashboard/summary`, { withCredentials: true }),
        ]);

        const nextUser = meRes.data.user ?? null;
        setUser(nextUser);
        setSummary(summaryRes.data ?? null);

        if (nextUser?.role === "ADMIN" || nextUser?.role === "ANALYST") {
            const recordsRes = await axios.get(`${API_BASE_URL}/api/records?pageSize=10`, {
                withCredentials: true,
            });

            setRecords(Array.isArray(recordsRes.data.records) ? recordsRes.data.records : []);
            setRecordsError(null);
            return;
        }

        setRecords([]);
        setRecordsError(null);
    };

    useEffect(() => {
        const bootstrap = async () => {
            try {
                await loadDashboard();
            } catch (error) {
                console.error("Failed to load dashboard", error);
                router.push("/login");
                return;
            } finally {
                setLoading(false);
            }
        };

        bootstrap();
    }, [router]);

    const handleLogout = async () => {
        try {
            await axios.post(`${API_BASE_URL}/api/auth/logout`, {}, { withCredentials: true });
        } finally {
            router.push("/login");
        }
    };

    const handleCreateRecord = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!canCreateRecords) {
            return;
        }

        setSubmitting(true);

        try {
            await axios.post(
                `${API_BASE_URL}/api/records`,
                {
                    amount: formState.amount.trim(),
                    type: formState.type,
                    category: formState.category.trim(),
                    entryDate: new Date(`${formState.entryDate}T00:00:00.000Z`).toISOString(),
                    notes: formState.notes.trim() || null,
                },
                { withCredentials: true }
            );

            setFormState({
                ...emptyForm,
                entryDate: formState.entryDate,
            });
            await loadDashboard();
        } catch (error) {
            alert(parseErrorMessage(error, "Unable to create record."));
        } finally {
            setSubmitting(false);
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

                    <button onClick={handleLogout} className="app-button-ghost">
                        Logout
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    {[
                        ["Income", summary.totals.income],
                        ["Expenses", summary.totals.expenses],
                        ["Net Balance", summary.totals.netBalance],
                        ["Records", String(summary.totals.recordCount)],
                    ].map(([label, value]) => (
                        <div key={label} className="app-panel p-5">
                            <div className="text-xs uppercase tracking-wide text-gray-400">{label}</div>
                            <div className="mt-2 text-3xl font-semibold text-white">
                                {label === "Records" ? value : `₹ ${formatAmount(value)}`}
                            </div>
                        </div>
                    ))}
                </div>

                {canCreateRecords ? (
                    <section className="app-panel p-6">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-semibold text-white">Create Record</h2>
                                <p className="mt-1 text-sm text-gray-400">
                                    Quick entry form for demoing the admin workflow.
                                </p>
                            </div>
                            <a
                                href={`${API_BASE_URL}/api/docs`}
                                target="_blank"
                                rel="noreferrer"
                                className="app-button-ghost"
                            >
                                API Docs
                            </a>
                        </div>

                        <form onSubmit={handleCreateRecord} className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                            <input
                                value={formState.amount}
                                onChange={(event) => setFormState((current) => ({ ...current, amount: event.target.value }))}
                                placeholder="Amount in smallest unit"
                                inputMode="numeric"
                                className="app-input"
                                required
                            />
                            <select
                                value={formState.type}
                                onChange={(event) =>
                                    setFormState((current) => ({
                                        ...current,
                                        type: event.target.value as "INCOME" | "EXPENSE",
                                    }))
                                }
                                className="app-input"
                            >
                                <option value="INCOME">INCOME</option>
                                <option value="EXPENSE">EXPENSE</option>
                            </select>
                            <input
                                value={formState.category}
                                onChange={(event) => setFormState((current) => ({ ...current, category: event.target.value }))}
                                placeholder="Category"
                                className="app-input"
                                required
                            />
                            <input
                                type="date"
                                value={formState.entryDate}
                                onChange={(event) => setFormState((current) => ({ ...current, entryDate: event.target.value }))}
                                className="app-input"
                                required
                            />
                            <textarea
                                value={formState.notes}
                                onChange={(event) => setFormState((current) => ({ ...current, notes: event.target.value }))}
                                placeholder="Notes"
                                className="app-input min-h-28 md:col-span-2"
                            />
                            <button type="submit" disabled={submitting} className="app-button-primary md:w-fit">
                                {submitting ? "Saving..." : "Create Record"}
                            </button>
                        </form>
                    </section>
                ) : null}

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <section className="app-panel p-6">
                        <h2 className="text-lg font-semibold text-white">Category Totals</h2>
                        <div className="mt-4 space-y-3">
                            {summary.categoryTotals.length === 0 ? (
                                <p className="text-sm text-gray-400">No records yet.</p>
                            ) : (
                                summary.categoryTotals.map((item) => (
                                    <div key={item.category} className="rounded-xl border border-white/10 p-4">
                                        <div className="font-medium text-white">{item.category}</div>
                                        <div className="mt-2 text-sm text-gray-300">Income: ₹ {formatAmount(item.income)}</div>
                                        <div className="text-sm text-gray-300">Expenses: ₹ {formatAmount(item.expenses)}</div>
                                        <div className="text-sm text-gray-300">Net: ₹ {formatAmount(item.net)}</div>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>

                    <section className="app-panel p-6">
                        <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
                        <div className="mt-4 space-y-3">
                            {summary.recentActivity.length === 0 ? (
                                <p className="text-sm text-gray-400">No recent activity.</p>
                            ) : (
                                summary.recentActivity.map((record) => (
                                    <div key={record.id} className="rounded-xl border border-white/10 p-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="font-medium text-white">{record.category}</div>
                                            <div className="text-sm text-white">
                                                {record.type === "INCOME" ? "+" : "-"}₹ {formatAmount(record.amount)}
                                            </div>
                                        </div>
                                        <div className="mt-1 text-sm text-gray-400">
                                            {new Date(record.entryDate).toLocaleDateString("en-IN")}
                                        </div>
                                        {record.notes ? <div className="mt-2 text-sm text-gray-300">{record.notes}</div> : null}
                                    </div>
                                ))
                            )}
                        </div>
                    </section>
                </div>

                <section className="app-panel p-6">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-semibold text-white">Latest Records</h2>
                            <p className="mt-1 text-sm text-gray-400">
                                {canReadRecords
                                    ? "Recent records visible for analyst and admin roles."
                                    : "Viewers can see summaries, but not raw record listings."}
                            </p>
                        </div>
                        {recordsError ? <span className="text-sm text-amber-300">{recordsError}</span> : null}
                    </div>

                    {canReadRecords ? (
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
                                                No records found yet.
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
                                                <td className="px-3 py-3 text-gray-200">₹ {formatAmount(record.amount)}</td>
                                                <td className="px-3 py-3 text-gray-400">{record.notes || "—"}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="mt-4 rounded-xl border border-dashed border-white/10 p-5 text-sm text-gray-400">
                            This account is a viewer, so it can access aggregate dashboard data but not the underlying record list.
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}
