'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { CalendarIcon, Download, RefreshCw, BarChart3, TrendingUp, Clock, Users } from 'lucide-react';
import { shiftApi } from '@/lib/shift-api';
import { cn } from '@/lib/utils';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface ShiftReportData {
  totalShifts: number;
  totalHours: number;
  averageHoursPerShift: number;
  activeShifts: number;
  shifts: any[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function ShiftReportsPage() {
  const [reportData, setReportData] = useState<ShiftReportData>({
    totalShifts: 0,
    totalHours: 0,
    averageHoursPerShift: 0,
    activeShifts: 0,
    shifts: []
  });

  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: subDays(new Date(), 7),
    to: new Date()
  });
  

  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const loadReport = async () => {
    try {
      setLoading(true);

      const params: any = {};
      if (branchFilter !== 'all') {
        params.branchName = branchFilter;
      }
      if (dateRange.from) {
        params.from = startOfDay(dateRange.from).toISOString();
      }
      if (dateRange.to) {
        params.to = endOfDay(dateRange.to).toISOString();
      }

      const response = await shiftApi.getShiftStats(params);

      if (response.data?.data) {
        setReportData(response.data.data);
      }
    } catch (error) {
      console.error('Error loading shift report:', error);
    } finally {
      setLoading(false);
    }

  };

  const exportReport = async () => {
    try {
      setGenerating(true);
      // In a real implementation, this would generate and download a CSV/PDF
      console.log('Exporting report...', { dateRange, branchFilter, reportData });
      // Simulate export delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert('Report exported successfully!');
    } catch (error) {
      console.error('Error exporting report:', error);
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [dateRange, branchFilter]);

  // Prepare chart data
  const dailyHoursData = reportData.shifts.reduce((acc: any[], shift) => {
    const date = format(new Date(shift.startTime), 'MMM dd');
    const existing = acc.find(item => item.date === date);
    if (existing) {
      existing.hours += shift.totalHours || 0;
      existing.shifts += 1;
    } else {
      acc.push({
        date,
        hours: shift.totalHours || 0,
        shifts: 1
      });
    }
    return acc;
  }, []);

  const hourlyDistribution = reportData.shifts.reduce((acc: any[], shift) => {
    const hour = new Date(shift.startTime).getHours();
    const existing = acc.find(item => item.hour === hour);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({
        hour: `${hour}:00`,
        count: 1
      });
    }
    return acc;
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Generating shift report...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Shift Reports & Analytics</h1>
            <p className="text-gray-600 mt-1">Comprehensive analysis of team shift patterns and productivity</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={loadReport}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={exportReport} disabled={generating}>
              <Download className="h-4 w-4 mr-2" />
              {generating ? 'Generating...' : 'Export Report'}
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Date From</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateRange.from && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.from ? format(dateRange.from, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateRange.from}
                      onSelect={(date) => setDateRange(prev => ({ ...prev, from: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Date To</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateRange.to && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.to ? format(dateRange.to, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateRange.to}
                      onSelect={(date) => setDateRange(prev => ({ ...prev, to: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Branch</Label>
                <Select value={branchFilter} onValueChange={setBranchFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Branches</SelectItem>
                    <SelectItem value="main">Main Branch</SelectItem>
                    <SelectItem value="downtown">Downtown</SelectItem>
                    <SelectItem value="mall">Shopping Mall</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Shifts</p>
                  <p className="text-3xl font-bold text-gray-900">{reportData.totalShifts}</p>
                  <p className="text-sm text-green-600 mt-1 flex items-center">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    All completed
                  </p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Hours</p>
                  <p className="text-3xl font-bold text-gray-900">{reportData.totalHours.toFixed(1)}h</p>
                  <p className="text-sm text-purple-600 mt-1">Worked time</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <Clock className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg. Shift Length</p>
                  <p className="text-3xl font-bold text-gray-900">{reportData.averageHoursPerShift.toFixed(1)}h</p>
                  <p className="text-sm text-indigo-600 mt-1">Per shift</p>
                </div>
                <div className="p-3 bg-indigo-50 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-indigo-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Now</p>
                  <p className="text-3xl font-bold text-gray-900">{reportData.activeShifts}</p>
                  <p className="text-sm text-green-600 mt-1">Currently working</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Hours Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Hours Worked</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyHoursData}>
                    <defs>
                      <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="hours"
                      stroke="#4f46e5"
                      fillOpacity={1}
                      fill="url(#colorHours)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Shift Count by Hour */}
          <Card>
            <CardHeader>
              <CardTitle>Shifts by Start Hour</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hourlyDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Shift Duration Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Shift Duration Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Short (< 4h)', value: reportData.shifts.filter(s => (s.totalHours || 0) < 4).length },
                        { name: 'Medium (4-8h)', value: reportData.shifts.filter(s => (s.totalHours || 0) >= 4 && (s.totalHours || 0) < 8).length },
                        { name: 'Long (8-10h)', value: reportData.shifts.filter(s => (s.totalHours || 0) >= 8 && (s.totalHours || 0) < 10).length },
                        { name: 'Extended (> 10h)', value: reportData.shifts.filter(s => (s.totalHours || 0) >= 10).length },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[0, 1, 2, 3].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Average Hours Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Average Hours per Day</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyHoursData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="hours"
                      stroke="#f59e0b"
                      strokeWidth={3}
                      dot={{ fill: '#f59e0b', strokeWidth: 2, r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Data Table */}
        <Card>
          <CardHeader>
            <CardTitle>Shift Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Start Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      End Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Branch
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportData.shifts.slice(0, 20).map((shift) => (
                    <tr key={shift.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {shift.user?.name || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {shift.user?.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(shift.startTime), 'MMM dd, HH:mm')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {shift.endTime ? format(new Date(shift.endTime), 'MMM dd, HH:mm') : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {shift.totalHours ? `${shift.totalHours.toFixed(1)}h` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {shift.branchName || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
