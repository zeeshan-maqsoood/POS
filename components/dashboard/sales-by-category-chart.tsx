'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { CategorySales } from "@/lib/dashbaord-api";
import { formatEuro } from "@/lib/format-currency";
import { dashboardApi } from "@/lib/dashbaord-api";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', 
  '#82ca9d', '#ffc658', '#ff7300', '#8884d8', '#8dd1e1'
];

type TimePeriod = 'day' | 'week' | 'month';

interface SalesByCategoryChartProps {
  initialData?: CategorySales[];
}

export function SalesByCategoryChart({ initialData }: SalesByCategoryChartProps) {
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

    // Only fetch if we don't have initial data or when period changes
    if (!initialData || period !== 'week') {
      fetchData();
    }
  }, [period, initialData]);

  // Sort data by sales in descending order
  const sortedData = [...data].sort((a, b) => b.sales - a.sales);

  if (isLoading && data.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Sales by Category</CardTitle>
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
          <CardTitle>Sales by Category</CardTitle>
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
          <CardTitle>Sales by Category</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">No sales data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle>Sales by Category</CardTitle>
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
          <BarChart
            data={sortedData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <XAxis 
              type="number" 
              tickFormatter={(value) => `$${value.toLocaleString()}`}
            />
            <YAxis 
              dataKey="categoryName" 
              type="category" 
              width={100}
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              formatter={(value: number, name: string, props: any) => [
                formatEuro(Number(value)),
                name === 'sales' ? 'Total Sales' : name,
              ]}
              labelFormatter={(label) => `Category: ${label}`}
            />
            <Bar 
              dataKey="sales" 
              name="Sales"
              radius={[0, 4, 4, 0]}
            >
              {sortedData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
