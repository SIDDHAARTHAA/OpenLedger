// frontend/app/login/page.tsx
export default function LoginPage() {
    return (
        <main className="min-h-screen flex items-center justify-center px-6">
            <div className="w-full max-w-sm border border-white/10 p-8">
                <h2 className="text-2xl font-semibold mb-6 font-[var(--font-plex)]">
                    Login
                </h2>

                {/* Google login */}
                <a
                    href="http://localhost:4000/api/auth/google"
                    className="block w-full text-center py-3 bg-[#00B5EF] text-black text-sm font-medium mb-6"
                >
                    Continue with Google
                </a>

                <div className="text-center text-white/40 text-sm mb-6">
                    or
                </div>

                {/* Email login */}
                <form className="space-y-4">
                    <input
                        type="email"
                        placeholder="Email"
                        className="w-full bg-transparent border border-white/20 px-4 py-3 text-sm outline-none focus:border-[#00B5EF]"
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        className="w-full bg-transparent border border-white/20 px-4 py-3 text-sm outline-none focus:border-[#00B5EF]"
                    />

                    <button
                        type="submit"
                        className="w-full py-3 border border-[#00B5EF] text-[#00B5EF] text-sm"
                    >
                        Login
                    </button>
                </form>
            </div>
        </main>
    );
}
