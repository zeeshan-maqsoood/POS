// app/dashboard/reports/inventory/page.tsx - Updated with API integration
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Package,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Download,
  TrendingUp,
  Loader2
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
  ResponsiveContainer
} from 'recharts';
import reportApi, { InventoryStatusResponse, InventoryTransactionsResponse, LowStockAlertsResponse } from '@/lib/report-api';
import { ReportParams } from '@/lib/report-api';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { useBranches } from '@/hooks/use-branches';

export default function InventoryReportsPage() {
  const [reportType, setReportType] = useState<'status' | 'transactions' | 'alerts'>('status');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ startDate?: string; endDate?: string }>({});
  // Add state management instead:
  const [inventoryStatus, setInventoryStatus] = useState<InventoryStatusResponse | null>(null);
  const [inventoryStatusLoading, setInventoryStatusLoading] = useState<boolean>(false);
  const [inventoryStatusError, setInventoryStatusError] = useState<string | null>(null);

  const [lowStockAlerts, setLowStockAlerts] = useState<LowStockAlertsResponse | null>(null);
  const [lowStockAlertsLoading, setLowStockAlertsLoading] = useState<boolean>(false);
  const [lowStockAlertsError, setLowStockAlertsError] = useState<string | null>(null);

  const [inventoryTransactions, setInventoryTransactions] = useState<InventoryTransactionsResponse | null>(null);
  const [inventoryTransactionsLoading, setInventoryTransactionsLoading] = useState<boolean>(false);
  const [inventoryTransactionsError, setInventoryTransactionsError] = useState<string | null>(null);

  // Get dynamic branches
  const { branches, loading: branchesLoading } = useBranches();
  // Build params for API calls
  const params: ReportParams = {
    branchName: branchFilter === 'all' ? undefined : branchFilter,
    ...dateRange
  };

  useEffect(() => {
    if (reportType === 'status') {
      setInventoryStatusLoading(true);
      setInventoryStatusError(null);

      reportApi.getInventoryStatus(params)
        .then((response) => {
          if (response.data.success) {
            setInventoryStatus(response.data.data);
          } else {
            setInventoryStatusError(response.data.message || 'Failed to fetch inventory status');
          }
        })
        .catch((error) => {
          setInventoryStatusError(error.message || 'Failed to fetch inventory status');
        })
        .finally(() => {
          setInventoryStatusLoading(false);
        });
    }
  }, [reportType, branchFilter, dateRange]);

  useEffect(() => {
    if (reportType === 'alerts') {
      setLowStockAlertsLoading(true);
      setLowStockAlertsError(null);
      reportApi.getLowStockAlerts(params)
        .then((response) => {
          if (response.data.success) {
            setLowStockAlerts(response.data.data);
          } else {
            setLowStockAlertsError(response.data.message || 'Failed to fetch low stock alerts');
          }
        })
        .catch((error) => {
          setLowStockAlertsError(error.message || 'Failed to fetch low stock alerts');
        })
        .finally(() => {
          setLowStockAlertsLoading(false);
        })
    }
  }, [reportType, branchFilter, dateRange])

  useEffect(() => {
    if (reportType === 'transactions') {
      setInventoryTransactionsLoading(true);
      setInventoryTransactionsError(null);
      reportApi.getInventoryTransactions(params)
        .then((response) => {
          if (response.data.success) {
            setInventoryTransactions(response.data.data);
          } else {
            setInventoryTransactionsError(response.data.message || 'Failed to fetch inventory transactions');
          }
        })
        .catch((error) => {
          setInventoryTransactionsError(error.message || 'Failed to fetch inventory transactions');
        })
        .finally(() => {
          setInventoryTransactionsLoading(false);
        })
    }
  }, [reportType, branchFilter, dateRange])

  // // Fetch data based on report type
  // const inventoryStatus = reportApi.getInventoryStatus(
  //   reportType === 'status' ? params : undefined
  // );
  // const lowStockAlerts = reportApi.getLowStockAlerts(
  //   reportType === 'alerts' ? params : undefined
  // );
  // const inventoryTransactions = reportApi.getInventoryTransactions(
  //   reportType === 'transactions' ? params : undefined
  // );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'IN_STOCK':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'LOW_STOCK':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'OUT_OF_STOCK':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Package className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'IN_STOCK':
        return 'bg-green-100 text-green-800';
      case 'LOW_STOCK':
        return 'bg-yellow-100 text-yellow-800';
      case 'OUT_OF_STOCK':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
        onClick={() => window.location.reload()}
      >
        Retry
      </Button>
    </div>
  );

  // Handle export functionality
  const handleExport = async () => {
    try {
      // You can implement export functionality here
      // This could generate a CSV or PDF report
      console.log('Exporting report...');
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory Reports</h1>
          <p className="text-muted-foreground mt-2">
            Stock levels, transactions, and inventory health monitoring
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
                  <SelectItem value="status">Inventory Status</SelectItem>
                  <SelectItem value="transactions">Transactions</SelectItem>
                  <SelectItem value="alerts">Low Stock Alerts</SelectItem>
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
          <div className="w-full sm:flex-1">
            <label className="text-sm font-medium mb-2 block">Date Range</label>
            <DateRangePicker
              date={dateRange.startDate && dateRange.endDate ? { from: new Date(dateRange.startDate), to: new Date(dateRange.endDate) } : undefined}
              onDateChange={(dateRange) => setDateRange({ startDate: dateRange.from?.toISOString().split('T')[0], endDate: dateRange.to?.toISOString().split('T')[0] })}
              placeholder='Select Date Range'
              className='w-full'
            />
          </div>
        </CardContent>
      </Card>

      {/* Inventory Status Report */}
      {reportType === 'status' && (
        <>
          {inventoryStatusLoading && <LoadingState />}
          {inventoryStatusError && <ErrorState message={inventoryStatusError} />}
          {inventoryStatus && (
            <>
              {/* Inventory Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Items</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{inventoryStatus.metrics.totalItems}</div>
                    <p className="text-xs text-muted-foreground">
                      Total inventory items
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">In Stock</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {inventoryStatus.metrics.inStock}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Items available
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">
                      {inventoryStatus.metrics.lowStock}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Needs restocking
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
                    <XCircle className="h-4 w-4 text-red-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {inventoryStatus.metrics.outOfStock}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Urgent restock needed
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Inventory by Category */}
              <Card>
                <CardHeader>
                  <CardTitle>Inventory by Category</CardTitle>
                  <CardDescription>Distribution of items across categories</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={inventoryStatus.metrics.itemsByCategory}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="_count.items" fill="#8884d8" name="Items Count" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Inventory Items Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Inventory Items</CardTitle>
                  <CardDescription>Detailed inventory status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3">Item</th>
                          <th className="text-left py-3">Category</th>
                          <th className="text-left py-3">Quantity</th>
                          <th className="text-left py-3">Min Stock</th>
                          <th className="text-left py-3">Status</th>
                          <th className="text-right py-3">Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inventoryStatus.inventory.map((item) => (
                          <tr key={item.id} className="border-b">
                            <td className="py-3 font-medium">{item.name}</td>
                            <td className="py-3">{item.category.name}</td>
                            <td className="py-3">
                              {item.quantity} {item.unit}
                            </td>
                            <td className="py-3">
                              {item.minStock} {item.unit}
                            </td>
                            <td className="py-3">
                              <Badge variant="outline" className={getStatusColor(item.status)}>
                                <span className="flex items-center gap-1">
                                  {getStatusIcon(item.status)}
                                  {item.status.replace('_', ' ')}
                                </span>
                              </Badge>
                            </td>
                            <td className="py-3 text-right">
                              £{(item.quantity * item.cost).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}

      {/* Low Stock Alerts */}
      {reportType === 'alerts' && (
        <div className="space-y-6">
          {lowStockAlertsLoading && <LoadingState />}
          {lowStockAlertsError && <ErrorState message={lowStockAlertsError} />}
          {lowStockAlerts && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
                    <XCircle className="h-4 w-4 text-red-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">{lowStockAlerts.criticalCount}</div>
                    <p className="text-xs text-muted-foreground">Out of stock items</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">High Priority</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">{lowStockAlerts.highCount}</div>
                    <p className="text-xs text-muted-foreground">Low stock items</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{lowStockAlerts.totalAlerts}</div>
                    <p className="text-xs text-muted-foreground">Items needing attention</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    Low Stock Alerts
                  </CardTitle>
                  <CardDescription>
                    Items that need immediate attention
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {lowStockAlerts.alerts.map((alert) => (
                      <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          {getStatusIcon(alert.status)}
                          <div>
                            <div className="font-medium">{alert.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {alert.category.name} • Min: {alert.minStock} {alert.unit}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className={`text-sm font-medium ${alert.urgency === 'CRITICAL' ? 'text-red-600' :
                              alert.urgency === 'HIGH' ? 'text-yellow-600' : 'text-orange-600'
                              }`}>
                              {alert.quantity} {alert.unit} remaining
                            </div>
                            <Badge variant={
                              alert.urgency === 'CRITICAL' ? 'destructive' :
                                alert.urgency === 'HIGH' ? 'secondary' : 'outline'
                            }>
                              {alert.urgency}
                            </Badge>
                          </div>
                          <Button variant="outline" size="sm">
                            Restock
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {/* Transactions Report */}
      {reportType === 'transactions' && (
        <div className="space-y-6">
          {inventoryTransactionsLoading && <LoadingState />}
          {inventoryTransactionsError && <ErrorState message={inventoryTransactionsError} />}
          {inventoryTransactions && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{inventoryTransactions.totalTransactions}</div>
                    <p className="text-xs text-muted-foreground">
                      This period
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Incoming</CardTitle>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      {inventoryTransactions.summary.find(s => s.type === 'INCOMING')?._count._all || 0}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {inventoryTransactions.summary.find(s => s.type === 'INCOMING')?._sum.quantity || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">Units received</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Outgoing</CardTitle>
                    <Badge variant="destructive">
                      {inventoryTransactions.summary.find(s => s.type === 'OUTGOING')?._count._all || 0}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {inventoryTransactions.summary.find(s => s.type === 'OUTGOING')?._sum.quantity || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">Units used</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Transactions</CardTitle>
                  <CardDescription>Latest inventory movements</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3">Date</th>
                          <th className="text-left py-3">Item</th>
                          <th className="text-left py-3">Type</th>
                          <th className="text-left py-3">Quantity</th>
                          <th className="text-left py-3">Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inventoryTransactions.transactions.map((transaction) => (
                          <tr key={transaction.id} className="border-b">
                            <td className="py-3">
                              {new Date(transaction.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-3 font-medium">
                              {transaction.inventoryItem.name}
                            </td>
                            <td className="py-3">
                              <Badge variant={
                                transaction.type === 'INCOMING' ? 'default' : 'destructive'
                              }>
                                {transaction.type}
                              </Badge>
                            </td>
                            <td className="py-3">{transaction.quantity}</td>
                            <td className="py-3">{transaction.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}
    </div>
  );
}