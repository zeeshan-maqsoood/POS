'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { CategorySales } from "@/lib/dashbaord-api";
import { formatPounds } from "@/lib/format-currency";
import { dashboardApi } from "@/lib/dashbaord-api";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

const COLORS = [
  '#4F46E5', // indigo-600
  '#10B981', // emerald-500
  '#F59E0B', // amber-500
  '#EF4444', // red-500
  '#8B5CF6', // violet-500
  '#EC4899', // pink-500
  '#14B8A6', // teal-500
  '#F97316', // orange-500
  '#6366F1'  // indigo-500
];

type TimePeriod = 'day' | 'week' | 'month';

interface SalesCategoryPieChartProps {
  initialData?: CategorySales[];
}

export function SalesCategoryPieChart({ initialData }: SalesCategoryPieChartProps) {
  const [period, setPeriod] = useState<TimePeriod>('week');
  const [data, setData] = useState<CategorySales[]>(initialData || []);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await dashboardApi.getStats(period);
        if (response.data.success && response.data.data.salesByCategory) {
          setData(response.data.data.salesByCategory);
        }
      } catch (err) {
        console.error('Error fetching sales by category:', err);
        setError('Failed to load sales data');
      } finally {
        setIsLoading(false);
      }
    };

    if (!initialData || period !== 'week') {
      fetchData();
    }
  }, [period, initialData]);

  if (isLoading && data.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Sales Distribution</CardTitle>
          <Skeleton className="h-9 w-32" />
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <Skeleton className="h-full w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Sales Distribution</CardTitle>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center">
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Sales Distribution</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">No sales data available</p>
        </CardContent>
      </Card>
    );
  }

  // Define a type for the pie chart data
  type PieChartData = {
    name: string;
    value: number;
    categoryId: string;
    categoryName: string;
  };

  // Sort and limit to top 5 categories for better visualization
  const topCategories: PieChartData[] = [...data]
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 5)
    .map(item => ({
      name: item.categoryName,
      value: item.sales,
      categoryId: item.categoryId,
      categoryName: item.categoryName
    }));

  // Calculate "Others" category if there are more than 5 categories
  const othersCategory = data.length > 5
    ? data.slice(5).reduce((acc, curr) => ({
        ...acc,
        value: acc.value + curr.sales,
        orderCount: acc.orderCount + curr.orderCount,
        itemsSold: acc.itemsSold + curr.itemsSold
      }), { 
        name: 'Others',
        value: 0,
        categoryId: 'others',
        categoryName: 'Others',
        orderCount: 0,
        itemsSold: 0
      } as PieChartData & { orderCount: number; itemsSold: number })
    : null;

  const chartData = othersCategory && othersCategory.value > 0
    ? [...topCategories, othersCategory]
    : topCategories;

  return (
    <Card className="h-full flex flex-col shadow-sm" style={{ minHeight: '450px' }}>
      <CardHeader className="pb-0 px-5 pt-4">
        <div className="flex flex-col space-y-1 w-full">
          <CardTitle className="text-base font-semibold">Sales by Category</CardTitle>
          <div className="w-full">
            <Tabs 
              value={period} 
              onValueChange={(value) => setPeriod(value as TimePeriod)}
              className="w-full"
            >
              <TabsList className="h-8 w-full bg-muted p-0.5">
                <TabsTrigger 
                  value="day" 
                  className="text-xs px-2 py-1 h-7 flex-1 text-center"
                >
                  Today
                </TabsTrigger>
                <TabsTrigger 
                  value="week" 
                  className="text-xs px-2 py-1 h-7 flex-1 text-center"
                >
                  Week
                </TabsTrigger>
                <TabsTrigger 
                  value="month" 
                  className="text-xs px-2 py-1 h-7 flex-1 text-center"
                >
                  Month
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-4 pt-2">
        <div className="w-full h-full flex-1 flex flex-col">
          <div className="flex-1 min-h-[280px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%" className="text-sm">
              <RechartsPieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                  labelLine={false}
                  label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                  className="text-xs font-medium"
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]} 
                      stroke="#fff"
                      strokeWidth={1}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number, name: string, props: any) => {
                    const percent = props?.payload?.percent || 0;
                    const categoryName = props?.payload?.payload?.categoryName || name;
                    return [
                      formatPounds(Number(value)),
                      `${categoryName} (${(percent * 100).toFixed(1)}%)`
                    ];
                  }}
                  contentStyle={{
                    borderRadius: '0.5rem',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                    fontSize: '0.75rem',
                    padding: '0.5rem 0.75rem',
                    backgroundColor: 'white'
                  }}
                  itemStyle={{
                    padding: '0.15rem 0',
                    fontSize: '0.75rem'
                  }}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 pt-2 border-t">
            <div className="grid grid-cols-2 gap-2">
              {chartData.map((entry, index) => (
                <div key={`legend-${index}`} className="flex items-center text-xs">
                  <span 
                    className="inline-block w-3 h-3 rounded-sm mr-2 flex-shrink-0"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="truncate">{entry.categoryName}</span>
                  <span className="ml-auto font-medium">
                    {formatPounds(entry.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
