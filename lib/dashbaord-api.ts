import api from "@/utils/api"

export interface CategorySales {
  categoryId: string;
  categoryName: string;
  sales: number;
  orderCount: number;
  itemsSold: number;
}

export interface DashboardData {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  newCustomers: number;
  popularItems: Array<{ name: string; orders: number }>;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    orderType: string;
    total: number;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';
    paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
    paymentMethod: string;
    createdAt: string;
  }>;
  revenueData: Array<{ date: string; revenue: number }>;
  orderTrends: Array<{ date: string; count: number }>;
  ordersByStatus: Record<string, number>;
  revenueByStatus: Record<string, number>;
  paymentBreakdown: {
    byMethod: Record<string, { count: number; revenue: number }>;
    byStatus: Record<string, number>;
  };
  topCategories: Array<{ name: string; orders: number }>;
  hourlyOrders: Array<{ hour: string; count: number }>;
  salesByCategory: CategorySales[];
}

export const dashboardApi = {
  getStats: (period: "day" | "week" | "month", branchId?: string) =>
    api.get<{ success: boolean; data: DashboardData }>(
      `/dashboard/stats`,
      { 
        params: { 
          period,
          ...(branchId && { branchId })
        } 
      }
    ),
}

export default dashboardApi