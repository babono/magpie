import { Navbar } from "@/components/dashboard/Navbar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-[#FEF8D6]">
            <Navbar />
            <main className="pt-16 px-3 pb-4 md:pt-20 md:px-8 md:pb-8">
                <div className="w-full max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
