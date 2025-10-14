// app/dashboard/reports/branch/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 

  Building, 
  TrendingUp, 
  Users,
  Download,
  BarChart3,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { reportApi, ReportParams } from '@/lib/report-api';
import { DateRangePicker } from '@/components/ui/date-range-picker';
interface BranchPerformance {
  branchName: string;
  _count: { _all: number };
  _sum: { 
    total: number; 
    subtotal: number; 
    tax: number;
  };
  completedOrders: number;
  staffCount: number;
  inventoryValue: number;
  avgOrderValue: number;
  completionRate: number;
}

interface BranchComparisonData {
  [branchName: string]: {
    [date: string]: {
      orders: number;
      revenue: number;
    };
  };
}

export default function BranchReportsPage() {
  const [reportType, setReportType] = useState<'performance' | 'comparison'>('performance');
  const [dateRange, setDateRange] = useState<{ startDate?: string; endDate?: string }>({});
  
  // State for branch performance data
  const [branchPerformance, setBranchPerformance] = useState<{
    branches: BranchPerformance[];
    totalBranches: number;
    overallRevenue: number;
  } | null>(null);
  
  // State for branch comparison data
  const [branchComparison, setBranchComparison] = useState<{
    comparison: BranchComparisonData;
    branches: string[];
  } | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Build API params
  const buildParams = (): ReportParams => {
    const params: ReportParams = {
      ...dateRange
    };
    return params;
  };

  // Fetch branch performance data
  const fetchBranchPerformance = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await reportApi.getBranchPerformance(buildParams());
      if (response.data.success) {
        setBranchPerformance(response.data.data);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError('Failed to fetch branch performance data');
      console.error('Error fetching branch performance:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch branch comparison data
  const fetchBranchComparison = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await reportApi.getBranchComparison(buildParams());
      if (response.data.success) {
        setBranchComparison(response.data.data);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError('Failed to fetch branch comparison data');
      console.error('Error fetching branch comparison:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when report type or date range changes
  useEffect(() => {
    if (reportType === 'performance') {
      fetchBranchPerformance();
    } else {
      fetchBranchComparison();
    }
  }, [reportType, dateRange]);

  // Handle export functionality
  const handleExport = async () => {
    try {
      // You can implement export functionality here
      // This could generate a CSV or PDF report
      console.log('Exporting branch report...');
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  // Loading state component
  const LoadingState = () => (
    <div className="flex justify-center items-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <span className="ml-2 text-muted-foreground">Loading data...</span>
    </div>
  );

  // Error state component
  const ErrorState = ({ message }: { message: string }) => (
    <div className="text-center py-12 text-red-600">
      <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
      <p>{message}</p>
      <Button 
        variant="outline" 
        className="mt-4"
        onClick={() => {
          if (reportType === 'performance') {
            fetchBranchPerformance();
          } else {
            fetchBranchComparison();
          }
        }}
      >
        Retry
      </Button>
    </div>
  );

  // Prepare data for comparison charts
  const prepareComparisonChartData = () => {
    if (!branchComparison?.comparison) return [];

    const dates = new Set<string>();
    Object.values(branchComparison.comparison).forEach(branchData => {
      Object.keys(branchData).forEach(date => dates.add(date));
    });

    return Array.from(dates).sort().map(date => {
      const dataPoint: any = { date };
      branchComparison.branches.forEach(branch => {
        const branchData = branchComparison.comparison[branch]?.[date];
        if (branchData) {
          dataPoint[`${branch}.revenue`] = branchData.revenue;
          dataPoint[`${branch}.orders`] = branchData.orders;
        }
      });
      return dataPoint;
    });
  };

  const comparisonChartData = prepareComparisonChartData();

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Branch Performance Reports</h1>
          <p className="text-muted-foreground mt-2">
            Multi-branch comparison and performance analytics
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="w-full sm:w-48">
              <label className="text-sm font-medium mb-2 block">Report Type</label>
              <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select report" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="performance">Branch Performance</SelectItem>
                  <SelectItem value="comparison">Branch Comparison</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && <LoadingState />}

      {/* Error State */}
      {error && <ErrorState message={error} />}

      {/* Branch Performance Report */}
      {!loading && !error && reportType === 'performance' && branchPerformance && (
        <div className="space-y-6">
          {/* Overall Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Branches</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{branchPerformance.totalBranches}</div>
                <p className="text-xs text-muted-foreground">
                  Active locations
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">£{branchPerformance.overallRevenue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  Across all branches
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {branchPerformance.branches.reduce((sum, branch) => sum + branch.staffCount, 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Active staff members
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {branchPerformance.branches.reduce((sum, branch) => sum + branch._count._all, 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  All branch orders
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Branch Performance Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {branchPerformance.branches.map((branch) => (
              <Card key={branch.branchName}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    {branch.branchName}
                  </CardTitle>
                  <CardDescription>Branch performance metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-2xl font-bold">£{branch._sum.total.toFixed(2)}</div>
                        <div className="text-sm text-muted-foreground">Revenue</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{branch._count._all}</div>
                        <div className="text-sm text-muted-foreground">Orders</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="font-medium">£{branch.avgOrderValue.toFixed(2)}</div>
                        <div className="text-muted-foreground">Avg Order</div>
                      </div>
                      <div>
                        <div className="font-medium">{branch.staffCount}</div>
                        <div className="text-muted-foreground">Staff</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Badge variant={
                          branch.completionRate > 90 ? 'default' : 
                          branch.completionRate > 75 ? 'secondary' : 'destructive'
                        }>
                          {branch.completionRate.toFixed(1)}% Complete
                        </Badge>
                      </div>
                      <div>
                        <div className="font-medium">£{branch.inventoryValue.toFixed(2)}</div>
                        <div className="text-muted-foreground">Inventory Value</div>
                      </div>
                    </div>

                    {/* Additional Metrics */}
                    <div className="grid grid-cols-3 gap-4 text-sm border-t pt-3">
                      <div>
                        <div className="font-medium">£{branch._sum.subtotal.toFixed(2)}</div>
                        <div className="text-muted-foreground">Subtotal</div>
                      </div>
                      <div>
                        <div className="font-medium">£{branch._sum.tax.toFixed(2)}</div>
                        <div className="text-muted-foreground">Tax</div>
                      </div>
                      <div>
                        <div className="font-medium">{branch.completedOrders}</div>
                        <div className="text-muted-foreground">Completed</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Revenue Comparison Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Branch</CardTitle>
              <CardDescription>Comparison of branch performance</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={branchPerformance.branches}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="branchName" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [`£${value.toFixed(2)}`, 'Revenue']}
                  />
                  <Legend />
                  <Bar dataKey="_sum.total" fill="#8884d8" name="Total Revenue" />
                  <Bar dataKey="_sum.tax" fill="#82ca9d" name="Tax Collected" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Orders Comparison Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Orders by Branch</CardTitle>
              <CardDescription>Order volume comparison</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={branchPerformance.branches}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="branchName" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="_count._all" fill="#ffc658" name="Total Orders" />
                  <Bar dataKey="completedOrders" fill="#00C49F" name="Completed Orders" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Performance Metrics Table */}
          <Card>
            <CardHeader>
              <CardTitle>Branch Performance Summary</CardTitle>
              <CardDescription>Detailed metrics for each branch</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3">Branch</th>
                      <th className="text-left py-3">Orders</th>
                      <th className="text-left py-3">Revenue</th>
                      <th className="text-left py-3">Avg Order</th>
                      <th className="text-left py-3">Completion Rate</th>
                      <th className="text-left py-3">Staff</th>
                      <th className="text-left py-3">Inventory Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {branchPerformance.branches.map((branch) => (
                      <tr key={branch.branchName} className="border-b">
                        <td className="py-3 font-medium">{branch.branchName}</td>
                        <td className="py-3">{branch._count._all}</td>
                        <td className="py-3">£{branch._sum.total.toFixed(2)}</td>
                        <td className="py-3">£{branch.avgOrderValue.toFixed(2)}</td>
                        <td className="py-3">
                          <Badge variant={
                            branch.completionRate > 90 ? 'default' : 
                            branch.completionRate > 75 ? 'secondary' : 'destructive'
                          }>
                            {branch.completionRate.toFixed(1)}%
                          </Badge>
                        </td>
                        <td className="py-3">{branch.staffCount}</td>
                        <td className="py-3">£{branch.inventoryValue.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Branch Comparison Report */}
      {!loading && !error && reportType === 'comparison' && branchComparison && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Branch Revenue Comparison</CardTitle>
              <CardDescription>Daily revenue trends across all branches</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={comparisonChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number, name: string) => {
                      if (name.includes('revenue')) {
                        return [`£${value.toFixed(2)}`, 'Revenue'];
                      }
                      return [value, 'Orders'];
                    }}
                  />
                  <Legend />
                  {branchComparison.branches.map((branch, index) => (
                    <Line 
                      key={branch}
                      type="monotone" 
                      dataKey={`${branch}.revenue`}
                      stroke={index === 0 ? '#8884d8' : index === 1 ? '#82ca9d' : '#ffc658'}
                      strokeWidth={2}
                      name={`${branch} Revenue`}
                      dot={{ r: 4 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Branch Orders Comparison</CardTitle>
              <CardDescription>Daily order volume across all branches</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={comparisonChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {branchComparison.branches.map((branch, index) => (
                    <Line 
                      key={branch}
                      type="monotone" 
                      dataKey={`${branch}.orders`}
                      stroke={index === 0 ? '#8884d8' : index === 1 ? '#82ca9d' : '#ffc658'}
                      strokeWidth={2}
                      name={`${branch} Orders`}
                      dot={{ r: 4 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Volume Summary</CardTitle>
                <CardDescription>Total orders by branch</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {branchComparison.branches.map((branch) => {
                    const totalOrders = Object.values(branchComparison.comparison[branch] || {}).reduce(
                      (sum: number, day: any) => sum + day.orders, 0
                    );
                    return (
                      <div key={branch} className="flex justify-between items-center">
                        <span className="font-medium">{branch}</span>
                        <div className="text-right">
                          <div className="text-lg font-bold">{totalOrders}</div>
                          <div className="text-sm text-muted-foreground">orders</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Summary</CardTitle>
                <CardDescription>Total revenue by branch</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {branchComparison.branches.map((branch) => {
                    const totalRevenue = Object.values(branchComparison.comparison[branch] || {}).reduce(
                      (sum: number, day: any) => sum + day.revenue, 0
                    );
                    return (
                      <div key={branch} className="flex justify-between items-center">
                        <span className="font-medium">{branch}</span>
                        <div className="text-right">
                          <div className="text-lg font-bold">£{totalRevenue.toFixed(2)}</div>
                          <div className="text-sm text-muted-foreground">revenue</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Comparison Table */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Branch Comparison</CardTitle>
              <CardDescription>Detailed daily performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3">Date</th>
                      {branchComparison.branches.map(branch => (
                        <th key={branch} colSpan={2} className="text-center py-3 border-l">
                          {branch}
                        </th>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <th className="text-left py-3"></th>
                      {branchComparison.branches.map(branch => (
                        <>
                          <th key={`${branch}-orders`} className="text-center py-3 border-l">
                            Orders
                          </th>
                          <th key={`${branch}-revenue`} className="text-center py-3">
                            Revenue
                          </th>
                        </>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonChartData.slice(0, 7).map((day) => (
                      <tr key={day.date} className="border-b">
                        <td className="py-3 font-medium">{day.date}</td>
                        {branchComparison.branches.map(branch => (
                          <>
                            <td className="py-3 text-center border-l">
                              {day[`${branch}.orders`] || 0}
                            </td>
                            <td className="py-3 text-center">
                              £{(day[`${branch}.revenue`] || 0).toFixed(2)}
                            </td>
                          </>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && (
        <>
          {reportType === 'performance' && (!branchPerformance || branchPerformance.branches.length === 0) && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12 text-muted-foreground">
                  <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No branch performance data available for the selected period.</p>
                </div>
              </CardContent>
            </Card>
          )}
          {reportType === 'comparison' && (!branchComparison || branchComparison.branches.length === 0) && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No branch comparison data available for the selected period.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}