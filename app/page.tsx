import {
  getDashboardMetrics,
  getOrdersByStatus,
  getProductsByCategory,
  getRecentOrders,
  getRevenueByCategory,
  getTopProducts,
} from "@/app/actions";
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Star,
  Activity,
} from "lucide-react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { RecentOrders } from "@/components/dashboard/RecentOrders";
import { TopProducts } from "@/components/dashboard/TopProducts";
import { StatusDistribution } from "@/components/dashboard/StatusDistribution";
import { CategoryDistribution } from "@/components/dashboard/CategoryDistribution";
import { RevenueInsight } from "@/components/dashboard/RevenueInsight";

// Force dynamic rendering since we want fresh data on every load
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // Fetch data in parallel
  const [
    metrics,
    recentOrders,
    topProducts,
    statusData,
    categoryData,
    revenueData,
  ] = await Promise.all([
    getDashboardMetrics(),
    getRecentOrders(),
    getTopProducts(),
    getOrdersByStatus(),
    getProductsByCategory(),
    getRevenueByCategory(),
  ]);

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          {/* <Button>Download</Button> */}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Revenue"
          value={`$${metrics.revenue.toFixed(2)}`}
          icon={DollarSign}
          description="Lifetime revenue"
        />
        <MetricCard
          title="Total Orders"
          value={metrics.totalOrders}
          icon={ShoppingCart}
          description="Total orders processed"
        />
        <MetricCard
          title="Avg. Order Value"
          value={`$${metrics.avgOrderValue.toFixed(2)}`}
          icon={TrendingUp}
          description="Per order average"
        />
        <MetricCard
          title="Avg. Product Rating"
          value={metrics.avgRating.toFixed(1)}
          icon={Star}
          description="Across all products"
        />
      </div>

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
