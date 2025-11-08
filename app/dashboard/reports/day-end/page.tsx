'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DayEndReport } from '@/components/reports/day-end-report';

export default function DayEndReportPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Day End Report</h1>
        <p className="text-muted-foreground mt-2">
          Generate and view day end reports for cash reconciliation
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daily Cash Reconciliation</CardTitle>
          <CardDescription>
            Generate a day end report to reconcile your cash drawer and view daily sales.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DayEndReport />
        </CardContent>
      </Card>
    </div>
  );
}
