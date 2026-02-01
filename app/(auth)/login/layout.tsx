import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Login | MagpieIQ",
    description: "Login to MagpieIQ Dashboard",
};

export default function LoginLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return children;
}
