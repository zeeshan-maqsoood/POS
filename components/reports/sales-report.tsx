import React from 'react';
import { DateRange } from 'react-day-picker';

type SalesReportProps = {
  dateRange: DateRange | undefined;
};

export function SalesReport({ dateRange }: SalesReportProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Sales Report</h2>
        <div className="text-sm text-muted-foreground">
          {dateRange?.from ? (
            dateRange.to ? (
              <>
                {format(dateRange.from, 'MMM dd, yyyy')} -{' '}
                {format(dateRange.to, 'MMM dd, yyyy')}
              </>
            ) : (
              format(dateRange.from, 'MMM dd, yyyy')
            )
          ) : (
            'Select a date range'
          )}
        </div>
      </div>
      
      <div className="rounded-lg border p-4">
        <div className="grid gap-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-lg border p-4">
              <div className="text-sm font-medium text-muted-foreground">Total Sales</div>
              <div className="text-2xl font-bold">$0.00</div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="text-sm font-medium text-muted-foreground">Total Orders</div>
              <div className="text-2xl font-bold">0</div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="text-sm font-medium text-muted-foreground">Average Order</div>
              <div className="text-2xl font-bold">$0.00</div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="text-sm font-medium text-muted-foreground">Items Sold</div>
              <div className="text-2xl font-bold">0</div>
            </div>
          </div>
          
          <div className="h-[400px] rounded-lg border p-4">
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Sales chart will be displayed here
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function format(date: Date, formatStr: string): string {
  // Simple date formatting function
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}