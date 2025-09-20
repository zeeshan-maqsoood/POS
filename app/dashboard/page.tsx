'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  BarChart3, 
  Users, 
  DollarSign, 
  ShoppingBag, 
  Clock, 
  CheckCircle,
  Loader2,
  Plus,
  Package,
  UserPlus,
  FileText
} from "lucide-react"
import { formatEuro } from "@/lib/format-currency"
import { dashboardApi } from "@/lib/dashbaord-api"
import type { DashboardData } from "@/lib/dashbaord-api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
  Sector,
  TooltipProps
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { SalesByCategoryChart } from '@/components/dashboard/sales-by-category-chart';
import { SalesCategoryPieChart } from '@/components/dashboard/sales-category-pie-chart';

type PieData = {
  name: string;
  value: number;
  color?: string;
};

// Custom Tooltip component with proper typing
const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
        <p className="font-medium text-gray-900">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.dataKey === 'revenue' ? formatEuro(entry.value as number) : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Quick action items
const quickActions = [
  {
    title: 'New Order',
    description: 'Create a new sales order',
    icon: Plus,
    color: 'bg-blue-100 text-blue-600',
    hoverColor: 'bg-blue-50',
    href: '/orders/new'
  },
  {
    title: 'Add Product',
    description: 'Add a new product to inventory',
    icon: Package,
    color: 'bg-green-100 text-green-600',
    hoverColor: 'bg-green-50',
    href: '/products/new'
  },
  {
    title: 'New Customer',
    description: 'Add a new customer',
    icon: UserPlus,
    color: 'bg-purple-100 text-purple-600',
    hoverColor: 'bg-purple-50',
    href: '/customers/new'
  },
  {
    title: 'Run Report',
    description: 'Generate sales reports',
    icon: FileText,
    color: 'bg-amber-100 text-amber-600',
    hoverColor: 'bg-amber-50',
    href: '/reports'
  }
];

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
    ordersByStatus: {},
    revenueByStatus: {},
    paymentBreakdown: { byMethod: {}, byStatus: {} },
    topCategories: [],
    hourlyOrders: [],
  });
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day');
  const [refreshing, setRefreshing] = useState(false);
  const [cache, setCache] = useState<Record<'day' | 'week' | 'month', DashboardData | null>>({
    day: null,
    week: null,
    month: null,
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, [])

  // Initial load for default period
  useEffect(() => {
    let active = true;
    const init = async () => {
      try {
        setLoading(true);
        const res = await dashboardApi.getStats(period);
        if (!active) return;
        setStats(res.data.data);
        setCache(prev => ({ ...prev, [period]: res.data.data }));
      } catch (e) {
        console.error('Error loading dashboard data:', e);
      } finally {
        if (active) setLoading(false);
      }
    };
    init();
    return () => { active = false };
  }, [])

  // When period changes, use cached data immediately, then refresh in background
  useEffect(() => {
    let active = true;
    const maybeCached = cache[period];
    if (maybeCached) {
      setStats(maybeCached);
    }
    const refresh = async () => {
      try {
        if (!maybeCached) {
          // If no cache, show lightweight loader on first time for this period
          setLoading(true);
        } else {
          setRefreshing(true);
        }
        const res = await dashboardApi.getStats(period);
        if (!active) return;
        setStats(res.data.data);
        setCache(prev => ({ ...prev, [period]: res.data.data }));
      } catch (e) {
        console.error('Error refreshing dashboard data:', e);
      } finally {
        if (!active) return;
        setLoading(false);
        setRefreshing(false);
      }
    };
    refresh();
    return () => { active = false };
  }, [period])
  if (!mounted) {
    return null;
  }
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 transition-colors duration-200">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page header with gradient */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl p-6 shadow-lg text-white overflow-hidden relative">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white/10 rounded-full"></div>
          <div className="absolute bottom-0 right-0 -mb-10 -mr-10 w-60 h-60 bg-white/5 rounded-full"></div>
          
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">Dashboard Overview</h1>
                <p className="text-blue-100 mt-1">
                  Welcome back! Here's what's happening with your business today.
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 p-1">
                  {([
                    { key: 'day', label: 'Today' },
                    { key: 'week', label: 'This Week' },
                    { key: 'month', label: 'This Month' },
                  ] as const).map(({ key, label }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setPeriod(key)}
                      className={`px-3.5 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                        period === key
                          ? 'bg-white text-indigo-700 shadow-sm'
                          : 'text-blue-100 hover:bg-white/10'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                
                <button 
                  className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md bg-white/10 backdrop-blur-sm border border-white/20 text-blue-100 hover:bg-white/20 transition-colors whitespace-nowrap overflow-hidden"
                  onClick={() => setRefreshing(true)}
                  disabled={refreshing}
                >
                  {refreshing ? (
                    <span className="flex items-center gap-1">
                      <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin flex-shrink-0" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                      </svg>
                      <span className="truncate">Refreshing...</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                        <path d="M3 3v5h5"></path>
                        <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path>
                        <path d="M16 16h5v5"></path>
                      </svg>
                      <span className="truncate">Refresh</span>
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats grid with improved design */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold mt-1 text-gray-900">{formatEuro(stats.totalRevenue ?? 0)}</p>
                <div className="flex items-center mt-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <svg className="-ml-0.5 mr-1 h-3 w-3 text-green-500" fill="currentColor" viewBox="0 0 8 8">
                      <path d="M2 6l3-4 3 4z" />
                    </svg>
                    +8.2%
                  </span>
                  <span className="ml-2 text-xs text-gray-500">vs last month</span>
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600">
                <DollarSign className="h-6 w-6" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Orders</p>
                <p className="text-2xl font-bold mt-1 text-gray-900">{stats.totalOrders?.toLocaleString()}</p>
                <div className="flex items-center mt-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <svg className="-ml-0.5 mr-1 h-3 w-3 text-green-500" fill="currentColor" viewBox="0 0 8 8">
                      <path d="M2 6l3-4 3 4z" />
                    </svg>
                    +12.5%
                  </span>
                  <span className="ml-2 text-xs text-gray-500">vs last month</span>
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
                <ShoppingBag className="h-6 w-6" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Avg. Order Value</p>
                <p className="text-2xl font-bold mt-1 text-gray-900">{formatEuro(stats.averageOrderValue ?? 0)}</p>
                <div className="flex items-center mt-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <svg className="-ml-0.5 mr-1 h-3 w-3 text-green-500" fill="currentColor" viewBox="0 0 8 8">
                      <path d="M2 6l3-4 3 4z" />
                    </svg>
                    +3.2%
                  </span>
                  <span className="ml-2 text-xs text-gray-500">vs last month</span>
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-purple-50 text-purple-600">
                <BarChart3 className="h-6 w-6" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">New Customers</p>
                <p className="text-2xl font-bold mt-1 text-gray-900">{stats.newCustomers?.toLocaleString()}</p>
                <div className="flex items-center mt-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <svg className="-ml-0.5 mr-1 h-3 w-3 text-green-500" fill="currentColor" viewBox="0 0 8 8">
                      <path d="M2 6l3-4 3 4z" />
                    </svg>
                    +18%
                  </span>
                  <span className="ml-2 text-xs text-gray-500">vs last month</span>
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-green-50 text-green-600">
                <Users className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Chart */}
          <Card className="lg:col-span-2 border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Revenue Overview</CardTitle>
                  <p className="text-sm text-muted-foreground">Total revenue over time</p>
                </div>
                <Button variant="ghost" size="sm" className="h-8">
                  View Report
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={stats.revenueData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="date" 
                      tickLine={false} 
                      axisLine={false}
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                    />
                    <YAxis 
                      tickLine={false} 
                      axisLine={false}
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      tickFormatter={(value) => `$${value / 1000}k`}
                    />
                    <CartesianGrid vertical={false} stroke="#e5e7eb" />
                    <RechartsTooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                              <p className="font-medium text-gray-900">{label}</p>
                              {payload.map((entry, index) => (
                                <p key={index} className="text-sm" style={{ color: entry.color }}>
                                  {entry.name}: {entry.name === 'revenue' ? formatEuro(entry.value) : entry.value}
                                </p>
                              ))}
                            </div>
                          );
                        }
                        return null;
                      }}
                      cursor={{ stroke: '#e5e7eb', strokeWidth: 1 }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      name="Revenue"
                      stroke="#4f46e5" 
                      fillOpacity={1} 
                      fill="url(#colorRevenue)" 
                      strokeWidth={2}
                      activeDot={{ r: 6, stroke: '#4f46e5', strokeWidth: 2, fill: '#fff' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          {/* Sales by Category */}
          <Card className="border-0 shadow-sm h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold w-full">Sales by Category</CardTitle>
              <p className="text-sm text-muted-foreground w-full">Top categories by revenue</p>
            </CardHeader>
            <CardContent className="h-80">
              <SalesCategoryPieChart initialData={stats.salesByCategory} />
            </CardContent>
          </Card>
        </div>

        {/* Second Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Trends */}
          <Card className="lg:col-span-2 border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold ">Order Trends</CardTitle>
                  <p className="text-sm text-muted-foreground">Number of orders over time</p>
                </div>
                <Button variant="ghost" size="sm" className="h-8">
                  View Report
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stats.orderTrends}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid vertical={false} stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="date" 
                      tickLine={false} 
                      axisLine={false}
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                    />
                    <YAxis 
                      tickLine={false} 
                      axisLine={false}
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                    />
                    <RechartsTooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                              <p className="font-medium text-gray-900">{label}</p>
                              <p className="text-sm text-gray-700">
                                {payload[0].value} orders
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                      cursor={{ fill: '#f3f4f6' }}
                    />
                    <Bar 
                      dataKey="count" 
                      name="Orders"
                      radius={[4, 4, 0, 0]}
                      className="fill-primary"
                    >
                      {stats.orderTrends?.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          className="transition-all duration-300 hover:opacity-80"
                          fill="#4f46e5"
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
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
          {/* Recent Orders */}
          {/* <Card className="border-0 shadow-sm w-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Recent Orders</CardTitle>
              <p className="text-sm text-muted-foreground">Latest transactions</p>
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
          </Card> */}

          {/* Popular Items */}
         
        </div>

        {/* Charts Section */}
        {/* <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SalesByCategoryChart initialData={stats.salesByCategory} />
          <Card className="min-w-0 overflow-hidden">
            <CardHeader className="border-b border-gray-200">
              <CardTitle className="text-lg font-semibold">Revenue Overview</CardTitle>
            </CardHeader>
            <CardContent className="p-6 overflow-hidden">
              <ChartContainer
                id="revenue-chart"
                className="h-64 w-full"
                config={{
                  revenue: {
                    label: "Revenue",
                    theme: { light: "#2563eb", dark: "#60a5fa" },
                  },
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.revenueData || []} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="revenue" stroke="var(--color-revenue)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
          <Card className="min-w-0 overflow-hidden">
            <CardHeader className="border-b border-gray-200">
              <CardTitle className="text-lg font-semibold">Order Trends</CardTitle>
            </CardHeader>
            <CardContent className="p-6 overflow-hidden">
              <ChartContainer
                id="orders-chart"
                className="h-64 w-full"
                config={{
                  orders: {
                    label: "Orders",
                    theme: { light: "#10b981", dark: "#34d399" },
                  },
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.orderTrends || []} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="var(--color-orders)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div> */}

        {/* Recent Activity */}
        {/* <Card>
          <CardHeader className="border-b border-gray-200">
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-200">
              {stats.recentOrders?.slice(0, 5).map((order) => (
                <div 
                  key={order.id}
                  className="flex items-center p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className={`w-2.5 h-2.5 rounded-full ${
                    order.status === 'completed' ? 'bg-green-500' : 
                    order.status === 'processing' ? 'bg-blue-500' : 
                    'bg-yellow-500'
                  }`}></div>
                  <div className="ml-4 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">Order {order.id}</p>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                        {order.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        {formatEuro(order.total)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              <div className="p-3 text-center border-t border-gray-100">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                >
                  View all orders
                </Button>
              </div>
            </div>
          </CardContent>
        </Card> */}

        {/* ... */}
        {/* Quick Actions */}
        {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <Link 
              key={index} 
              href={action.href}
              className="block p-5 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mb-3`}>
                <action.icon className="h-6 w-6" />
              </div>
              <h3 className="font-medium text-gray-900 mb-1">{action.title}</h3>
              <p className="text-sm text-gray-500">{action.description}</p>
            </Link>
          ))}
        </div> */}

        {/* Bottom Stats */}
        {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-base font-semibold flex items-center">
                <ShoppingBag className="h-4 w-4 mr-2 text-blue-600" />
                Top Selling Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.popularItems?.slice(0, 3).map((item, index) => (
                  <div key={index} className="flex items-center">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 mr-3">
                      <Package className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.orders} orders</p>
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {item.revenue ? formatEuro(item.revenue) : 'N/A'}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-base font-semibold flex items-center">
                <Clock className="h-4 w-4 mr-2 text-green-600" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { type: 'order', text: 'New order #1234 received', time: '2 min ago' },
                  { type: 'customer', text: 'New customer registered', time: '10 min ago' },
                  { type: 'inventory', text: 'Low stock alert: Product X', time: '1 hour ago' },
                ].map((activity, index) => (
                  <div key={index} className="flex items-start">
                    <div className={`w-2 h-2 mt-1.5 rounded-full ${
                      activity.type === 'order' ? 'bg-blue-500' : 
                      activity.type === 'customer' ? 'bg-green-500' : 'bg-yellow-500'
                    }`}></div>
                    <div className="ml-3">
                      <p className="text-sm text-gray-900">{activity.text}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-base font-semibold flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-purple-600" />
                Order Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { status: 'Pending', count: 12, color: 'bg-yellow-500' },
                  { status: 'Processing', count: 8, color: 'bg-blue-500' },
                  { status: 'Completed', count: 45, color: 'bg-green-500' },
                  { status: 'Cancelled', count: 3, color: 'bg-red-500' },
                ].map((item, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{item.status}</span>
                      <span className="text-sm font-medium text-gray-900">{item.count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${item.color}`}
                        style={{ width: `${(item.count / 68) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div> */}
      </div>
    </div>
  );
}