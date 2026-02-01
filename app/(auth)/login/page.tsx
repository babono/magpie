"use client";

import { signIn, useSession } from "next-auth/react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const ParticlesCanvas = dynamic(() => import("./particle"), { ssr: false });

export default function LoginPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [email, setEmail] = useState("demo@magpieiq.com");
    const [password, setPassword] = useState("magpieiq");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (status === "loading") return;
        if (session) router.push("/");
    }, [session, status, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        const res = await signIn("credentials", {
            redirect: false,
            email,
            password,
        });

        if (res?.error) {
            setError(res.error);
            setLoading(false);
        } else {
            router.push("/");
        }
    };

    return (
        <div className="relative min-h-screen">
            <ParticlesCanvas />
            <div className="flex flex-col items-center justify-center min-h-screen relative z-10 px-4">
                {/* Login Form */}
                <form
                    onSubmit={handleSubmit}
                    className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md"
                >
                    {/* Logo and Branding */}
                    <div className="mb-8 flex flex-col items-center">
                        <Image
                            src="/logo-magpie.png"
                            alt="MagpieIQ"
                            width={223}
                            height={92}
                            className="mb-2"
                            priority
                        />
                        <div className="bg-[#F6C95F] px-6 py-2 rounded-lg mb-4 shadow-sm inline-block">
                            <h1 className="text-5xl font-bold text-[#4F4D42] tracking-tight m-0">CORVID</h1>
                        </div>
                        <p className="text-gray-500 text-xs font-medium tracking-widest uppercase text-center">
                            <span className="text-zinc-900 font-bold">C</span>ommerce <span className="text-zinc-900 font-bold">O</span>rder <span className="text-zinc-900 font-bold">R</span>eporting & <span className="text-zinc-900 font-bold">V</span>isualization <span className="text-zinc-900 font-bold">I</span>ntelligence <span className="text-zinc-900 font-bold">D</span>ashboard
                        </p>
                    </div>
                    {error && (
                        <p className="text-red-500 mb-4 text-center text-sm bg-red-50 p-2 rounded">
                            {error}
                        </p>
                    )}
                    <div className="mb-4">
                        <label className="block mb-2 font-medium text-gray-700">
                            Email
                        </label>
                        <input
                            type="email"
                            className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-transparent transition"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="you@example.com"
                            disabled={loading}
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block mb-2 font-medium text-gray-700">
                            Password
                        </label>
                        <input
                            type="password"
                            className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-transparent transition"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="Your password"
                            disabled={loading}
                        />
                    </div>
                    <button
                        type="submit"
                        className={`cursor-pointer w-full bg-zinc-600 text-white font-semibold py-3 rounded-lg hover:bg-zinc-700 transition-colors ${loading ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                        disabled={loading}
                    >
                        {loading ? "Logging in..." : "Login"}
                    </button>
                </form>
            </div>
        </div>
    );
}
