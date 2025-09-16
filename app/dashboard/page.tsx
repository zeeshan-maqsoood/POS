'use client';

import { useEffect, useState } from 'react';
import { StatsCard } from "@/components/dashboard/stats-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  BarChart3, 
  Users, 
  DollarSign, 
  ShoppingBag, 
  Clock, 
  CheckCircle,
  Loader2
} from "lucide-react"
import { formatEuro } from "@/lib/format-currency"
import { dashboardApi } from "@/lib/dashbaord-api"

interface DashboardData {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  newCustomers: number;
  popularItems: Array<{ name: string; orders: number }>;
  recentOrders: Array<{
    id: string;
    total: number;
    status: string;
    createdAt: string;
  }>;
  revenueData: Array<{ date: string; revenue: number }>;
  orderTrends: Array<{ date: string; count: number }>;
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardData>({
    totalRevenue: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    newCustomers: 0,
    popularItems: [],
    recentOrders: [],
    revenueData: [],
    orderTrends: [],
  });
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const response = await dashboardApi.getStats(period)
        setStats(response.data.data)
      } catch (error) {
        console.error('Error loading dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [period])
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="space-y-6">
        {/* Page header */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Dashboard Overview</h1>
              <p className="text-gray-600 text-sm mt-1">
                Welcome back! Here's what's happening with your business.
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <div className="inline-flex rounded-md shadow-sm" role="group">
                <button
                  type="button"
                  onClick={() => setPeriod('day')}
                  className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
                    period === 'day' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setPeriod('week')}
                  className={`px-4 py-2 text-sm font-medium ${
                    period === 'week' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  This Week
                </button>
                <button
                  type="button"
                  onClick={() => setPeriod('month')}
                  className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
                    period === 'month' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  This Month
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Revenue"
            value={formatEuro(stats.totalRevenue)}
            change="+8.2% from last month"
            changeType="increase"
            icon={DollarSign}
          />
          <StatsCard
            title="Total Orders"
            value={stats.totalOrders.toString()}
            change="+12.5% from last month"
            changeType="increase"
            icon={ShoppingBag}
          />
          <StatsCard
            title="Avg. Order Value"
            value={formatEuro(stats.averageOrderValue)}
            change="+3.2% from last month"
            changeType="increase"
            icon={BarChart3}
          />
          <StatsCard
            title="New Customers"
            value={stats.newCustomers.toString()}
            change="+18% from last month"
            changeType="increase"
            icon={Users}
          />
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Recent Orders */}
          <Card className="lg:col-span-2">
            <CardHeader className="border-b border-gray-200">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">Recent Orders</CardTitle>
                <button className="text-sm text-blue-600 hover:text-blue-800">
                  View All
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-200">
                {stats.recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{order.id}</p>
                        <p className="text-sm text-gray-500">
                          {order.status === "completed"
                            ? "Completed"
                            : order.status === "preparing"
                            ? "Preparing"
                            : "Pending"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatEuro(order.total)}</p>
                        <p className="text-sm text-gray-500">
                          {order.status === "completed" ? (
                            <span className="inline-flex items-center text-green-600">
                              <CheckCircle className="h-4 w-4 mr-1" /> Completed
                            </span>
                          ) : order.status === "preparing" ? (
                            <span className="inline-flex items-center text-blue-600">
                              <Clock className="h-4 w-4 mr-1" /> Preparing
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-yellow-600">
                              <Clock className="h-4 w-4 mr-1" /> Pending
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Popular Items */}
          <Card>
            <CardHeader className="border-b border-gray-200">
              <CardTitle className="text-lg font-semibold">Popular Items</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-200">
                {stats.popularItems.map((item, index) => (
                  <div
                    key={index}
                    className="p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {item.name}
                        </p>
                        <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{
                              width: `${(item.orders / 201) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-900">
                          {item.orders}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="border-b border-gray-200">
              <CardTitle className="text-lg font-semibold">Revenue Overview</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <p className="text-gray-500">
                  Revenue chart will be displayed here
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="border-b border-gray-200">
              <CardTitle className="text-lg font-semibold">Order Trends</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <p className="text-gray-500">
                  Order trends chart will be displayed here
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="border-b border-gray-200">
            <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-200">
              <div className="flex items-center space-x-4 p-4 hover:bg-gray-50 transition-colors">
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">New user registered</p>
                  <p className="text-xs text-gray-500">2 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 p-4 hover:bg-gray-50 transition-colors">
                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Order #1234 completed</p>
                  <p className="text-xs text-gray-500">5 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 p-4 hover:bg-gray-50 transition-colors">
                <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Payment received</p>
                  <p className="text-xs text-gray-500">10 minutes ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <CardHeader className="border-b border-gray-200 p-4">
            <CardTitle className="text-lg font-semibold text-gray-900">
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group">
                <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center mb-3 group-hover:bg-emerald-100 transition-colors">
                  <Users className="h-5 w-5 text-emerald-600" />
                </div>
                <p className="font-medium text-gray-900">Manage Users</p>
                <p className="text-xs text-gray-500 mt-0.5">View and edit users</p>
              </button>
              <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                </div>
                <p className="font-medium text-gray-900">View Analytics</p>
                <p className="text-xs text-gray-500 mt-0.5">Check performance</p>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}