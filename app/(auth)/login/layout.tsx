import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Login | CORVID by Magpie",
    description: "Login to CORVID by Magpie",
};

export default function LoginLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return children;
}
