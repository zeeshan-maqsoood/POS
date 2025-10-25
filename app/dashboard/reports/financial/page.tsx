// app/dashboard/reports/financial/page.tsx
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
  Line,
  AreaChart,
  Area
} from 'recharts';
import { reportApi, ReportParams } from '@/lib/report-api';
import { useBranches } from '@/hooks/use-branches';

export default function FinancialReportsPage() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date()
  });
  const [reportType, setReportType] = useState<'revenue' | 'taxes'>('revenue');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revenueData, setRevenueData] = useState<any>(null);
  const [taxData, setTaxData] = useState<any>(null);

  // Get dynamic branches
  const { branches, loading: branchesLoading } = useBranches();

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params: ReportParams = {
        startDate: dateRange?.from?.toISOString(),
        endDate: dateRange?.to?.toISOString(),
        branchName: branchFilter === 'all' ? undefined : branchFilter
      };

      if (reportType === 'revenue') {
        const response = await reportApi.getRevenueReports(params);
        setRevenueData(response.data.data);
      } else {
        const response = await reportApi.getTaxReports(params);
        setTaxData(response.data.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [dateRange, reportType, branchFilter]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading financial reports...</p>
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
              <p>Error loading reports: {error}</p>
              <Button onClick={fetchReports} className="mt-4">
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
          <h1 className="text-3xl font-bold tracking-tight">Financial Reports</h1>
          <p className="text-muted-foreground mt-2">
            Revenue analysis, tax reports, and financial performance
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchReports} disabled={loading}>
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
              <label className="text-sm font-medium mb-2 block">Report Type</label>
              <Select value={reportType} onValueChange={(value: 'revenue' | 'taxes') => setReportType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select report" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="revenue">Revenue Analysis</SelectItem>
                  <SelectItem value="taxes">Tax Reports</SelectItem>
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

      {/* Revenue Reports */}
      {reportType === 'revenue' && revenueData && (
        <RevenueReportView data={revenueData} formatCurrency={formatCurrency} />
      )}

      {/* Tax Reports */}
      {reportType === 'taxes' && taxData && (
        <TaxReportView data={taxData} formatCurrency={formatCurrency} />
      )}

      {/* Export Options */}
      <ExportOptions />
    </div>
  );
}

// Revenue Report Component
function RevenueReportView({ data, formatCurrency }: { data: any; formatCurrency: (amount: number) => string }) {
  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.summary.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              Total gross revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.summary.totalSubtotal)}</div>
            <p className="text-xs text-muted-foreground">
              Before tax and discounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tax Collected</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.summary.totalTax)}</div>
            <p className="text-xs text-muted-foreground">
              VAT collected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.summary.avgOrderValue)}</div>
            <p className="text-xs text-muted-foreground">
              Per order average
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Daily revenue with tax breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.dailyRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="createdAt" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [formatCurrency(Number(value)), 'Amount']}
                  labelFormatter={(label) => new Date(label).toLocaleDateString()}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="_sum.total" 
                  stackId="1"
                  stroke="#8884d8" 
                  fill="#8884d8"
                  name="Total Revenue"
                />
                <Area 
                  type="monotone" 
                  dataKey="_sum.tax" 
                  stackId="2"
                  stroke="#82ca9d" 
                  fill="#82ca9d"
                  name="Tax"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue by Order Type */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Order Type</CardTitle>
            <CardDescription>Breakdown of revenue sources</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.revenueByType}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="orderType" 
                  tickFormatter={(value) => value.replace('_', ' ').toLowerCase()}
                />
                <YAxis />
                <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Revenue']} />
                <Legend />
                <Bar dataKey="_sum.total" fill="#8884d8" name="Revenue" />
                <Bar dataKey="_count._all" fill="#82ca9d" name="Orders" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Summary</CardTitle>
          <CardDescription>Comprehensive revenue breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(data.summary.totalRevenue)}
              </div>
              <div className="text-sm text-muted-foreground">Gross Revenue</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold">
                {formatCurrency(data.summary.totalSubtotal)}
              </div>
              <div className="text-sm text-muted-foreground">Net Revenue</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(data.summary.totalTax)}
              </div>
              <div className="text-sm text-muted-foreground">Tax Collected</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(data.summary.totalDiscount || 0)}
              </div>
              <div className="text-sm text-muted-foreground">Discounts Given</div>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">Performance Metrics</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Orders:</span>
                    <span className="font-medium">{data.summary.totalOrders}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average Order Value:</span>
                    <span className="font-medium">{formatCurrency(data.summary.avgOrderValue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Growth Rate:</span>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      +{data.growthRate?.toFixed(1) || 0}%
                    </Badge>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Revenue Distribution</h4>
                <div className="space-y-2 text-sm">
                  {data.revenueByType?.map((type: any) => (
                    <div key={type.orderType} className="flex justify-between">
                      <span className="capitalize">{type.orderType.replace('_', ' ').toLowerCase()}:</span>
                      <span className="font-medium">
                        {formatCurrency(type._sum.total)} ({type._count._all} orders)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Tax Report Component
function TaxReportView({ data, formatCurrency }: { data: any; formatCurrency: (amount: number) => string }) {
  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tax Collected</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.summary.totalTax)}</div>
            <p className="text-xs text-muted-foreground">
              Total VAT collected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Tax per Order</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.summary.avgTaxPerOrder)}</div>
            <p className="text-xs text-muted-foreground">
              Average tax collected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Effective Tax Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.taxRate?.toFixed(1) || 0}%</div>
            <p className="text-xs text-muted-foreground">
              Of total revenue
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tax Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Tax Collection */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Tax Collection</CardTitle>
            <CardDescription>Tax collected per day</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.dailyTax}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="createdAt" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [formatCurrency(Number(value)), 'Tax']}
                  labelFormatter={(label) => new Date(label).toLocaleDateString()}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="_sum.tax" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  name="Tax Collected"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tax by Branch */}
        <Card>
          <CardHeader>
            <CardTitle>Tax by Branch</CardTitle>
            <CardDescription>Tax collection across branches</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.taxByBranch}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="branchName" />
                <YAxis />
                <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Tax']} />
                <Legend />
                <Bar dataKey="_sum.tax" fill="#8884d8" name="Tax Collected" />
                <Bar dataKey="_count._all" fill="#82ca9d" name="Orders" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tax Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Tax Summary Report</CardTitle>
          <CardDescription>Comprehensive tax collection details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Tax Collection Overview</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Tax Liability:</span>
                    <span className="font-medium">{formatCurrency(data.summary.totalTax)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Average per Order:</span>
                    <span className="font-medium">{formatCurrency(data.summary.avgTaxPerOrder)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Effective Tax Rate:</span>
                    <Badge variant="outline">{data.summary.taxRate?.toFixed(1) || 0}%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Trend vs Last Period:</span>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      +{data.taxTrend?.toFixed(1) || 0}%
                    </Badge>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-3">Branch Performance</h4>
                <div className="space-y-3">
                  {data.taxByBranch?.map((branch: any) => (
                    <div key={branch.branchName} className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{branch.branchName}:</span>
                      <span className="font-medium">
                        {formatCurrency(branch._sum.tax)} ({branch._count._all} orders)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Export Options Component
function ExportOptions() {
  const handleExport = async (format: string) => {
    // Implement export functionality
    console.log(`Exporting in ${format} format`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Export Reports</CardTitle>
        <CardDescription>Download financial data in various formats</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4">
          <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
            <Download className="h-4 w-4 mr-2" />
            PDF Report
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('excel')}>
            <Download className="h-4 w-4 mr-2" />
            Excel Spreadsheet
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
            <Download className="h-4 w-4 mr-2" />
            CSV Data
          </Button>
        </div>
        <div className="mt-4 text-sm text-muted-foreground">
          <p>Exports will include data for the selected date range and filters.</p>
        </div>
      </CardContent>
    </Card>
  );
}