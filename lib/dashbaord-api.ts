import api from "@/utils/api"

export interface DashboardData {
  totalRevenue: number
  totalOrders: number
  averageOrderValue: number
  newCustomers: number
  popularItems: Array<{ name: string; orders: number }>
  recentOrders: Array<{
    id: string
    total: number
    status: string
    createdAt: string
  }>
  revenueData: Array<{ date: string; revenue: number }>
  orderTrends: Array<{ date: string; count: number }>
}

export const dashboardApi = {
  getStats: (period: "day" | "week" | "month") =>
    api.get<{ success: boolean; data: DashboardData }>(
      `/dashboard/stats`,
      { params: { period } }
    ),
}

export default dashboardApi