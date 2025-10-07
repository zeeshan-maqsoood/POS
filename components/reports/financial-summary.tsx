// 'use client';

// import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
// import { Skeleton } from '@/components/ui/skeleton';
// import { format } from 'date-fns';

// type FinancialSummaryProps = {
//     dateRange: {
//       from: Date;
//       to: Date;
//     };
//   className?: string;
// };

// export function FinancialSummary({ 
//   dateRange, 
//   className = '' 
// }: FinancialSummaryProps) {
//   // TODO: Fetch financial summary data based on date range
//   const isLoading = false;
  
//   return (
//     <Card className={className}>
//       <CardHeader>
//         <CardTitle>Financial Summary</CardTitle>
//         <p className="text-sm text-muted-foreground">
//           {format(dateRange.from, 'MMM dd, yyyy')} - {format(dateRange.to, 'MMM dd, yyyy')}
//         </p>
//       </CardHeader>
//       <CardContent>
//         {isLoading ? (
//           <div className="space-y-4">
//             <Skeleton className="h-4 w-[250px]" />
//             <Skeleton className="h-[100px] w-full" />
//           </div>
//         ) : (
//           <div className="space-y-4">
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//               <Card>
//                 <CardHeader className="pb-2">
//                   <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
//                 </CardHeader>
//                 <CardContent>
//                   <p className="text-2xl font-bold">$0.00</p>
//                 </CardContent>
//               </Card>
//               <Card>
//                 <CardHeader className="pb-2">
//                   <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
//                 </CardHeader>
//                 <CardContent>
//                   <p className="text-2xl font-bold">$0.00</p>
//                 </CardContent>
//               </Card>
//               <Card>
//                 <CardHeader className="pb-2">
//                   <p className="text-sm font-medium text-muted-foreground">Net Profit</p>
//                 </CardHeader>
//                 <CardContent>
//                   <p className="text-2xl font-bold">$0.00</p>
//                 </CardContent>
//               </Card>
//               <Card>
//                 <CardHeader className="pb-2">
//                   <p className="text-sm font-medium text-muted-foreground">Avg. Order Value</p>
//                 </CardHeader>
//                 <CardContent>
//                   <p className="text-2xl font-bold">$0.00</p>
//                 </CardContent>
//               </Card>
//             </div>
//             <Card>
//               <CardHeader>
//                 <p className="text-sm font-medium">Financial Overview</p>
//               </CardHeader>
//               <CardContent>
//                 <div className="h-[300px] flex items-center justify-center text-muted-foreground">
//                   Financial chart will be displayed here
//                 </div>
//               </CardContent>
//             </Card>
//           </div>
//         )}
//       </CardContent>
//     </Card>
//   );
// }


'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';

type FinancialSummaryProps = {
  dateRange: {
    from: Date;
    to: Date;
  };
  className?: string;
};

type FinancialData = {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
};

export function FinancialSummary({ 
  dateRange, 
  className = '' 
}: FinancialSummaryProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<FinancialData | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // TODO: Replace with actual API call
        // const response = await fetch(`/api/reports/financial-summary?start=${dateRange.from.toISOString()}&end=${dateRange.to.toISOString()}`);
        // const result = await response.json();
        
        // Mock data for now
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
        const mockData: FinancialData = {
          totalRevenue: 0,
          totalExpenses: 0,
          netProfit: 0,
        };
        
        setData(mockData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch financial data'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [dateRange.from, dateRange.to]);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-destructive">Error loading financial data: {error.message}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Financial Summary</CardTitle>
        <p className="text-sm text-muted-foreground">
          {format(dateRange.from, 'MMM dd, yyyy')} - {format(dateRange.to, 'MMM dd, yyyy')}
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium">Total Revenue</p>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-4 w-4 text-muted-foreground">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">${data?.totalRevenue.toFixed(2)}</p>
            </CardContent>
          </Card>
          {/* Rest of your component */}
        </div>
      </CardContent>
    </Card>
  );
}