"use client";

import Image from "next/image";
import { signOut, useSession } from "next-auth/react";

export function Navbar() {
    const { data: session } = useSession();

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center">
                <Image
                    src="/logo-magpie.png"
                    alt="MagpieIQ"
                    width={140}
                    height={60}
                    className="h-8 w-auto object-contain"
                    priority
                />
                <div className="mx-4 h-6 w-px bg-gray-200"></div>
                <span className="text-gray-500 font-medium">SupplySense</span>
            </div>

            <div className="flex items-center gap-6">
                {session?.user?.email && (
                    <span className="text-sm font-medium text-gray-600">
                        {session.user.email}
                    </span>
                )}
                <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="bg-red-500 hover:bg-red-600 text-white text-sm font-semibold py-2 px-4 rounded transition-colors"
                >
                    Sign Out
                </button>
            </div>
        </nav>
    );
}
