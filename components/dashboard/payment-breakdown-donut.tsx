'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type PaymentMethodData = {
  name: string;
  value: number;
  color: string;
};

type PaymentBreakdownDonutProps = {
  data: {
    byMethod: Record<string, { count: number; revenue: number }>;
    byStatus: Record<string, number>;
  };
  title?: string;
  type?: 'method' | 'status';
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export function PaymentBreakdownDonut({
  data,
  title = 'Payment Breakdown',
  type = 'method',
}: PaymentBreakdownDonutProps) {
  // Prepare data for the chart
  const chartData: PaymentMethodData[] = [];
  
  if (type === 'method') {
    Object.entries(data.byMethod).forEach(([method, { revenue }], index) => {
      chartData.push({
        name: method.charAt(0).toUpperCase() + method.slice(1).toLowerCase(),
        value: revenue,
        color: COLORS[index % COLORS.length],
      });
    });
  } else {
    Object.entries(data.byStatus).forEach(([status, count], index) => {
      chartData.push({
        name: status.charAt(0).toUpperCase() + status.slice(1).toLowerCase(),
        value: count,
        color: COLORS[index % COLORS.length],
      });
    });
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">
          {type === 'method' ? 'Payment Methods' : 'Payment Status'}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          {chartData.length > 0 ? (
            <div className="w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }: { name: string; percent: number }) => {
                      // Ensure percent is a number before using toFixed
                      const percentage = typeof percent === 'number' ? (percent * 100).toFixed(0) : '0';
                      return `${name}: ${percentage}%`;
                    }}
                    labelLine={false}
                  >
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color} 
                        stroke="#fff"
                        strokeWidth={1}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      `$${Number(value).toFixed(2)}`,
                      name,
                    ]}
                  />
                  <Legend 
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                    wrapperStyle={{
                      paddingTop: '10px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center text-muted-foreground">
              No payment data available
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
