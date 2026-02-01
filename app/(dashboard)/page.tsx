import {
  getMetricsWithTimeSeries,
  getOrdersByStatus,
  getProductsByCategory,
  getRecentOrders,
  getRevenueByCategory,
  getTopProducts,
  getLastSyncTime,
} from "@/app/actions";
import { RecentOrders } from "@/components/dashboard/RecentOrders";
import { TopProducts } from "@/components/dashboard/TopProducts";
import { StatusDistribution } from "@/components/dashboard/StatusDistribution";
import { CategoryDistribution } from "@/components/dashboard/CategoryDistribution";
import { RevenueInsight } from "@/components/dashboard/RevenueInsight";
import { AutoRefresh } from "@/components/dashboard/AutoRefresh";
import { LastSynced } from "@/components/dashboard/LastSynced";
import { MetricsTabs } from "@/components/dashboard/MetricsTabs";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

// Force dynamic rendering since we want fresh data on every load
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // Check for session - redirect to login if not authenticated
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  // Fetch data in parallel
  const [
    metricsData,
    recentOrders,
    topProducts,
    statusData,
    categoryData,
    revenueData,
    lastSyncTime,
  ] = await Promise.all([
    getMetricsWithTimeSeries(),
    getRecentOrders(),
    getTopProducts(),
    getOrdersByStatus(),
    getProductsByCategory(),
    getRevenueByCategory(),
    getLastSyncTime(),
  ]);

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <AutoRefresh intervalMs={300000} />
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <LastSynced timestamp={lastSyncTime} />
        </div>
      </div>

      {/* Analytics Metrics Tabs */}
      <MetricsTabs metrics={metricsData} />

      {/* Main Charts */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4">
          <RevenueInsight data={revenueData} />
        </div>
        <div className="col-span-3">
          {/* Placeholder for another chart or just layout spacing */}
          <CategoryDistribution data={categoryData} />
        </div>
      </div>

      {/* Secondary Charts Setup */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        <StatusDistribution data={statusData} />
        {/* Reusing space efficiently, or sticking to the grid */}
      </div>

      {/* Tables */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4">
          <RecentOrders orders={recentOrders} />
        </div>
        <div className="col-span-3">
          <TopProducts products={topProducts} />
        </div>
      </div>
    </div>
  );
}
