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
  FileText,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { formatPounds } from "@/lib/format-currency";
import { dashboardApi } from "@/lib/dashbaord-api";
import type { DashboardData } from "@/lib/dashbaord-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  TooltipProps
} from "recharts";
import { useCurrentUser } from "@/hooks/use-current-user";

// Helper function to format numbers with commas
const formatNumber = (num: number) => {
  return new Intl.NumberFormat('en-US').format(num);
};

// Status badge component
const StatusBadge = ({ status }: { status: string }) => {
  const statusColors: Record<string, string> = {
    COMPLETED: 'bg-green-100 text-green-800',
    PENDING: 'bg-yellow-100 text-yellow-800',
    PROCESSING: 'bg-blue-100 text-blue-800',
    CANCELLED: 'bg-red-100 text-red-800',
    PAID: 'bg-green-100 text-green-800',
    FAILED: 'bg-red-100 text-red-800',
    REFUNDED: 'bg-purple-100 text-purple-800',
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
      {status}
    </span>
  );
};

// Stat card component
const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  change, 
  changeType,
  loading = false 
}: { 
  title: string; 
  value: string | number; 
  icon: React.ElementType; 
  change?: string;
  changeType?: 'increase' | 'decrease';
  loading?: boolean;
}) => {
  if (loading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {change && (
              <div className={`mt-2 flex items-center text-sm ${changeType === 'increase' ? 'text-green-600' : 'text-red-600'}`}>
                {changeType === 'increase' ? (
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 mr-1" />
                )}
                <span>{change}</span>
              </div>
            )}
          </div>
          <div className="p-3 rounded-lg bg-primary/10">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};\n
export default function NewDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day');
  const [activeTab, setActiveTab] = useState('overview');
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
    salesByCategory: []
  });
  
  const { currentUser, isLoading: isLoadingUser } = useCurrentUser();

  // Generate sample data for demonstration
  useEffect(() => {
    const generateSampleData = () => {
      // Generate revenue data for the last 7 days
      const revenueData = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return {
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          revenue: Math.floor(Math.random() * 10000) + 5000
        };
      });

      // Generate order trends
      const orderTrends = revenueData.map((item, i) => ({
        date: item.date,
        count: Math.floor(item.revenue / (Math.random() * 100 + 50))
      }));

      // Generate sales by category
      const categories = ['Food', 'Beverages', 'Desserts', 'Sides', 'Specials'];
      const salesByCategory = categories.map(category => ({
        categoryId: category.toLowerCase(),
        categoryName: category,
        sales: Math.floor(Math.random() * 5000) + 1000,
        orderCount: Math.floor(Math.random() * 100) + 20,
        itemsSold: Math.floor(Math.random() * 300) + 50
      }));

      // Generate recent orders
      const recentOrders = Array.from({ length: 5 }, (_, i) => ({
        id: `order-${1000 + i}`,
        orderNumber: `ORD-${1000 + i}`,
        orderType: ['DELIVERY', 'PICKUP', 'DINE_IN'][Math.floor(Math.random() * 3)],
        total: Math.floor(Math.random() * 200) + 20,
        status: ['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED'][Math.floor(Math.random() * 4)] as any,
        paymentStatus: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'][Math.floor(Math.random() * 4)] as any,
        paymentMethod: ['CREDIT_CARD', 'CASH', 'MOBILE_PAYMENT'][Math.floor(Math.random() * 3)],
        createdAt: new Date().toISOString()
      }));

      // Generate payment breakdown
      const paymentBreakdown = {
        byMethod: {
          CREDIT_CARD: { count: Math.floor(Math.random() * 50) + 20, revenue: Math.floor(Math.random() * 5000) + 2000 },
          CASH: { count: Math.floor(Math.random() * 30) + 10, revenue: Math.floor(Math.random() * 3000) + 1000 },
          MOBILE_PAYMENT: { count: Math.floor(Math.random() * 40) + 15, revenue: Math.floor(Math.random() * 4000) + 1500 }
        },
        byStatus: {
          PAID: Math.floor(Math.random() * 80) + 40,
          PENDING: Math.floor(Math.random() * 20) + 5,
          FAILED: Math.floor(Math.random() * 5) + 1,
          REFUNDED: Math.floor(Math.random() * 10) + 2
        }
      };

      setStats({
        totalRevenue: revenueData.reduce((sum, item) => sum + item.revenue, 0),
        totalOrders: orderTrends.reduce((sum, item) => sum + item.count, 0),
        averageOrderValue: 0, // Will be calculated
        newCustomers: Math.floor(Math.random() * 50) + 10,
        popularItems: [
          { name: 'Margherita Pizza', orders: Math.floor(Math.random() * 100) + 50 },
          { name: 'Caesar Salad', orders: Math.floor(Math.random() * 80) + 30 },
          { name: 'Pasta Carbonara', orders: Math.floor(Math.random() * 70) + 20 },
          { name: 'Chicken Wings', orders: Math.floor(Math.random() * 90) + 40 },
          { name: 'Chocolate Cake', orders: Math.floor(Math.random() * 60) + 20 }
        ],
        recentOrders,
        revenueData,
        orderTrends,
        ordersByStatus: {
          COMPLETED: Math.floor(Math.random() * 80) + 40,
          PROCESSING: Math.floor(Math.random() * 20) + 5,
          PENDING: Math.floor(Math.random() * 15) + 3,
          CANCELLED: Math.floor(Math.random() * 5) + 1
        },
        revenueByStatus: {
          COMPLETED: revenueData.reduce((sum, item) => sum + item.revenue * 0.8, 0),
          PROCESSING: revenueData.reduce((sum, item) => sum + item.revenue * 0.1, 0),
          PENDING: revenueData.reduce((sum, item) => sum + item.revenue * 0.08, 0),
          CANCELLED: revenueData.reduce((sum, item) => sum + item.revenue * 0.02, 0)
        },
        paymentBreakdown,
        topCategories: salesByCategory
          .sort((a, b) => b.sales - a.sales)
          .slice(0, 5)
          .map(item => ({
            name: item.categoryName,
            orders: item.orderCount
          })),
        hourlyOrders: Array.from({ length: 24 }, (_, i) => ({
          hour: `${i}:00`,
          count: Math.floor(Math.random() * 50) + (i > 10 && i < 14 ? 50 : i > 17 && i < 21 ? 80 : 20)
        })),
        salesByCategory
      });

      setLoading(false);
    };

    generateSampleData();
  }, [period]);

  // Calculate average order value
  useEffect(() => {
    if (stats.totalOrders > 0 && stats.totalRevenue > 0) {
      setStats(prev => ({
        ...prev,
        averageOrderValue: prev.totalRevenue / prev.totalOrders
      }));
    }
  }, [stats.totalOrders, stats.totalRevenue]);

  // Combine revenue and order data for the combined chart
  const combinedChartData = stats.revenueData.map((revenueItem, index) => ({
    date: revenueItem.date,
    revenue: revenueItem.revenue,
    orders: stats.orderTrends[index]?.count || 0
  }));

  // Prepare data for payment methods chart
  const paymentMethodsData = Object.entries(stats.paymentBreakdown.byMethod).map(([method, data]) => ({
    name: method.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' '),
    revenue: data.revenue,
    count: data.count
  }));

  // Calculate completion rate
  const completionRate = stats.ordersByStatus.COMPLETED 
    ? (stats.ordersByStatus.COMPLETED / stats.totalOrders) * 100 
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {currentUser?.role === 'ADMIN' ? 'Admin Dashboard' : 'Branch Dashboard'}
            </h1>
            <p className="text-muted-foreground">
              {period === 'day' ? 'Today\'s' : period === 'week' ? 'This week\'s' : 'This month\'s'} overview
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center space-x-2">
            <Button
              variant={period === 'day' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod('day')}
            >
              Today
            </Button>
            <Button
              variant={period === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod('week')}
            >
              This Week
            </Button>
            <Button
              variant={period === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod('month')}
            >
              This Month
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Revenue"
            value={formatPounds(stats.totalRevenue)}
            icon={DollarSign}
            change="+12.5%"
            changeType="increase"
            loading={loading}
          />
          <StatCard
            title="Total Orders"
            value={formatNumber(stats.totalOrders)}
            icon={ShoppingBag}
            change="+8.2%"
            changeType="increase"
            loading={loading}
          />
          <StatCard
            title="Avg. Order Value"
            value={formatPounds(stats.averageOrderValue)}
            icon={BarChart3}
            change="+4.1%"
            changeType="increase"
            loading={loading}
          />
          <StatCard
            title="Completion Rate"
            value={`${completionRate.toFixed(1)}%`}
            icon={CheckCircle}
            change="+2.3%"
            changeType="increase"
            loading={loading}
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-4" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 max-w-xs">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              {/* Revenue & Orders Chart */}
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Revenue & Orders</CardTitle>
                  <CardDescription>
                    {period === 'day' ? 'Today\'s' : period === 'week' ? 'This week\'s' : 'This month\'s'} performance
                  </CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={combinedChartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                        <XAxis
                          dataKey="date"
                          stroke="#888888"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          yAxisId="left"
                          orientation="left"
                          stroke="#8884d8"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => `$${value}`}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          stroke="#82ca9d"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                        />
                        <RechartsTooltip 
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                                  <p className="font-medium text-gray-900 mb-2">{label}</p>
                                  {payload.map((entry: any, index: number) => (
                                    <p 
                                      key={index} 
                                      className="text-sm flex items-center"
                                      style={{ color: entry.color }}
                                    >
                                      <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: entry.color }}></span>
                                      {entry.name}: {entry.dataKey === 'revenue' ? formatEuro(entry.value) : entry.value}
                                    </p>
                                  ))}
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="revenue"
                          name="Revenue"
                          stroke="#8884d8"
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 6 }}
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="orders"
                          name="Orders"
                          stroke="#82ca9d"
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Sales by Category */}
              <Card className="col-span-3">
                <CardHeader>
                  <CardTitle>Sales by Category</CardTitle>
                  <CardDescription>Top performing categories</CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                  <div className="h-[300px] flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.salesByCategory}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="sales"
                          nameKey="categoryName"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {stats.salesByCategory.map((entry, index) => {
                            const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#a4de6c'];
                            return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                          })}
                        </Pie>
                        <RechartsTooltip 
                          formatter={(value: number, name: string, props: any) => [
                            formatPounds(value),
                            props.payload.categoryName
                          ]}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    {stats.salesByCategory.slice(0, 5).map((category, index) => (
                      <div key={category.categoryId} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-2" 
                            style={{ 
                              backgroundColor: ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#a4de6c'][index % 5] 
                            }}
                          ></div>
                          <span className="text-sm font-medium">{category.categoryName}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {formatEuro(category.sales)}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {/* Recent Orders */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Recent Orders</CardTitle>
                      <CardDescription>Latest transactions</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/orders">View All</Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-sm text-muted-foreground border-b">
                          <th className="pb-3 px-4">Order #</th>
                          <th className="pb-3 px-4">Type</th>
                          <th className="pb-3 px-4 text-right">Amount</th>
                          <th className="pb-3 px-4">Status</th>
                          <th className="pb-3 px-4 text-right">Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.recentOrders.map((order) => (
                          <tr key={order.id} className="border-b hover:bg-muted/50">
                            <td className="py-3 px-4 text-sm font-medium">
                              <Link href={`/orders/${order.id}`} className="hover:underline">
                                {order.orderNumber}
                              </Link>
                            </td>
                            <td className="py-3 px-4 text-sm text-muted-foreground capitalize">
                              {order.orderType.toLowerCase().replace('_', ' ')}
                            </td>
                            <td className="py-3 px-4 text-sm font-medium text-right">
                              {formatEuro(order.total)}
                            </td>
                            <td className="py-3 px-4">
                              <StatusBadge status={order.status} />
                            </td>
                            <td className="py-3 px-4 text-sm text-muted-foreground text-right">
                              {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Methods */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Methods</CardTitle>
                  <CardDescription>Payment distribution</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px] mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={paymentMethodsData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} className="stroke-muted" />
                        <XAxis type="number" hide />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 12 }}
                          width={80}
                        />
                        <RechartsTooltip 
                          formatter={(value: number, name: string) => [
                            name === 'revenue' ? formatEuro(value) : value,
                            name === 'revenue' ? 'Revenue' : 'Orders'
                          ]}
                        />
                        <Bar 
                          dataKey="revenue" 
                          name="Revenue" 
                          fill="#8884d8" 
                          radius={[0, 4, 4, 0]}
                          barSize={12}
                        >
                          {paymentMethodsData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#a4de6c'][index % 5]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="space-y-3">
                    {paymentMethodsData.map((method, index) => (
                      <div key={method.name} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-2" 
                            style={{ 
                              backgroundColor: ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#a4de6c'][index % 5] 
                            }}
                          ></div>
                          <span className="text-sm font-medium">{method.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{formatEuro(method.revenue)}</div>
                          <div className="text-xs text-muted-foreground">{method.count} orders</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Advanced Analytics</CardTitle>
                <CardDescription>Detailed performance metrics and insights</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[500px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                    <h3 className="text-lg font-medium">Analytics Dashboard</h3>
                    <p className="text-sm">Advanced analytics coming soon</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
