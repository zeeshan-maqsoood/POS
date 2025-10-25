// app/dashboard/reports/sales/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import {
  Download,
  TrendingUp,
  ShoppingCart,
  CreditCard,
  Users,
  Loader2,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  Clock,
  Target,
  BarChart3,
  Calendar
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import reportApi, { SalesOverview, OrderReport, PaymentReport, ReportParams, EnhancedSalesOverview } from '@/lib/report-api';
import { useBranches } from '@/hooks/use-branches';
import { useRestaurants } from '@/hooks/use-restaurants';
import { branchApi } from '@/lib/branch-api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658', '#8dd1e1'];

export default function SalesReportsPage() {
  const [reportType, setReportType] = useState<'overview' | 'orders' | 'payments' | 'detailed'>('overview');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [restaurantFilter, setRestaurantFilter] = useState<string>('all');
  const [filteredBranches, setFilteredBranches] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState<{ startDate?: string; endDate?: string }>({});
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'year'>('week');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State for fetched data
  const [overviewData, setOverviewData] = useState<SalesOverview | null>(null);
  const [enhancedOverviewData, setEnhancedOverviewData] = useState<EnhancedSalesOverview | null>(null);
  const [ordersData, setOrdersData] = useState<OrderReport | null>(null);
  const [paymentsData, setPaymentsData] = useState<PaymentReport | null>(null);

  // Get dynamic branches and restaurants
  const { branches, loading: branchesLoading } = useBranches();
  const { restaurants, loading: restaurantsLoading } = useRestaurants();

  // Build report parameters
  const buildReportParams = (): ReportParams => {
    const params: ReportParams = {};

    if (branchFilter !== 'all') {
      params.branchName = branchFilter;
    }

    if (restaurantFilter !== 'all') {
      params.restaurantId = restaurantFilter;
    }

    if (dateRange.startDate) {
      params.startDate = dateRange.startDate;
    }

    if (dateRange.endDate) {
      params.endDate = dateRange.endDate;
    }

    return params;
  };

  // Fetch data based on report type
  const fetchReportData = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = buildReportParams();

      switch (reportType) {
        case 'overview':
          const overviewResponse = await reportApi.getSalesOverview(params);
          if (overviewResponse.data.success) {
            setOverviewData(overviewResponse.data.data);
          }
          break;

        case 'detailed':
          const enhancedResponse = await reportApi.getEnhancedSalesOverview(params);
          if (enhancedResponse.data.success) {
            setEnhancedOverviewData(enhancedResponse.data.data);
          }
          break;

        case 'orders':
          const ordersResponse = await reportApi.getOrderReports(params);
          if (ordersResponse.data.success) {
            setOrdersData(ordersResponse.data.data);
          }
          break;

        case 'payments':
          const paymentsResponse = await reportApi.getPaymentReports(params);
          if (paymentsResponse.data.success) {
            setPaymentsData(paymentsResponse.data.data);
          }
          break;
      }
    } catch (err) {
      console.error('Error fetching report data:', err);
      setError('Failed to fetch report data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch branches for selected restaurant
  const fetchBranchesForRestaurant = async (restaurantId: string) => {
    try {
      if (restaurantId === 'all') {
        // When "All Restaurants" is selected, show all branches from the hook
        // The branches from useBranches are already properly formatted
        setFilteredBranches(branches);
      } else {
        // Load branches specific to the selected restaurant
        const branchesResponse = await branchApi.getBranchesByRestaurant(restaurantId);
        const branchesData = branchesResponse.data.data || [];
        const formattedBranches = branchesData.map((branch: any) => ({
          id: branch.id,
          name: branch.name,
          value: branch.name, // Use branch name as value for consistency
          restaurantName: branch.restaurant?.name || 'No Restaurant'
        }));
        setFilteredBranches(formattedBranches);
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
      setFilteredBranches([]);
    }
  };

  // Fetch branches when restaurant selection changes
  useEffect(() => {
    if (branches.length > 0) {
      fetchBranchesForRestaurant(restaurantFilter);
    }
  }, [restaurantFilter, branches]);

  // Reset branch selection when restaurant changes or filtered branches change
  useEffect(() => {
    if (branchFilter !== 'all') {
      const currentBranchExists = filteredBranches.some(branch => branch.value === branchFilter);
      if (!currentBranchExists) {
        setBranchFilter('all');
      }
    }
  }, [filteredBranches]); // Remove branchFilter from dependencies to avoid infinite loop

  // Initial setup - load all branches when available and restaurantFilter is 'all'
  useEffect(() => {
    if (branches.length > 0 && restaurantFilter === 'all' && filteredBranches.length === 0) {
      setFilteredBranches(branches);
    }
  }, [branches, restaurantFilter]); // Removed filteredBranches.length from dependencies

  // Fetch data when filters change
  useEffect(() => {
    fetchReportData();
  }, [reportType, branchFilter, restaurantFilter, dateRange]);

  // Handle export functionality
  const handleExport = async () => {
    try {
      // You can implement export functionality here
      // This could generate a CSV, PDF, or trigger a download from the backend
      console.log('Export functionality to be implemented');
    } catch (err) {
      console.error('Error exporting data:', err);
      setError('Failed to export data.');
    }
  };

  // Loading state component
  if (loading) {
    return (
      <div className="container mx-auto py-6 flex items-center justify-center min-h-96">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading report data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales & Order Reports</h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive sales analytics and order performance metrics
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport} disabled={loading}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-red-800 text-sm">{error}</div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="w-full sm:w-48">
              <label className="text-sm font-medium mb-2 block">Report Type</label>
              <Select value={reportType} onValueChange={(value: 'overview' | 'orders' | 'payments' | 'detailed') => setReportType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select report" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overview">Overview</SelectItem>
                  <SelectItem value="detailed">Detailed Analytics</SelectItem>
                  <SelectItem value="orders">Order Details</SelectItem>
                  <SelectItem value="payments">Payment Analysis</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-48">
              <label className="text-sm font-medium mb-2 block">Restaurant</label>
              <Select value={restaurantFilter} onValueChange={setRestaurantFilter} disabled={restaurantsLoading}>
                <SelectTrigger>
                  <SelectValue placeholder={restaurantsLoading ? "Loading restaurants..." : "All Restaurants"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Restaurants</SelectItem>
                  {restaurants.map((restaurant) => (
                    <SelectItem key={restaurant.id} value={restaurant.value}>
                      {restaurant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-48">
              <label className="text-sm font-medium mb-2 block">Branch</label>
              <Select
                value={branchFilter}
                onValueChange={setBranchFilter}
                disabled={restaurantsLoading || branchesLoading || filteredBranches.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    restaurantsLoading || branchesLoading
                      ? "Loading..."
                      : filteredBranches.length === 0
                        ? "Select a restaurant first"
                        : restaurantFilter === 'all'
                          ? "All Branches"
                          : "Select a branch"
                  } />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  {filteredBranches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.value}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='w-full sm:w-48'>
              <label className="text-sm font-medium mb-2 block">Date Range</label>
              <DateRangePicker
                date={dateRange.startDate && dateRange.endDate ? { from: new Date(dateRange.startDate), to: new Date(dateRange.endDate) } : undefined}
                onDateChange={(dateRange) => setDateRange({ startDate: dateRange.from?.toISOString().split('T')[0], endDate: dateRange.to?.toISOString().split('T')[0] })}
                placeholder='Select Date Range'
                className='w-full'
              />
            </div>
            <Button onClick={fetchReportData} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Time Range Selector for Detailed Reports */}
      {(reportType === 'detailed' || reportType === 'overview') && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-2">
              {['today', 'week', 'month', 'year'].map((range) => (
                <Button
                  key={range}
                  variant={timeRange === range ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTimeRange(range as any)}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overview Report */}
      {reportType === 'overview' && overviewData && (
        <OverviewReport data={overviewData} />
      )}

      {/* Detailed Analytics Report */}
      {reportType === 'detailed' && enhancedOverviewData && (
        <EnhancedOverviewReport data={enhancedOverviewData} />
      )}

      {/* Orders Report */}
      {reportType === 'orders' && ordersData && (
        <OrdersReport data={ordersData} />
      )}

      {/* Payments Report */}
      {reportType === 'payments' && paymentsData && (
        <PaymentsReport data={paymentsData} />
      )}

      {/* No Data State */}
      {!loading && !overviewData && !enhancedOverviewData && !ordersData && !paymentsData && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground">No data available for the selected filters.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Enhanced Overview Report Component
function EnhancedOverviewReport({ data }: { data: EnhancedSalesOverview }) {
  return (
    <>
      {/* Enhanced Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£{data.totalRevenue.toFixed(2)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {data.growthRate > 0 ? (
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              ) : (
                <TrendingUp className="h-3 w-3 mr-1 text-red-500 transform rotate-180" />
              )}
              {data.growthRate > 0 ? '+' : ''}{data.growthRate.toFixed(1)}% from last period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              {data.avgOrdersPerDay?.toFixed(1) || '0'} avg/day
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£{data.avgOrderValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              +8.2% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.profitMargin?.toFixed(1) || '0'}%</div>
            <p className="text-xs text-muted-foreground">
              Net: £{data.netProfit?.toFixed(2) || '0'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customer Count</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.uniqueCustomers || '0'}</div>
            <p className="text-xs text-muted-foreground">
              {data.newCustomers || '0'} new customers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.successRate ? (data.successRate * 100).toFixed(1) : '0'}%
            </div>
            <p className="text-xs text-muted-foreground">
              Order completion
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend with Comparison */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue Trend & Comparison</CardTitle>
            <CardDescription>Current vs previous period performance</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.comparisonChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`£${value}`, 'Revenue']}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="current" 
                  stroke="#8884d8" 
                  fill="#8884d8"
                  fillOpacity={0.3}
                  strokeWidth={2}
                  name="Current Period"
                />
                <Area 
                  type="monotone" 
                  dataKey="previous" 
                  stroke="#82ca9d" 
                  fill="#82ca9d"
                  fillOpacity={0.3}
                  strokeWidth={2}
                  name="Previous Period"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
            <CardDescription>Key business indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Conversion Rate</span>
                <span className="font-medium">{data.conversionRate?.toFixed(1) || '0'}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Customer Retention</span>
                <span className="font-medium">{data.retentionRate?.toFixed(1) || '0'}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Avg Serving Time</span>
                <span className="font-medium">{data.avgServingTime || '0'} min</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Table Turnover</span>
                <span className="font-medium">{data.tableTurnover || '0'}/day</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Waste Percentage</span>
                <span className="font-medium">{data.wastePercentage?.toFixed(1) || '0'}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Products & Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Products</CardTitle>
            <CardDescription>By revenue and quantity sold</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.topProducts?.map((product, index) => (
                <div key={product.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground rounded text-xs font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{product.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {product.category}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">£{product.revenue.toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground">
                      {product.quantity} sold
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sales by Hour */}
        <Card>
          <CardHeader>
            <CardTitle>Peak Sales Hours</CardTitle>
            <CardDescription>Revenue distribution by hour</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.salesByHour}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip formatter={(value) => [`£${value}`, 'Revenue']} />
                <Bar dataKey="revenue" fill="#8884d8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Analytics */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Analytics</CardTitle>
            <CardDescription>Customer behavior and metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm font-medium">New vs Returning</div>
                  <div className="flex justify-between text-sm">
                    <span>New Customers:</span>
                    <span>{data.newCustomers || '0'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Returning:</span>
                    <span>{data.returningCustomers || '0'}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Loyalty Metrics</div>
                  <div className="flex justify-between text-sm">
                    <span>Avg Visits:</span>
                    <span>{data.avgCustomerVisits?.toFixed(1) || '0'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Frequency:</span>
                    <span>{data.visitFrequency?.toFixed(1) || '0'}/week</span>
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t">
                <div className="text-sm font-medium mb-2">Revenue per Customer</div>
                <div className="text-2xl font-bold text-primary">
                  £{data.revenuePerCustomer?.toFixed(2) || '0'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Staff Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Staff Performance</CardTitle>
            <CardDescription>Top performing staff members</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.topStaff?.map((staff, index) => (
                <div key={staff.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {staff.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-sm">{staff.name}</div>
                      <div className="text-xs text-muted-foreground capitalize">
                        {staff.role.toLowerCase()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-sm">{staff.orders} orders</div>
                    <div className="text-xs text-muted-foreground">
                      £{staff.revenue.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {data.growthRate?.toFixed(1) || '0'}%
              </div>
              <div className="text-xs text-muted-foreground">Revenue Growth</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                £{data.revenuePerCustomer?.toFixed(2) || '0'}
              </div>
              <div className="text-xs text-muted-foreground">Revenue/Customer</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {data.ordersPerHour?.toFixed(1) || '0'}
              </div>
              <div className="text-xs text-muted-foreground">Orders/Hour</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {data.efficiencyScore?.toFixed(1) || '0'}%
              </div>
              <div className="text-xs text-muted-foreground">Efficiency Score</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Insights */}
      <PerformanceInsights data={data} />

      {/* Real-time Metrics */}
      <RealTimeMetrics data={data} />
    </>
  );
}

// Original Overview Report Component (keep existing)
function OverviewReport({ data }: { data: SalesOverview }) {
  return (
    <>
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              £{data.totalRevenue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              From {data.totalOrders} orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              £{data.avgOrderValue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              +8% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.ordersByStatus.find(o => o.status === 'COMPLETED')?._count._all || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Completed orders
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Daily revenue over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.dailySales}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <YAxis />
                <Tooltip
                  formatter={(value) => [`£${value}`, 'Revenue']}
                  labelFormatter={(label) => new Date(label).toLocaleDateString()}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#8884d8"
                  strokeWidth={2}
                  name="Revenue"
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Orders by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Orders by Status</CardTitle>
            <CardDescription>Distribution of order statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.ordersByStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, _count }) => `${status}: ${_count._all}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="_count._all"
                >
                  {data.ordersByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value, 'Orders']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders by Type */}
        <Card>
          <CardHeader>
            <CardTitle>Orders by Type</CardTitle>
            <CardDescription>Breakdown of order types</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.ordersByType.map((type, index) => (
                <div key={type.orderType} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div
                      className="w-3 h-3 rounded-full mr-3"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="capitalize">
                      {type.orderType.toLowerCase().replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{type._count._all} orders</div>
                    <div className="text-sm text-muted-foreground">
                      £{type._sum.total?.toFixed(2) || '0.00'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
            <CardDescription>Distribution of payment methods</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.paymentMethods.map((method, index) => (
                <div key={method.paymentMethod} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div
                      className="w-3 h-3 rounded-full mr-3"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="capitalize">
                      {method.paymentMethod.toLowerCase()}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{method._count._all} transactions</div>
                    <div className="text-sm text-muted-foreground">
                      £{method._sum.total?.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

// Performance Insights Component
function PerformanceInsights({ data }: { data: any }) {
  const insights = [
    {
      type: 'success',
      title: 'Strong Revenue Growth',
      description: `Revenue increased by ${data.growthRate?.toFixed(1)}% compared to last period. Consider expanding peak hour operations.`,
      action: 'View Details'
    },
    {
      type: 'warning',
      title: 'Staff Optimization Opportunity',
      description: 'Evening shift shows lower efficiency. Consider staff training or reallocation.',
      action: 'Optimize Staffing'
    },
    {
      type: 'info',
      title: 'Customer Retention Strategy',
      description: `${data.retentionRate?.toFixed(1)}% customer retention rate. Implement loyalty programs to improve.`,
      action: 'Create Campaign'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Insights</CardTitle>
        <CardDescription>AI-powered business recommendations</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {insights.map((insight, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 bg-muted/50 rounded-lg">
              <div className={`p-2 rounded-full ${
                insight.type === 'success' ? 'bg-green-100 text-green-600' :
                insight.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                'bg-blue-100 text-blue-600'
              }`}>
                {insight.type === 'success' ? <TrendingUp className="h-4 w-4" /> :
                 insight.type === 'warning' ? <AlertTriangle className="h-4 w-4" /> :
                 <Lightbulb className="h-4 w-4" />}
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm">{insight.title}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {insight.description}
                </div>
                {insight.action && (
                  <Button variant="outline" size="sm" className="mt-2">
                    {insight.action}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Real-time Metrics Component
function RealTimeMetrics({ data }: { data: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Real-time Metrics</CardTitle>
        <CardDescription>Live business performance</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {data.ordersToday || 0}
            </div>
            <div className="text-sm text-green-800">Orders Today</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              £{data.revenueToday?.toFixed(2) || '0'}
            </div>
            <div className="text-sm text-blue-800">Revenue Today</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {data.customersToday || 0}
            </div>
            <div className="text-sm text-purple-800">Customers Today</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {data.avgServiceTime || '0'}min
            </div>
            <div className="text-sm text-orange-800">Avg Service Time</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Orders Report Component (keep existing)
function OrdersReport({ data }: { data: OrderReport }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.metrics.totalOrders||0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Badge variant="default" className="bg-green-100 text-green-800">
              {data.metrics.completedOrders||0}
            </Badge>
          </CardHeader>
          <CardContent >
           <div className='text-2xl font-bold'>
            {data.metrics.completedOrders||0}
           </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
            <Badge variant="destructive">
              {data.metrics.cancelledOrders||0}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.metrics.cancelledOrders||0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Value</CardTitle>
            <div className="text-2xl font-bold">
              £{data.metrics.avgOrderValue.toFixed(2)}
            </div>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>Latest order transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3">Order #</th>
                  <th className="text-left py-3">Date</th>
                  <th className="text-left py-3">Status</th>
                  <th className="text-left py-3">Type</th>
                  <th className="text-left py-3">Items</th>
                  <th className="text-right py-3">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.orders.map((order) => (
                  <tr key={order.id} className="border-b">
                    <td className="py-3">{order.orderNumber}</td>
                    <td className="py-3">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="py-3">
                      <Badge variant={
                        order.status === 'COMPLETED' ? 'default' :
                          order.status === 'CANCELLED' ? 'destructive' : 'secondary'
                      }>
                        {order.status}
                      </Badge>
                    </td>
                    <td className="py-3 capitalize">{order.orderType.toLowerCase()}</td>
                    <td className="py-3">{order.items.length} items</td>
                    <td className="py-3 text-right">£{order.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Payments Report Component (keep existing)
function PaymentsReport({ data }: { data: PaymentReport }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Payment Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.paymentSummary.map((method) => (
                <div key={method.paymentMethod} className="flex justify-between items-center">
                  <span className="capitalize">{method.paymentMethod.toLowerCase()}</span>
                  <div className="text-right">
                    <div className="font-medium">{method._count._all} transactions</div>
                    <div className="text-sm text-muted-foreground">
                      £{method._sum.total?.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.paymentStatusSummary.map((status) => (
                <div key={status.paymentStatus} className="flex justify-between items-center">
                  <Badge variant={
                    status.paymentStatus === 'PAID' ? 'default' :
                      status.paymentStatus === 'PENDING' ? 'secondary' : 'destructive'
                  }>
                    {status.paymentStatus}
                  </Badge>
                  <div className="text-right">
                    <div className="font-medium">{status._count._all}</div>
                    <div className="text-sm text-muted-foreground">
                      £{status._sum.total?.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total Transactions:</span>
                <span className="font-medium">{data.totalTransactions}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Amount:</span>
                <span className="font-medium">£{data.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}