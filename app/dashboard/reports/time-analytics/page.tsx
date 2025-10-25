// app/dashboard/reports/time-analytics/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  TrendingUp, 
  Download,
  BarChart3,
  Receipt,
  Clock,
  Users,
  Coffee,
  Calendar,
  Loader2
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRange } from 'react-day-picker';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { reportApi, ReportParams, TimeAnalyticsData } from '@/lib/report-api';
import { useBranches } from '@/hooks/use-branches';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function TimeAnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date()
  });
  const [timeView, setTimeView] = useState<'hourly' | 'daily' | 'weekly'>('hourly');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeData, setTimeData] = useState<TimeAnalyticsData | null>(null);

  // Get dynamic branches
  const { branches, loading: branchesLoading } = useBranches();

  const fetchTimeAnalytics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params: ReportParams = {
        startDate: dateRange?.from?.toISOString(),
        endDate: dateRange?.to?.toISOString(),
        branchName: branchFilter === 'all' ? undefined : branchFilter
      };

      const response = await reportApi.getTimeAnalytics(params);
      setTimeData(response.data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch time analytics');
      console.error('Error fetching time analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeAnalytics();
  }, [dateRange, branchFilter]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  if (loading && !timeData) {
    return (
      <div className="container mx-auto py-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading time analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="text-center text-destructive">
              <p>Error loading time analytics: {error}</p>
              <Button onClick={fetchTimeAnalytics} className="mt-4">
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Time Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Sales patterns, peak hours, and time-based performance metrics
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchTimeAnalytics} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
          Refresh Data
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Date Range</label>
              <DateRangePicker
                date={dateRange}
                onDateChange={setDateRange}
              />
            </div>
            <div className="w-full sm:w-48">
              <label className="text-sm font-medium mb-2 block">Time View</label>
              <Select value={timeView} onValueChange={(value: 'hourly' | 'daily' | 'weekly') => setTimeView(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select view" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Hourly Analysis</SelectItem>
                  <SelectItem value="daily">Daily Trends</SelectItem>
                  <SelectItem value="weekly">Weekly Patterns</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-48">
              <label className="text-sm font-medium mb-2 block">Branch</label>
              <Select value={branchFilter} onValueChange={setBranchFilter} disabled={branchesLoading}>
                <SelectTrigger>
                  <SelectValue placeholder={branchesLoading ? "Loading branches..." : "All Branches"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.value}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {timeData ? (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Peak Hour</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{timeData.peakHours.busiestHour}</div>
                <p className="text-xs text-muted-foreground">
                  {timeData.peakHours.busiestHourOrders} orders
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Peak Hour Sales</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(timeData.peakHours.busiestHourSales)}</div>
                <p className="text-xs text-muted-foreground">
                  Highest performing hour
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Visit Duration</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{timeData.customerBehavior.avgVisitDuration}</div>
                <p className="text-xs text-muted-foreground">
                  Per customer
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Table Turnover</CardTitle>
                <Coffee className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{timeData.customerBehavior.tableTurnoverRate}</div>
                <p className="text-xs text-muted-foreground">
                  Average daily
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Sales by Hour Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Sales by Hour</CardTitle>
                <CardDescription>24-hour sales distribution and order patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={timeData.salesByHour}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip 
                      formatter={(value, name) => {
                        if (name === 'sales') return [formatCurrency(Number(value)), 'Sales'];
                        if (name === 'orders') return [value, 'Orders'];
                        return [formatCurrency(Number(value)), 'Avg Order Value'];
                      }}
                    />
                    <Legend />
                    <Bar 
                      yAxisId="left"
                      dataKey="sales" 
                      fill="#8884d8" 
                      name="Sales"
                      radius={[2, 2, 0, 0]}
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="orders" 
                      stroke="#ff7300" 
                      strokeWidth={2}
                      name="Orders"
                      dot={{ fill: '#ff7300', strokeWidth: 2 }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Sales by Day of Week */}
            <Card>
              <CardHeader>
                <CardTitle>Sales by Day of Week</CardTitle>
                <CardDescription>Weekly performance patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={timeData.salesByDay}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Sales']} />
                    <Legend />
                    <Bar 
                      dataKey="sales" 
                      fill="#00C49F" 
                      name="Sales"
                      radius={[2, 2, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Peak Hours Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Peak vs Quiet Hours</CardTitle>
                <CardDescription>Performance comparison</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <div>
                      <div className="font-medium text-green-800">Peak Hour</div>
                      <div className="text-2xl font-bold text-green-600">
                        {timeData.peakHours.busiestHour}
                      </div>
                      <div className="text-sm text-green-600">
                        {timeData.peakHours.busiestHourOrders} orders
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(timeData.peakHours.busiestHourSales)}
                      </div>
                      <div className="text-sm text-green-600">Sales</div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <div>
                      <div className="font-medium text-blue-800">Quietest Hour</div>
                      <div className="text-2xl font-bold text-blue-600">
                        {timeData.peakHours.quietestHour}
                      </div>
                      <div className="text-sm text-blue-600">
                        {timeData.peakHours.quietestHourOrders} orders
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">
                        {formatCurrency(timeData.peakHours.quietestHourSales)}
                      </div>
                      <div className="text-sm text-blue-600">Sales</div>
                    </div>
                  </div>

                  <div className="text-center p-3 bg-amber-50 rounded-lg">
                    <div className="font-medium text-amber-800">Peak to Quiet Ratio</div>
                    <div className="text-2xl font-bold text-amber-600">
                      {timeData.peakHours.peakToQuietRatio.toFixed(1)}x
                    </div>
                    <div className="text-sm text-amber-600">Higher sales during peak</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Staff Performance and Customer Behavior */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Staff Performance by Shift */}
            {timeData.staffPerformance && timeData.staffPerformance.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Staff Performance by Shift</CardTitle>
                  <CardDescription>Sales and orders per staff member</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={timeData.staffPerformance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="shift" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value, name) => {
                          if (name === 'salesPerStaff') return [formatCurrency(Number(value)), 'Sales/Staff'];
                          return [value, 'Orders/Staff'];
                        }}
                      />
                      <Legend />
                      <Bar 
                        dataKey="salesPerStaff" 
                        fill="#8884d8" 
                        name="Sales per Staff"
                        radius={[2, 2, 0, 0]}
                      />
                      <Bar 
                        dataKey="ordersPerStaff" 
                        fill="#82ca9d" 
                        name="Orders per Staff"
                        radius={[2, 2, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Customer Behavior Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Behavior Analysis</CardTitle>
                <CardDescription>Time-based customer metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <div className="text-sm font-medium text-blue-800">Average Visit</div>
                      <div className="text-xl font-bold text-blue-600">
                        {timeData.customerBehavior.avgVisitDuration}
                      </div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <div className="text-sm font-medium text-green-800">Peak Wait Time</div>
                      <div className="text-xl font-bold text-green-600">
                        {timeData.customerBehavior.peakWaitTime}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-amber-50 rounded-lg">
                      <Coffee className="h-8 w-8 text-amber-600 mx-auto mb-2" />
                      <div className="text-sm font-medium text-amber-800">Avg Wait Time</div>
                      <div className="text-xl font-bold text-amber-600">
                        {timeData.customerBehavior.avgWaitTime}
                      </div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <Calendar className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                      <div className="text-sm font-medium text-purple-800">Table Turnover</div>
                      <div className="text-xl font-bold text-purple-600">
                        {timeData.customerBehavior.tableTurnoverRate}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center">
            <p>No time analytics data available for the selected filters.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}