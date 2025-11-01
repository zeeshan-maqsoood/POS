'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useBranches } from '@/hooks/use-branches';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { dashboardApi, DashboardData } from '@/lib/dashbaord-api';
import { formatPounds } from '@/lib/format-currency';
import { addDays, format, subDays } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from '@radix-ui/react-icons';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
  ChartBarIcon,
  ShoppingCartIcon,
  CurrencyPoundIcon,
  UsersIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';
import { useUser } from '@/hooks/use-user';

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  trend: 'up' | 'down' | 'neutral';
}

function StatCard({ title, value, icon: Icon, trend }: StatCardProps) {
  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-600',
  };

  const trendIcons = {
    up: ArrowTrendingUpIcon,
    down: ArrowTrendingDownIcon,
    neutral: ArrowTrendingUpIcon,
  };

  const TrendIcon = trendIcons[trend];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${trendColors[trend]} bg-opacity-10`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <div className="flex items-center mt-2">
        <TrendIcon className={`w-4 h-4 ${trendColors[trend]} mr-1`} />
        <span className={`text-sm ${trendColors[trend]}`}>
          {trend === 'up' ? '+12.3%' : trend === 'down' ? '-5.2%' : '0%'} from last period
        </span>
      </div>
    </div>
  );
}

// Revenue Chart Component
function RevenueChart({ data }: { data: DashboardData['revenueData'] }) {
  const maxRevenue = Math.max(...data.map(d => d.revenue));
  
  return (
    <div className="space-y-2">
      {data.map((item, index) => (
        <div key={index} className="flex items-center justify-between">
          <span className="text-sm text-gray-600 w-16">{item.date}</span>
          <div className="flex-1 mx-4">
            <div className="bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 rounded-full h-2 transition-all duration-300"
                style={{ width: `${(item.revenue / maxRevenue) * 100}%` }}
              />
            </div>
          </div>
          <span className="text-sm font-medium text-gray-900 w-20 text-right">
           {formatPounds(item.revenue)}
          </span>
        </div>
      ))}
    </div>
  );
}

// Order Trend Chart Component
function OrderTrendChart({ data }: { data: DashboardData['orderTrends'] }) {
  const maxCount = Math.max(...data.map(d => d.count));
  
  return (
    <div className="space-y-2">
      {data.map((item, index) => (
        <div key={index} className="flex items-center justify-between">
          <span className="text-sm text-gray-600 w-16">{item.date}</span>
          <div className="flex-1 mx-4">
            <div className="bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 rounded-full h-2 transition-all duration-300"
                style={{ width: `${(item.count / maxCount) * 100}%` }}
              />
            </div>
          </div>
          <span className="text-sm font-medium text-gray-900 w-12 text-right">
            {item.count}
          </span>
        </div>
      ))}
    </div>
  );
}

// Recent Orders Table Component
function RecentOrdersTable({ orders }: { orders: DashboardData['recentOrders'] }) {
  const statusColors = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    PROCESSING: 'bg-blue-100 text-blue-800',
    COMPLETED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
  };

  const paymentStatusColors = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    PAID: 'bg-green-100 text-green-800',
    FAILED: 'bg-red-100 text-red-800',
    REFUNDED: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Order
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Type
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Amount
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Payment
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Time
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {orders.map((order) => (
            <tr key={order.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                {order.orderNumber}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                {order.orderType}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
               {formatPounds(Number(order.total.toFixed(2)))}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[order.status as keyof typeof statusColors]}`}>
                  {order.status}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${paymentStatusColors[order.paymentStatus as keyof typeof paymentStatusColors]}`}>
                  {order.paymentStatus}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                {new Date(order.createdAt).toLocaleTimeString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Popular Items List Component
function PopularItemsList({ items }: { items: DashboardData['popularItems'] }) {
  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={index} className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full text-xs flex items-center justify-center mr-3">
              {index + 1}
            </span>
            <span className="text-sm font-medium text-gray-900 truncate">
              {item.name}
            </span>
          </div>
          <span className="text-sm text-gray-600">{item.orders} orders</span>
        </div>
      ))}
    </div>
  );
}

// Top Categories List Component
function TopCategoriesList({ categories }: { categories: DashboardData['topCategories'] }) {
  return (
    <div className="space-y-3">
      {categories.map((category, index) => (
        <div key={index} className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-900">{category.name}</span>
          <span className="text-sm text-gray-600">{category.orders} orders</span>
        </div>
      ))}
    </div>
  );
}

// Sales by Category Chart Component
function SalesByCategoryChart({ data }: { data: DashboardData['salesByCategory'] }) {
  const totalSales = data.reduce((sum, category) => sum + category.sales, 0);
  
  return (
    <div className="space-y-3">
      {data.map((category, index) => (
        <div key={category.categoryId}>
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium text-gray-900">{category.categoryName}</span>
            <span className="text-gray-600">
            {formatPounds(Number(category.sales.toFixed(2)))} ({(category.sales / totalSales * 100).toFixed(1)}%)
            </span>
          </div>
          <div className="bg-gray-200 rounded-full h-2">
            <div
              className="bg-purple-600 rounded-full h-2 transition-all duration-300"
              style={{ width: `${(category.sales / totalSales) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{category.orderCount} orders</span>
            <span>{category.itemsSold} items sold</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// Payment Breakdown Component
function PaymentBreakdown({ data }: { data: DashboardData['paymentBreakdown'] }) {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-2">By Method</h4>
        {Object.entries(data.byMethod).map(([method, stats]) => (
          <div key={method} className="flex justify-between text-sm mb-2">
            <span className="text-gray-600 capitalize">{method.toLowerCase()}</span>
            <div className="text-right">
              <div className="font-medium text-gray-900">{formatPounds(Number(stats.revenue))}</div>
              <div className="text-gray-500">{stats.count} transactions</div>
            </div>
          </div>
        ))}
      </div>
      
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-2">By Status</h4>
        {Object.entries(data.byStatus).map(([status, count]) => (
          <div key={status} className="flex justify-between text-sm mb-2">
            <span className="text-gray-600 capitalize">{status.toLowerCase()}</span>
            <span className="font-medium text-gray-900">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Loading Component
function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading dashboard data...</p>
      </div>
    </div>
  );
}

// Error Component
function DashboardError({ error, onRetry }: { error: string | null; onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-red-600 text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Unable to load dashboard</h2>
        <p className="text-gray-600 mb-4">{error || 'An unexpected error occurred'}</p>
        <button
          onClick={onRetry}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useUser();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'custom'>('day');
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const { branches = [], loading: branchesLoading, error: branchesError } = useBranches();
  
  // Date range state
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 7),
    to: new Date(),
  });

  // Check if user is MANAGER and should have restricted branch selection
  const isManager = user?.role === 'MANAGER';
  const userBranch = user?.branch;

  // Set default branch based on user role - SIMPLIFIED VERSION
  useEffect(() => {
    if (user && branches.length > 0) {
      if (isManager && userBranch?.id) {
        console.log('User branch:', userBranch.branch);
        // For MANAGER, pre-select their assigned branch
        console.log('Setting manager branch:', userBranch.branch.id);
        setSelectedBranch(userBranch.branch.id);
      } else if (!isManager && selectedBranch === '') {
        // For ADMIN, set to 'all' only if not already set
        console.log('Setting admin branch to all');
        setSelectedBranch('all');
      }
    }
  }, [user, branches, isManager, userBranch]);

  // Fetch data when period, selectedBranch, or dateRange changes
  useEffect(() => {
    // Only fetch data if we have a valid selectedBranch
    if (selectedBranch) {
      console.log('Fetching data for branch:', selectedBranch);
      fetchDashboardData();
    }
  }, [period, selectedBranch, dateRange]);

  const fetchDashboardData = async () => {
    if (!selectedBranch) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Prepare date range parameters
      let startDate, endDate;
      
      if (period === 'custom' && dateRange?.from) {
        startDate = format(dateRange.from, 'yyyy-MM-dd');
        endDate = dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : startDate;
      }
      
      // If 'all' is selected, don't pass branchId to get data for all branches
      const branchId = selectedBranch === 'all' ? undefined : selectedBranch;
      
      console.log('API call params:', {
        period,
        branchId,
        startDate,
        endDate,
        selectedBranch,
        isManager,
        userBranch: userBranch?.id
      });
      
      const response = await dashboardApi.getStats(
        period,
        branchId,
        startDate,
        endDate
      );
      
      console.log('API response success:', response.data.success);
      console.log('API response data:', response.data.data);
      
      if (response.data.success) {
        console.log('Dashboard data received:', {
          totalRevenue: response.data.data.totalRevenue,
          totalOrders: response.data.data.totalOrders,
          recentOrdersCount: response.data.data.recentOrders?.length
        });
        setData(response.data.data);
      } else {
        console.error('API response not successful:', response.data);
        setError('Failed to fetch dashboard data');
      }
    } catch (err) {
      console.error('Dashboard API error:', err);
      setError('Error fetching dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Show loading while branch is being determined or data is loading
  if (!selectedBranch || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {!selectedBranch ? 'Initializing dashboard...' : 'Loading dashboard data...'}
          </p>
          {!selectedBranch && (
            <p className="text-sm text-gray-500 mt-2">
              User: {user?.role} | Branches loaded: {branches.length}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (branchesError) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                Error loading branches: {branchesError}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 text-sm font-medium text-red-700 hover:text-red-600"
              >
                Try again <span aria-hidden="true">&rarr;</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    console.error('Dashboard error state:', { error, hasData: !!data, selectedBranch });
    return <DashboardError error={error} onRetry={fetchDashboardData} />;
  }

  // Handle no branches case
  if (!branches || branches.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md w-full">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
            <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="mt-3 text-lg font-medium text-gray-900">No Branches Found</h2>
          <p className="mt-2 text-sm text-gray-500">
            There are no branches available in the system. Please create a branch to get started.
          </p>
          <div className="mt-6">
            <Link
              href="/branches/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Create New Branch
            </Link>
          </div>
        </div>
      </div>
    );
  }

  console.log('Rendering dashboard with data:', {
    totalRevenue: data.totalRevenue,
    totalOrders: data.totalOrders,
    selectedBranch,
    isManager
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-2">
                Overview of your restaurant performance
                {isManager && userBranch && (
                  <span className="ml-2 text-sm text-blue-600">
                    (Viewing data for {userBranch.name})
                  </span>
                )}
                {!isManager && selectedBranch !== 'all' && (
                  <span className="ml-2 text-sm text-blue-600">
                    (Viewing data for {branches.find(b => b.id === selectedBranch)?.name})
                  </span>
                )}
                {!isManager && selectedBranch === 'all' && (
                  <span className="ml-2 text-sm text-blue-600">
                    (Viewing data for all branches)
                  </span>
                )}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 mt-4 sm:mt-0">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex items-center gap-2">
                  <select
                    value={period}
                    onChange={(e) => {
                      const newPeriod = e.target.value as 'day' | 'week' | 'month' | 'custom';
                      setPeriod(newPeriod);
                      
                      // Set default date range when period changes
                      if (newPeriod === 'day') {
                        setDateRange({
                          from: new Date(),
                          to: new Date(),
                        });
                      } else if (newPeriod === 'week') {
                        setDateRange({
                          from: subDays(new Date(), 7),
                          to: new Date(),
                        });
                      } else if (newPeriod === 'month') {
                        setDateRange({
                          from: subDays(new Date(), 30),
                          to: new Date(),
                        });
                      }
                    }}
                    className="rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="day">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="custom">Custom Range</option>
                  </select>

                  {period === 'custom' && (
                    <div className="flex items-center">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            id="date"
                            variant={"outline"}
                            className={cn(
                              "w-[300px] justify-start text-left font-normal",
                              !dateRange && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateRange?.from ? (
                              dateRange.to ? (
                                <>
                                  {format(dateRange.from, "LLL dd, y")} -{" "}
                                  {format(dateRange.to, "LLL dd, y")}
                                </>
                              ) : (
                                format(dateRange.from, "LLL dd, y")
                              )
                            ) : (
                              <span>Pick a date range</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={dateRange?.from}
                            selected={dateRange}
                            onSelect={setDateRange}
                            numberOfMonths={2}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}
                </div>
                
                <div className="w-64">
                  {isManager ? (
                    // For MANAGER - show disabled select with only their branch
                    <div className="flex flex-col">
                      <Select
                        value={selectedBranch}
                        disabled={true}
                      >
                        <SelectTrigger className="w-full bg-gray-100">
                          <SelectValue>
                            {userBranch ? (
                              <div className="flex flex-col">
                                <span className="font-medium">{userBranch.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {user.restaurant?.name || 'No Restaurant'}
                                </span>
                              </div>
                            ) : (
                              'Loading...'
                            )}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={userBranch?.id || ''}>
                            <div className="flex flex-col">
                              <span className="font-medium">{userBranch?.name || 'Your Branch'}</span>
                              <span className="text-xs text-muted-foreground">
                                {user?.restaurant?.name || 'No Restaurant'}
                              </span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500 mt-1">
                        You can only view data for your assigned branch
                      </p>
                    </div>
                  ) : (
                    // For ADMIN - show full branch selection
                    <Select
                      value={selectedBranch}
                      onValueChange={(value) => {
                        setSelectedBranch(value);
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a branch" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          <div className="flex flex-col">
                            <span className="font-medium">All Branches</span>
                            <span className="text-xs text-muted-foreground">
                              Combined data from all branches
                            </span>
                          </div>
                        </SelectItem>
                        {branches.map((branch) => (
                          <SelectItem key={branch.id} value={branch.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{branch.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {branch.restaurantName || 'No Restaurant'}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

       

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Revenue"
            value={formatPounds(data.totalRevenue)}
            icon={CurrencyPoundIcon}
            trend="up"
          />
          <StatCard
            title="Total Orders"
            value={data.totalOrders.toLocaleString()}
            icon={ShoppingCartIcon}
            trend="up"
          />
          <StatCard
            title="Average Order Value"
            value={formatPounds(data.averageOrderValue)}
            icon={ChartBarIcon}
            trend="neutral"
          />
          <StatCard
            title="New Customers"
            value={data.newCustomers.toLocaleString()}
            icon={UsersIcon}
            trend="up"
          />
        </div>

        {/* Charts and Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
            <RevenueChart data={data.revenueData} />
          </div>

          {/* Order Trends */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Trends</h3>
            <OrderTrendChart data={data.orderTrends} />
          </div>
        </div>

        {/* Bottom Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Orders */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Orders</h3>
            <RecentOrdersTable orders={data.recentOrders} />
          </div>

          {/* Popular Items & Categories */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Items</h3>
              <PopularItemsList items={data.popularItems} />
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Categories</h3>
              <TopCategoriesList categories={data.topCategories} />
            </div>
          </div>
        </div>

        {/* Additional Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Sales by Category */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales by Category</h3>
            <SalesByCategoryChart data={data.salesByCategory} />
          </div>

          {/* Payment Breakdown */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Breakdown</h3>
            <PaymentBreakdown data={data.paymentBreakdown} />
          </div>
        </div>
      </div>
    </div>
  );
}