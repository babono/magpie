"use client";

import { AuthGuard } from "@/components/AuthGuard";

export function DashboardWrapper({ children }: { children: React.ReactNode }) {
    return <AuthGuard>{children}</AuthGuard>;
}
