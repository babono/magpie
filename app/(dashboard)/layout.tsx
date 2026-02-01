import { Navbar } from "@/components/dashboard/Navbar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-[#FEF8D6]">
            <Navbar />
            <main className="pt-20 px-8 pb-8">
                <div className="w-full max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
