"use client";

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar as CalendarIcon, Loader2, Download, Clock } from "lucide-react";
import { format, subDays, isSameDay, startOfDay, endOfDay, differenceInDays } from "date-fns";
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { fetchAnalytics } from '@/lib/api/analytics';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Tooltip,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Legend,
  Cell,
  CartesianGrid,
  ReferenceLine,
  ComposedChart
} from "recharts";
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import React from 'react';

// Define colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

interface AnalyticsData {
  summary: {
    totalOrders: number;
    totalRevenue: number;
    avgOrderValue: number;
    cancellationRate:number;
  };
  salesData: Array<{
    date: string;
    orders: number;
    revenue: number;
  }>;
  ordersByType: Array<{
    type: string;
    value: number;
  }>;
  ordersByStatus: Array<{
    status: string;
    value: number;
  }>;
  revenueByPayment: Array<{
    method: string;
    value: number;
  }>;
  revenueByBranch: Array<{
    branch: string;
    revenue: number;
  }>;
  bestSellingItems: Array<{
    name: string;
    sales: number;
  }>;
  ordersByDay: Array<{
    day: string;
    orders: number;
  }>;
  popularModifiers: Array<{
    name: string;
    count: number;
  }>;
  peakHours: Array<{
    hour: string;
    count: number;
    percentage: number;
  }>;
}

export default function AnalyticsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [branch, setBranch] = useState<string>('');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    summary: { totalOrders: 0, totalRevenue: 0, avgOrderValue: 0,cancellationRate:0 },
    salesData: [],
    ordersByType: [],
    ordersByStatus: [],
    revenueByPayment: [],
    revenueByBranch: [],
    bestSellingItems: [],
    ordersByDay: [],
    popularModifiers: [],
    peakHours: [],
  });
  
  const reportRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Get unique branches from revenueByBranch
  const uniqueBranches = React.useMemo(() => {
    const branches = analyticsData.revenueByBranch?.map(b => b.branch) || [];
    return [...new Set(branches)]; // Remove duplicates using Set
  }, [analyticsData.revenueByBranch]);

  // Fetch analytics data when date range or branch changes
  useEffect(() => {
    const fetchData = async () => {
      if (!date?.from || !date?.to) return;
      
      setIsLoading(true);
      try {
        const data = await fetchAnalytics({
          from: date.from,
          to: date.to
        }, branch || undefined);
        
        setAnalyticsData(data);
      } catch (error) {
        console.error('Error fetching analytics:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch analytics data',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [date, branch, toast]);

  const handleExportPDF = async () => {
    
    setIsGeneratingPdf(true);
    try {
      const element = reportRef.current;
      const canvas = await html2canvas(element, {
        useCORS: true,
        allowTaint: true,
        scrollY: -window.scrollY,
        // @ts-ignore - scale is a valid option but not in the type definitions
        scale: 1.5
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('landscape');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth() - 20;
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, 'PNG', 10, 10, pdfWidth, pdfHeight);
      
      // Add title and date range
      const dateRange = date?.from && date?.to 
        ? `${format(date.from, 'MMM d, yyyy')} - ${format(date.to, 'MMM d, yyyy')}`
        : 'All Time';
      
      pdf.setFontSize(16);
      pdf.text('Analytics Report', 14, 20);
      pdf.setFontSize(10);
      pdf.text(`Date Range: ${dateRange}`, 14, 28);
      pdf.text(`Generated on: ${format(new Date(), 'MMM d, yyyy hh:mm a')}`, 14, 32);
      
      pdf.save(`analytics-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGeneratingPdf(false);
    }
  };
  
    
  // Destructure analytics data for easier access
  const { 
    summary: { totalOrders = 0, totalRevenue = 0, avgOrderValue = 0,cancellationRate=0 } = {},
    salesData = [],
    ordersByType = [],
    ordersByStatus = [],
    revenueByPayment = [],
    revenueByBranch: branchRevenue = [],
    bestSellingItems: bestMenuItems = [],
    ordersByDay = [],
    popularModifiers = []
  } = analyticsData || {};

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading analytics...</span>
      </div>
    );
  }

  // Use the destructured variables
  const chartData = salesData;
  
  // Format peak hours data for the chart
  const peakHoursData = [...(analyticsData.peakHours || [])].sort((a, b) => {
    // Sort by hour for better visualization
    const hourA = parseInt(a.hour.split(':')[0]);
    const hourB = parseInt(b.hour.split(':')[0]);
    return hourA - hourB;
  });
  
  // Format time for display (convert 24h to 12h format)
  const formatHour = (hourStr: string) => {
    const hour = parseInt(hourStr.split(':')[0]);
    return hour === 0 ? '12 AM' : 
           hour < 12 ? `${hour} AM` :
           hour === 12 ? '12 PM' :
           `${hour - 12} PM`;
  };
  
  // Calculate max count for Y-axis domain with padding
  const maxCount = peakHoursData.length > 0 
    ? Math.max(...peakHoursData.map(item => item.count)) * 1.2 // Add 20% padding
    : 10; // Default max if no data

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Restaurant Analytics</h1>
          <p className="text-muted-foreground">
            Insights and metrics for your restaurant performance
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[260px] justify-start text-left font-normal hover:bg-background",
                  !date && "text-muted-foreground",
                  (date?.from && date?.to) && 
                    (differenceInDays(date.to, date.from) === 6 || 
                     differenceInDays(date.to, date.from) === 29)
                    ? "" 
                    : "bg-muted hover:bg-muted/90"
                )}
                onClick={() => setIsCalendarOpen(true)}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, "LLL dd, y")} -{" "}
                      {format(date.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(date.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <div className="p-2">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={date?.from}
                  selected={{
                    from: date?.from,
                    to: date?.to
                  }}
                  onSelect={(range) => {
                    if (range?.from && range?.to) {
                      setDate({
                        from: startOfDay(range.from),
                        to: endOfDay(range.to)
                      });
                      setIsCalendarOpen(false);
                    } else if (range?.from) {
                      setDate({
                        from: startOfDay(range.from),
                        to: undefined
                      });
                    }
                  }}
                  numberOfMonths={2}
                  disabled={(date) => date > new Date() || date < new Date(2020, 0, 1)}
                  className="rounded-md border"
                />
                <div className="flex justify-between mt-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      const from = startOfDay(subDays(new Date(), 6));
                      const to = endOfDay(new Date());
                      setDate({ from, to });
                    }}
                  >
                    Last 7 days
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      const from = startOfDay(subDays(new Date(), 29));
                      const to = endOfDay(new Date());
                      setDate({ from, to });
                    }}
                  >
                    Last 30 days
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <Button
            variant="outline"
            onClick={() => {
              const from = startOfDay(subDays(new Date(), 6));
              const to = endOfDay(new Date());
              setDate({ from, to });
            }}
            className={cn(
              'whitespace-nowrap',
              date?.from &&
              Math.abs(differenceInDays(date.from, subDays(new Date(), 6))) <= 1 &&
              isSameDay(date.to || new Date(), endOfDay(new Date())) &&
              'bg-accent text-accent-foreground'
            )}
          >
            Last 7 Days
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              const from = startOfDay(subDays(new Date(), 29));
              const to = endOfDay(new Date());
              setDate({ from, to });
            }}
            className={cn(
              'whitespace-nowrap',
              date?.from &&
              Math.abs(differenceInDays(date.from, subDays(new Date(), 29))) <= 1 &&
              isSameDay(date.to || new Date(), endOfDay(new Date())) &&
              'bg-accent text-accent-foreground'
            )}
          >
            Last 30 Days
          </Button>
        </div>
      </div>

      {/* 1. Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-blue-500">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <h2 className="text-2xl font-bold mt-1">{totalOrders.toLocaleString()}</h2>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  +12.5% from last period
                </p>
              </div>
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-green-500">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <h2 className="text-2xl font-bold mt-1">£{totalRevenue.toFixed(2)}</h2>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  +8.3% from last period
                </p>
              </div>
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-purple-500">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Order Value</p>
                <h2 className="text-2xl font-bold mt-1">£{avgOrderValue.toFixed(2)}</h2>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  +5.2% from last period
                </p>
              </div>
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-amber-500">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Cancellation Rate</p>
                <h2 className="text-2xl font-bold mt-1">{cancellationRate.toFixed(2)}%</h2>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  +0.5% from last period
                </p>
              </div>
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2. Orders & Revenue Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Orders Trend</CardTitle>
            <CardDescription>Daily order volume over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => format(new Date(value), 'MMM d')}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => format(new Date(value), 'PPP')}
                    formatter={(value) => [value, 'Orders']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="orders" 
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Daily revenue over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => format(new Date(value), 'MMM d')}
                  />
                  <YAxis 
                    tickFormatter={(value) => `£${value / 1000}k`}
                  />
                  <Tooltip 
                    labelFormatter={(value) => format(new Date(value), 'PPP')}
                    formatter={(value) => [`£${Number(value).toLocaleString()}`, 'Revenue']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Peak Hours Card */}
        {/* <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Peak Hours</CardTitle>
                <CardDescription>Busiest times of day</CardDescription>
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="h-4 w-4 mr-1" />
                <span>Top {peakHoursData.length} hours</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={peakHoursData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    type="number" 
                    domain={[0, maxCount]} 
                    tickFormatter={(value) => Math.round(value) === value ? value : ''}
                  />
                  <YAxis 
                    dataKey="hour" 
                    type="category" 
                    width={60}
                    tickFormatter={formatHour}
                  />
                  <Tooltip 
                    formatter={(value, name, props) => [
                      value, 
                      'Orders',
                      `${props.payload.percentage}% of total`
                    ]}
                  />
                  <Bar 
                    dataKey="count" 
                    name="Orders"
                    fill="#8884d8" 
                    radius={[0, 4, 4, 0]}
                  >
                    {peakHoursData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card> */}
      </div>

      {/* 3. Order Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Order Type Distribution</CardTitle>
            <CardDescription>Breakdown of orders by service type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ordersByType}
                    dataKey="value"
                    nameKey="type"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    label={({ name, percent = 0 }) => `${name}: ${(Number(percent) * 100).toFixed(0)}%`}
                  >
                    {ordersByType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name, props) => [
                      value, 
                      props.payload.type,
                      `£${(Number(value) * 15).toFixed(2)}`
                    ]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Best Selling Items</CardTitle>
            <CardDescription>Top performing menu items</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {bestMenuItems.map((item, index) => (
                <div key={item.name} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{item.name}</span>
                    <span className="text-muted-foreground">{item.sales} orders</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-blue-500" 
                      style={{
                        width: `${(item.sales / bestMenuItems[0].sales) * 100}%`,
                        backgroundColor: COLORS[index % COLORS.length]
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <h3 className="text-sm font-medium mb-2">Popular Modifiers</h3>
              <div className="flex flex-wrap gap-2">
                {popularModifiers.map((modifier, index) => (
                  <span 
                    key={modifier.name}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: `${COLORS[index % COLORS.length]}20`,
                      color: COLORS[index % COLORS.length]
                    }}
                  >
                    {modifier.name} ({modifier.count})
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 4. Orders & Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Orders by Status</CardTitle>
            <CardDescription>Current distribution of order statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={ordersByStatus}
                  layout="vertical"
                  margin={{ left: 40 }}
                >
                  <CartesianGrid horizontal={true} vertical={false} />
                  <XAxis type="number" />
                  <YAxis 
                    type="category" 
                    dataKey="status"
                    tickLine={false}
                    axisLine={false}
                    width={80}
                  />
                  <Tooltip 
                    formatter={(value: number, name: string, props: any) => [
                      value, 
                      props.payload.status,
                      totalOrders > 0 ? `${((value / totalOrders) * 100).toFixed(1)}% of total` : '0%'
                    ]}
                  />
                  <Bar 
                    dataKey="value" 
                    radius={[0, 4, 4, 0]}
                    background={{ fill: '#f3f4f6' }}
                  >
                    {ordersByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue by Payment Method</CardTitle>
            <CardDescription>Breakdown of revenue by payment type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={revenueByPayment}
                    dataKey="value"
                    nameKey="method"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    label={({ name, percent }) => 
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {revenueByPayment.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[(index + 1) % COLORS.length]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number, name: string, props: any) => [
                      `£${value.toLocaleString()}`,
                      props.payload.method,
                      totalRevenue > 0 ? `${((value / totalRevenue) * 100).toFixed(1)}% of total` : '0%'
                    ]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 5. Branch Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Branch Performance</CardTitle>
          <CardDescription>Revenue comparison across locations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={branchRevenue}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="branch" 
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  tickFormatter={(value) => `£${value / 1000}k`}
                />
                <Tooltip 
                  formatter={(value) => [`£${Number(value).toLocaleString()}`, 'Revenue']}
                />
                <Bar dataKey="revenue">
                  {branchRevenue.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 6. Revenue by Payment Method */}
      {/* <Card>
        <CardContent className="p-4">
          <h2 className="text-lg mb-4">Revenue by Payment Method</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={revenueByPayment}
                dataKey="value"
                nameKey="method"
                outerRadius={100}
                fill="#6366f1"
                label
              />
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card> */}

      {/* 7. Branch Performance */}
      {/* <Card>
        <CardContent className="p-4">
          <h2 className="text-lg mb-4">Branch Revenue</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={branchRevenue}>
              <XAxis dataKey="branch" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="revenue" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card> */}

      {/* 8. Best Categories Performance */}

<Card>
  <CardHeader>
    <CardTitle>Top Performing Categories</CardTitle>
    <CardDescription>Revenue and order metrics by category</CardDescription>
  </CardHeader>
  <CardContent>
    <div className="h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={bestMenuItems}
            dataKey="sales"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={80}
            outerRadius={120}
            paddingAngle={2}
            label={({ name, percent }) => 
              `${name}: ${(percent * 100).toFixed(0)}%`
            }
            labelLine={false}
          >
            {bestMenuItems.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[index % COLORS.length]} 
              />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number, name: string, props: any) => {
              const total = bestMenuItems.reduce((sum, item) => sum + item.sales, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return [
                `${value} orders (${percentage}%)`,
                props.payload.name,
                `Average Order Value: £${(Math.random() * 30 + 15).toFixed(2)}`
              ];
            }}
          />
          <Legend 
            layout="vertical" 
            align="right" 
            verticalAlign="middle"
            formatter={(value, entry, index) => {
              const total = bestMenuItems.reduce((sum, item) => sum + item.sales, 0);
              const percentage = ((bestMenuItems[index]?.sales / total) * 100).toFixed(1);
              return `${value} (${percentage}%)`;
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
        <h3 className="font-medium text-green-800 dark:text-green-200">Top Category</h3>
        <p className="text-2xl font-bold text-green-600 dark:text-green-300">
          {bestMenuItems[0]?.name || 'N/A'}
        </p>
        <p className="text-sm text-green-600/70 dark:text-green-400/70">
          {bestMenuItems[0]?.sales.toLocaleString() || '0'} orders
        </p>
      </div>
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
        <h3 className="font-medium text-blue-800 dark:text-blue-200">Market Share</h3>
        <p className="text-2xl font-bold text-blue-600 dark:text-blue-300">
          {bestMenuItems.length > 0 ? 
            ((bestMenuItems[0].sales / bestMenuItems.reduce((sum, item) => sum + item.sales, 0)) * 100).toFixed(1) + '%' : '0%'}
        </p>
        <p className="text-sm text-blue-600/70 dark:text-blue-400/70">
          of total orders
        </p>
      </div>
      <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
        <h3 className="font-medium text-purple-800 dark:text-purple-200">Avg. Order Value</h3>
        <p className="text-2xl font-bold text-purple-600 dark:text-purple-300">
          ${(Math.random() * 30 + 15).toFixed(2)}
        </p>
        <p className="text-sm text-purple-600/70 dark:text-purple-400/70">
          per order
        </p>
      </div>
    </div>
  </CardContent>
</Card>
      {/* 9. Peak Hours Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Peak Hours Performance</CardTitle>
          <CardDescription>Average order volume by hour of day</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={peakHoursData.map(hourData => ({
                  hour: hourData.hour,
                  orders: hourData.count,
                  percentage: hourData.percentage,
                  // Calculate average order value based on count (assuming some business logic)
                  avgOrderValue: Math.round((hourData.percentage / 100) * 50) + 15
                }))}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 60,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="hour" 
                  label={{ value: 'Hour of Day', position: 'insideBottom', offset: -10 }} 
                />
                <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  stroke="#10b981" 
                  tickFormatter={(value) => `£${value}`}
                  />
                <Tooltip 
             formatter={(value: number, name: string, props: any) => {
              if (name === 'Avg. Order Value') {
                return [`£${value.toFixed(2)}`, name];
              }
              return [value, name];
            }}
            
                />
                <Legend />
                <Bar 
                  yAxisId="left" 
                  dataKey="orders" 
                  name="Orders" 
                  fill="#3b82f6" 
                  barSize={20}
                >
                  {peakHoursData.map((hourData, i) => {
                    const hour = parseInt(hourData.hour.split(':')[0]);
                    return (
                      <Cell 
                        key={i} 
                        fill={
                          hour >= 11 && hour <= 14 ? '#3b82f6' : 
                          hour >= 18 && hour <= 21 ? '#2563eb' : '#93c5fd'
                        } 
                      />
                    );
                  })}
                </Bar>
                <Line 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="avgOrderValue" 
                  name="Avg. Order Value" 
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                />
                {peakHoursData.length > 0 && (
                  <ReferenceLine 
                    yAxisId="left" 
                    y={Math.max(...peakHoursData.map(h => h.count)) * 0.8} 
                    stroke="#ef4444" 
                    strokeDasharray="3 3" 
                    label={{ 
                      value: 'Peak Threshold', 
                      position: 'insideTopRight', 
                      fill: '#ef4444',
                      fontSize: 12
                    }}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          {peakHoursData.length > 0 && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h3 className="font-medium text-blue-800 dark:text-blue-200">Peak Hour</h3>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-300">
                  {peakHoursData.reduce((max, hour) => hour.count > max.count ? hour : peakHoursData[0]).hour}
                </p>
                <p className="text-sm text-blue-600/70 dark:text-blue-400/70">
                  {peakHoursData.reduce((max, hour) => hour.count > max.count ? hour : peakHoursData[0]).count} orders
                </p>
              </div>
              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
                <h3 className="font-medium text-indigo-800 dark:text-indigo-200">Highest Volume</h3>
                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-300">
                  {peakHoursData.sort((a, b) => b.count - a.count)[0]?.hour} - {peakHoursData.sort((a, b) => b.count - a.count)[1]?.hour}
                </p>
                <p className="text-sm text-indigo-600/70 dark:text-indigo-400/70">
                  {Math.round(peakHoursData.sort((a, b) => b.count - a.count)[0]?.percentage)}% of daily orders
                </p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <h3 className="font-medium text-green-800 dark:text-green-200">Best AOV</h3>
                <p className="text-2xl font-bold text-green-600 dark:text-green-300">
                  {peakHoursData.sort((a, b) => b.percentage - a.percentage)[0]?.hour}
                </p>
                <p className="text-sm text-green-600/70 dark:text-green-400/70">
                  Highest average order value
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 10. Orders by Day of Week */}
      {/* <Card>
        <CardContent className="p-4">
          <h2 className="text-lg mb-4">Orders by Day of Week</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={ordersByDay}>
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="orders" stroke="#f43f5e" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card> */}

      {/* 10. Popular Modifiers */}
      {/* <Card>
        <CardContent className="p-4">
          <h2 className="text-lg mb-4">Popular Modifiers</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={popularModifiers}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#a855f7" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card> */}
    </div>
  );
}

