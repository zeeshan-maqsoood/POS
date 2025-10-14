// app/dashboard/reports/staff/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  TrendingUp, 
  Star,
  Download,
  Award,
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
  ResponsiveContainer 
} from 'recharts';
import { reportApi, ReportParams } from '@/lib/report-api';

interface StaffPerformance {
  user: {
    id: string;
    name: string;
    email: string;
    role: 'MANAGER' | 'CASHIER' | 'WAITER' | 'KITCHEN_STAFF';
    branch: string;
  };
  totalOrders: number;
  totalRevenue: number;
  completedOrders: number;
  completionRate: number;
  avgOrderValue: number;
}

interface StaffActivity {
  user: {
    id: string;
    name: string;
    email: string;
    role: 'MANAGER' | 'CASHIER' | 'WAITER' | 'KITCHEN_STAFF';
    branch: string;
  };
  totalOrders: number;
  recentOrders: Array<{
    id: string;
    status: string;
    total: number;
    createdAt: string;
  }>;
  totalRevenue: number;
  lastActivity: string | null;
  ordersToday: number;
}

export default function StaffReportsPage() {
  const [reportType, setReportType] = useState<'performance' | 'activity'>('performance');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ startDate?: string; endDate?: string }>({});
  
  // State for staff performance data
  const [staffPerformance, setStaffPerformance] = useState<{
    staff: StaffPerformance[];
    totalStaff: number;
    overallPerformance: {
      totalOrders: number;
      totalRevenue: number;
      avgCompletionRate: number;
    };
  } | null>(null);
  
  // State for staff activity data
  const [staffActivity, setStaffActivity] = useState<{
    staff: StaffActivity[];
    activeStaff: number;
    totalActivity: number;
  } | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Build API params
  const buildParams = (): ReportParams => {
    const params: ReportParams = {
      branchName: branchFilter === 'all' ? undefined : branchFilter,
      ...dateRange
    };
    return params;
  };

  // Fetch staff performance data
  const fetchStaffPerformance = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await reportApi.getStaffPerformance(buildParams());
      if (response.data.success) {
        setStaffPerformance(response.data.data);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError('Failed to fetch staff performance data');
      console.error('Error fetching staff performance:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch staff activity data
  const fetchStaffActivity = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await reportApi.getStaffActivity(buildParams());
      if (response.data.success) {
        setStaffActivity(response.data.data);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError('Failed to fetch staff activity data');
      console.error('Error fetching staff activity:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when report type or filters change
  useEffect(() => {
    if (reportType === 'performance') {
      fetchStaffPerformance();
    } else {
      fetchStaffActivity();
    }
  }, [reportType, branchFilter, dateRange]);

  // Handle export functionality
  const handleExport = async () => {
    try {
      // You can implement export functionality here
      // This could generate a CSV or PDF report
      console.log('Exporting staff report...');
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
            fetchStaffPerformance();
          } else {
            fetchStaffActivity();
          }
        }}
      >
        Retry
      </Button>
    </div>
  );

  // Get role badge color
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'MANAGER':
        return 'bg-blue-100 text-blue-800';
      case 'CASHIER':
        return 'bg-green-100 text-green-800';
      case 'WAITER':
        return 'bg-purple-100 text-purple-800';
      case 'KITCHEN_STAFF':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Format role for display
  const formatRole = (role: string) => {
    return role.toLowerCase().replace('_', ' ');
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Staff Performance Reports</h1>
          <p className="text-muted-foreground mt-2">
            Staff activity and performance metrics
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
                  <SelectItem value="performance">Staff Performance</SelectItem>
                  <SelectItem value="activity">Staff Activity</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-48">
              <label className="text-sm font-medium mb-2 block">Branch</label>
              <Select value={branchFilter} onValueChange={setBranchFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Branches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  <SelectItem value="Bradford">Bradford</SelectItem>
                  <SelectItem value="Leeds">Leeds</SelectItem>
                  <SelectItem value="Darley St Market">Darley St Market</SelectItem>
                  <SelectItem value="Helifax">Helifax</SelectItem>
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

      {/* Staff Performance Report */}
      {!loading && !error && reportType === 'performance' && staffPerformance && (
        <div className="space-y-6">
          {/* Overall Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{staffPerformance.totalStaff}</div>
                <p className="text-xs text-muted-foreground">
                  Active staff members
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">£{staffPerformance.overallPerformance.totalRevenue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  Generated by staff
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Completion</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{staffPerformance.overallPerformance.avgCompletionRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  Order completion rate
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Staff Performance Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {staffPerformance.staff.map((staff, index) => (
              <Card key={staff.user.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      {staff.user.name}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {index === 0 && staffPerformance.staff.length > 1 && (
                        <Badge variant="default" className="bg-yellow-100 text-yellow-800">
                          <Award className="h-3 w-3 mr-1" />
                          Top Performer
                        </Badge>
                      )}
                      <Badge variant="outline" className={getRoleBadgeColor(staff.user.role)}>
                        {formatRole(staff.user.role)}
                      </Badge>
                    </div>
                  </div>
                  <CardDescription>
                    {staff.user.branch} • {staff.user.email}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-2xl font-bold">£{staff.totalRevenue.toFixed(2)}</div>
                        <div className="text-sm text-muted-foreground">Revenue</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{staff.totalOrders}</div>
                        <div className="text-sm text-muted-foreground">Orders</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="font-medium">£{staff.avgOrderValue.toFixed(2)}</div>
                        <div className="text-muted-foreground">Avg Order</div>
                      </div>
                      <div>
                        <Badge variant={
                          staff.completionRate > 90 ? 'default' : 
                          staff.completionRate > 80 ? 'secondary' : 'destructive'
                        }>
                          {staff.completionRate.toFixed(1)}% Complete
                        </Badge>
                      </div>
                    </div>

                    {/* Additional Metrics */}
                    <div className="grid grid-cols-2 gap-4 text-sm border-t pt-3">
                      <div>
                        <div className="font-medium">{staff.completedOrders}</div>
                        <div className="text-muted-foreground">Completed</div>
                      </div>
                      <div>
                        <div className="font-medium">
                          {staff.totalOrders > 0 ? 
                            ((staff.completedOrders / staff.totalOrders) * 100).toFixed(1) : 0
                          }%
                        </div>
                        <div className="text-muted-foreground">Success Rate</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Staff Performance Comparison</CardTitle>
              <CardDescription>Revenue and orders by staff member</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={staffPerformance.staff}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="user.name" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number, name: string) => {
                      if (name === 'totalRevenue') {
                        return [`£${value.toFixed(2)}`, 'Revenue'];
                      }
                      return [value, 'Orders'];
                    }}
                  />
                  <Legend />
                  <Bar dataKey="totalRevenue" fill="#8884d8" name="Total Revenue" />
                  <Bar dataKey="totalOrders" fill="#82ca9d" name="Total Orders" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Completion Rate Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Completion Rate Comparison</CardTitle>
              <CardDescription>Order completion rates by staff member</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={staffPerformance.staff}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="user.name" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [`${value.toFixed(1)}%`, 'Completion Rate']}
                  />
                  <Legend />
                  <Bar dataKey="completionRate" fill="#ffc658" name="Completion Rate" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Performance Summary Table */}
          <Card>
            <CardHeader>
              <CardTitle>Staff Performance Summary</CardTitle>
              <CardDescription>Detailed metrics for each staff member</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3">Staff Member</th>
                      <th className="text-left py-3">Role</th>
                      <th className="text-left py-3">Branch</th>
                      <th className="text-left py-3">Orders</th>
                      <th className="text-left py-3">Revenue</th>
                      <th className="text-left py-3">Avg Order</th>
                      <th className="text-left py-3">Completion Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffPerformance.staff.map((staff) => (
                      <tr key={staff.user.id} className="border-b">
                        <td className="py-3 font-medium">{staff.user.name}</td>
                        <td className="py-3">
                          <Badge variant="outline" className={getRoleBadgeColor(staff.user.role)}>
                            {formatRole(staff.user.role)}
                          </Badge>
                        </td>
                        <td className="py-3">{staff.user.branch}</td>
                        <td className="py-3">{staff.totalOrders}</td>
                        <td className="py-3">£{staff.totalRevenue.toFixed(2)}</td>
                        <td className="py-3">£{staff.avgOrderValue.toFixed(2)}</td>
                        <td className="py-3">
                          <Badge variant={
                            staff.completionRate > 90 ? 'default' : 
                            staff.completionRate > 80 ? 'secondary' : 'destructive'
                          }>
                            {staff.completionRate.toFixed(1)}%
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Staff Activity Report */}
      {!loading && !error && reportType === 'activity' && staffActivity && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Staff</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{staffActivity.activeStaff}</div>
                <p className="text-xs text-muted-foreground">
                  Staff with recent activity
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Activity</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{staffActivity.totalActivity}</div>
                <p className="text-xs text-muted-foreground">
                  Total orders handled
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's Orders</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {staffActivity.staff.reduce((sum, staff) => sum + staff.ordersToday, 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Orders processed today
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Staff Activity</CardTitle>
              <CardDescription>Recent staff activity and performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {staffActivity.staff.map((staff) => (
                  <div key={staff.user.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="font-medium text-lg">{staff.user.name}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                          <Badge variant="outline" className={getRoleBadgeColor(staff.user.role)}>
                            {formatRole(staff.user.role)}
                          </Badge>
                          <span>•</span>
                          <span>{staff.user.branch}</span>
                          <span>•</span>
                          <span>{staff.user.email}</span>
                        </div>
                      </div>
                      <Badge variant="default">
                        {staff.ordersToday} orders today
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <div className="text-2xl font-bold">{staff.totalOrders}</div>
                        <div className="text-sm text-muted-foreground">Total Orders</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">£{staff.totalRevenue.toFixed(2)}</div>
                        <div className="text-sm text-muted-foreground">Total Revenue</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">
                          {staff.lastActivity ? 
                            new Date(staff.lastActivity).toLocaleDateString() : 'No activity'
                          }
                        </div>
                        <div className="text-sm text-muted-foreground">Last Activity</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">
                          £{(staff.totalRevenue / staff.totalOrders || 0).toFixed(2)}
                        </div>
                        <div className="text-sm text-muted-foreground">Avg Order</div>
                      </div>
                    </div>

                    {staff.recentOrders && staff.recentOrders.length > 0 && (
                      <div>
                        <div className="font-medium mb-2">Recent Orders</div>
                        <div className="space-y-2">
                          {staff.recentOrders.map((order) => (
                            <div key={order.id} className="flex justify-between items-center text-sm p-2 bg-muted/50 rounded">
                              <span className="font-medium">Order #{order.id.slice(-6)}</span>
                              <div className="flex items-center gap-4">
                                <Badge variant={
                                  order.status === 'COMPLETED' ? 'default' : 
                                  order.status === 'PENDING' ? 'secondary' : 'destructive'
                                }>
                                  {order.status.toLowerCase()}
                                </Badge>
                                <span className="font-medium">£{order.total.toFixed(2)}</span>
                                <span className="text-muted-foreground">
                                  {new Date(order.createdAt).toLocaleTimeString()}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {(!staff.recentOrders || staff.recentOrders.length === 0) && (
                      <div className="text-center py-4 text-muted-foreground">
                        No recent orders found
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Activity Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Summary</CardTitle>
              <CardDescription>Staff activity overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {staffActivity.staff.map((staff) => (
                  <div key={staff.user.id} className="text-center p-4 border rounded-lg">
                    <div className="font-medium">{staff.user.name}</div>
                    <div className="text-sm text-muted-foreground mb-2">
                      {formatRole(staff.user.role)}
                    </div>
                    <div className="text-2xl font-bold text-primary">{staff.ordersToday}</div>
                    <div className="text-sm text-muted-foreground">Orders Today</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && (
        <>
          {reportType === 'performance' && (!staffPerformance || staffPerformance.staff.length === 0) && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No staff performance data available for the selected filters.</p>
                </div>
              </CardContent>
            </Card>
          )}
          {reportType === 'activity' && (!staffActivity || staffActivity.staff.length === 0) && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12 text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No staff activity data available for the selected filters.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}