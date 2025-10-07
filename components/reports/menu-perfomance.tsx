// 'use client';

// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { useQuery } from "@tanstack/react-query";
// import { Skeleton } from "@/components/ui/skeleton";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import { format } from 'date-fns';

// type MenuPerformanceProps = {
//     dateRange: {
//       from: Date;
//       to: Date;
//     };
//   };

// type MenuItemPerformance = {
//   id: string;
//   name: string;
//   category: string;
//   quantitySold: number;
//   revenue: number;
//   cost: number;
//   profit: number;
//   profitMargin: number;
// };

// export function MenuPerformance({ dateRange }: MenuPerformanceProps) {
//   const { data: menuItems, isLoading } = useQuery<MenuItemPerformance[]>({
//     queryKey: ["menu-performance", dateRange.from.toISOString(), dateRange.to.toISOString()],
//     queryFn: async () => {
//       // TODO: Replace with actual API call
//       // const response = await fetch(`/api/reports/menu-performance?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`);
//       // return response.json();
      
//       // Mock data for now
//       return [
//         {
//           id: '1',
//           name: 'Margherita Pizza',
//           category: 'Pizza',
//           quantitySold: 45,
//           revenue: 1125,
//           cost: 450,
//           profit: 675,
//           profitMargin: 60
//         },
//         // Add more mock items as needed
//       ];
//     },
//   });

//   const formatCurrency = (amount: number) => {
//     return new Intl.NumberFormat('en-US', {
//       style: 'currency',
//       currency: 'USD',
//     }).format(amount);
//   };

//   if (isLoading) {
//     return (
//       <Card>
//         <CardHeader>
//           <CardTitle>Menu Performance</CardTitle>
//         </CardHeader>
//         <CardContent className="space-y-4">
//           <Skeleton className="h-4 w-full" />
//           <Skeleton className="h-4 w-3/4" />
//           <Skeleton className="h-4 w-1/2" />
//         </CardContent>
//       </Card>
//     );
//   }

//   return (
//     <Card>
//       <CardHeader>
//         <CardTitle>Menu Performance</CardTitle>
//         <p className="text-sm text-muted-foreground">
//           {format(dateRange.from, 'MMM dd, yyyy')} - {format(dateRange.to, 'MMM dd, yyyy')}
//         </p>
//       </CardHeader>
//       <CardContent>
//         <div className="rounded-md border">
//           <Table>
//             <TableHeader>
//               <TableRow>
//                 <TableHead>Item</TableHead>
//                 <TableHead>Category</TableHead>
//                 <TableHead className="text-right">Quantity</TableHead>
//                 <TableHead className="text-right">Revenue</TableHead>
//                 <TableHead className="text-right">Cost</TableHead>
//                 <TableHead className="text-right">Profit</TableHead>
//                 <TableHead className="text-right">Margin</TableHead>
//               </TableRow>
//             </TableHeader>
//             <TableBody>
//               {menuItems?.map((item) => (
//                 <TableRow key={item.id}>
//                   <TableCell className="font-medium">{item.name}</TableCell>
//                   <TableCell>{item.category}</TableCell>
//                   <TableCell className="text-right">{item.quantitySold}</TableCell>
//                   <TableCell className="text-right">{formatCurrency(item.revenue)}</TableCell>
//                   <TableCell className="text-right">{formatCurrency(item.cost)}</TableCell>
//                   <TableCell className="text-right font-medium">{formatCurrency(item.profit)}</TableCell>
//                   <TableCell className="text-right">{item.profitMargin}%</TableCell>
//                 </TableRow>
//               ))}
//               {menuItems?.length === 0 && (
//                 <TableRow>
//                   <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
//                     No menu items found in the selected date range
//                   </TableCell>
//                 </TableRow>
//               )}
//             </TableBody>
//           </Table>
//         </div>
//       </CardContent>
//     </Card>
//   );
// }


'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';

type MenuPerformanceProps = {
  dateRange: {
    from: Date;
    to: Date;
  };
};

type MenuItemPerformance = {
  id: string;
  name: string;
  category: string;
  quantitySold: number;
  revenue: number;
  cost: number;
  profit: number;
  profitMargin: number;
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};


export function MenuPerformance({ dateRange }: MenuPerformanceProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [menuItems, setMenuItems] = useState<MenuItemPerformance[]>([]);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // TODO: Replace with actual API call
        // const response = await fetch(`/api/reports/menu-performance?start=${dateRange.from.toISOString()}&end=${dateRange.to.toISOString()}`);
        // const result = await response.json();
        
        // Mock data for now
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
        const mockData: MenuItemPerformance[] = [];
        
        setMenuItems(mockData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch menu performance data'));
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
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="col-span-4">
        <CardContent className="pt-6">
          <div className="text-destructive">Error loading menu performance: {error.message}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Menu Performance</CardTitle>
        <p className="text-sm text-muted-foreground">
          {format(dateRange.from, 'MMM dd, yyyy')} - {format(dateRange.to, 'MMM dd, yyyy')}
        </p>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Quantity Sold</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="text-right">Profit</TableHead>
                <TableHead className="text-right">Profit Margin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {menuItems?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell className="text-right">{item.quantitySold}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.revenue)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.cost)}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(item.profit)}</TableCell>
                  <TableCell className="text-right">{item.profitMargin}%</TableCell>
                </TableRow>
              ))}
              {menuItems?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                    No menu items found in the selected date range
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}