'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { CategorySales } from "@/lib/dashbaord-api";
import { formatEuro } from "@/lib/format-currency";
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

  // Sort and limit to top 5 categories for better visualization
  const topCategories = [...data]
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 5);

  // Calculate "Others" category if there are more than 5 categories
  const othersCategory = data.length > 5
    ? data
        .slice(5)
        .reduce((acc, curr) => ({
          ...acc,
          sales: acc.sales + curr.sales,
          orderCount: acc.orderCount + curr.orderCount,
          itemsSold: acc.itemsSold + curr.itemsSold
        }), { 
          categoryId: 'others',
          categoryName: 'Others',
          sales: 0,
          orderCount: 0,
          itemsSold: 0
        } as CategorySales)
    : null;

  const chartData = othersCategory && othersCategory.sales > 0
    ? [...topCategories, othersCategory]
    : topCategories;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 px-4 pt-3">
        <div className="flex flex-col space-y-2 w-full">
          <CardTitle className="text-sm sm:text-base font-medium">Sales by Category</CardTitle>
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
      <CardContent className="flex-1 flex flex-col min-h-[300px] max-h-[400px] p-4">
        <div className="w-full flex-1 relative">
          <div className="absolute inset-0">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="sales"
                  nameKey="categoryName"
                  label={({ percent, name }: { percent: number; name: string }) => {
                    if (percent < 0.05) return ''; // Don't show labels for very small slices
                    return `${(percent * 100).toFixed(0)}%`;
                  }}
                  labelLine={false}
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
                  formatter={(value: number, name: string, props: any) => [
                    formatEuro(Number(value)),
                    `${name} (${((props.payload.percent || 0) * 100).toFixed(1)}%)`
                  ]}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.375rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                  }}
                />
                <Legend 
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                  wrapperStyle={{
                    paddingTop: '10px',
                    fontSize: '12px',
                    position: 'absolute',
                    bottom: -30,
                    width: '100%'
                  }}
                  formatter={(value) => {
                    const category = chartData.find(cat => cat.categoryName === value);
                    return category ? value : '';
                  }}
                  iconType="circle"
                  iconSize={8}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
