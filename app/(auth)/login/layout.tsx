import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Providers } from "@/app/providers";
import "@/app/globals.css";

const geist = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Login | MagpieIQ",
    description: "Login to MagpieIQ Dashboard",
};

export default function LoginLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={`${geist.variable} antialiased`}>
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
