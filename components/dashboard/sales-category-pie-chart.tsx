'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { CategorySales } from "@/lib/dashbaord-api";
import { formatEuro } from "@/lib/format-currency";
import { dashboardApi } from "@/lib/dashbaord-api";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#FF6B6B', '#4ECDC4', '#45B7D1'];

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
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle>Sales Distribution</CardTitle>
          <Tabs 
            value={period} 
            onValueChange={(value) => setPeriod(value as TimePeriod)}
            className="w-auto"
          >
            <TabsList className="h-8">
              <TabsTrigger value="day" className="text-xs px-2">Today</TabsTrigger>
              <TabsTrigger value="week" className="text-xs px-2">Week</TabsTrigger>
              <TabsTrigger value="month" className="text-xs px-2">Month</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsPieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="sales"
              nameKey="categoryName"
              label={({ name, percent }: { name: string, percent?: number }) => 
                `${name} (${percent ? (percent * 100).toFixed(0) : 0}%)`
              }
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]} 
                />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => formatEuro(Number(value))}
            />
            <Legend 
              layout="horizontal" 
              verticalAlign="bottom"
              align="center"
              wrapperStyle={{ paddingTop: '20px' }}
              formatter={(value) => {
                const category = chartData.find(cat => cat.categoryName === value);
                return category ? `${value} (${formatEuro(category.sales)})` : value;
              }}
            />
          </RechartsPieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
