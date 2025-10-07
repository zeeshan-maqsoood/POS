
'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";

type OrderAnalysisProps = {
  dateRange: {
    from: Date;
    to: Date;
  };
};

type OrderAnalysisData = {
  totalOrders: number;
  averageOrderValue: number;
  orderTrends: any[]; // Replace 'any' with a proper type for your order trends
  popularItems: any[]; // Replace 'any' with a proper type for your popular items
};

export function OrderAnalysis({ dateRange }: OrderAnalysisProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<OrderAnalysisData | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // TODO: Replace with actual API call
        // const response = await fetch(`/api/reports/order-analysis?start=${dateRange.from.toISOString()}&end=${dateRange.to.toISOString()}`);
        // const result = await response.json();
        
        // Mock data for now
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
        const mockData: OrderAnalysisData = {
          totalOrders: 0,
          averageOrderValue: 0,
          orderTrends: [],
          popularItems: [],
        };
        
        setData(mockData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch order analysis data'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [dateRange.from, dateRange.to]);

  if (isLoading) {
    return (
      <Card className="col-span-4">
        <CardHeader>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
          <Skeleton className="h-64 w-full mt-4" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="col-span-4">
        <CardContent className="pt-6">
          <div className="text-destructive">Error loading order analysis: {error.message}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Order Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border p-4">
            <h3 className="text-sm font-medium">Total Orders</h3>
            <p className="text-2xl font-bold">{data?.totalOrders}</p>
          </div>
          <div className="rounded-lg border p-4">
            <h3 className="text-sm font-medium">Avg. Order Value</h3>
            <p className="text-2xl font-bold">
              ${(data?.averageOrderValue || 0).toFixed(2)}
            </p>
          </div>
        </div>
        
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4">Order Trends</h3>
          <div className="h-64 bg-muted/50 rounded-lg flex items-center justify-center">
            <p className="text-muted-foreground">Order trends chart will be displayed here</p>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4">Popular Items</h3>
          <div className="space-y-2">
            {data?.popularItems.length ? (
              data.popularItems.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-2 hover:bg-muted/50 rounded">
                  <span>{item.name}</span>
                  <span className="font-medium">{item.count} orders</span>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4">No popular items data available</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}