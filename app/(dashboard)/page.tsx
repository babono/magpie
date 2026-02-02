import {
  getMetricsWithTimeSeries,
  getOrdersByStatus,
  getProductsByCategory,
  getRecentOrders,
  getRevenueInsightData,
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
    getRevenueInsightData(),
    getLastSyncTime(),
  ]);

  return (
    <div className="flex-1 space-y-3 p-3 pt-4 sm:space-y-4 sm:p-8 sm:pt-6">
      <AutoRefresh intervalMs={300000} />
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-xl sm:text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <LastSynced timestamp={lastSyncTime} />
        </div>
      </div>

      {/* Analytics Metrics Tabs */}
      <MetricsTabs metrics={metricsData} />

      {/* Main Charts */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-8">
        <div className="col-span-4">
          <StatusDistribution data={statusData} />
        </div>
        <div className="col-span-4">
          {/* Placeholder for another chart or just layout spacing */}
          <CategoryDistribution data={categoryData} />
        </div>
      </div>

      {/* Tables - Full Width */}
      <div className="space-y-4">
        <RecentOrders orders={recentOrders} />
        <TopProducts products={topProducts} />
      </div>

      {/* Secondary Charts Setup */}

      <RevenueInsight data={revenueData} />
      {/* Reusing space efficiently, or sticking to the grid */}


    </div>
  );
}
