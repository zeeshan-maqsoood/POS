'use client';

import { useState, useEffect, useContext, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, Download, Loader2, Printer, BarChart2, PieChart, Clock, Tag, Percent, CreditCard, Package, Utensils, Coffee, ShoppingBag, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/utils/api';
import { useUser } from '@/hooks/use-user';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface SalesByCategory {
  category: string;
  amount: number;
  count: number;
}

interface TopSellingItem {
  id: string;
  name: string;
  quantity: number;
  total: number;
}

interface DiscountSummary {
  totalDiscounts: number;
  discountedOrders: number;
  averageDiscount: number;
}

interface HourlySales {
  hour: number;
  amount: number;
  orderCount: number;
}

interface OrderTypeSummary {
  type: string;
  count: number;
  total: number;
}

interface DayEndReportData {
  id: string;
  date: string;
  expectedTotal: number;
  actualCash: number;
  difference: number;
  ordersCount: number;
  totalSales: number;
  averageOrderValue: number;
  paymentMethods: Array<{
    method: string;
    amount: number;
    count: number;
  }>;
  salesByCategory?: SalesByCategory[];
  topSellingItems?: TopSellingItem[];
  discountSummary?: DiscountSummary;
hourlySales?: HourlySales[];
  orderTypes?: OrderTypeSummary[];
  branchId?: string;
  branch?: {
    id: string;
    name: string;
  };
  createdBy?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export function DayEndReport() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReportGenerated, setIsReportGenerated] = useState(false);
  const [isPrintView, setIsPrintView] = useState(false);
  const [formData, setFormData] = useState({
    actualCash: ''
  });
  const [todaysSales, setTodaysSales] = useState<number>(0);
  const [reportData, setReportData] = useState<DayEndReportData | null>(null);
  const [isLoadingSales, setIsLoadingSales] = useState<boolean>(true);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const { user } = useUser();
  const router = useRouter();
  
  // Check if user can access this page
  useEffect(() => {
    if (user && !user.branchId && user.role !== 'ADMIN') {
      toast.error('You need to be assigned to a branch to access this page');
      router.push('/dashboard');
    }
  }, [user]);

  // Function to fetch today's total sales
  const fetchTodaysSales = async () => {
    // Allow admin to proceed without branchId
    if (!user?.branchId && user?.role !== 'ADMIN') {
      console.log('No branchId and user is not admin');
      return;
    }
    
    setIsLoadingSales(true);
    try {
      console.log('Fetching today\'s sales...');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Get the branch name from user's branch info
      let branchName = '';
      if (user?.branchId) {
        try {
          const branchResponse = await api.get(`/api/branches/${user.branchId}`);
          branchName = branchResponse.data?.name || '';
          console.log('Branch name:', branchName);
        } catch (branchError) {
          console.error('Error fetching branch info:', branchError);
          if (user.role === 'ADMIN') {
            // For admin, continue without branch name
            console.log('Admin user, continuing without branch filter');
          } else {
            throw new Error('Failed to load branch information');
          }
        }
      }
      
      console.log('Fetching sales stats with params:', {
        startDate: today.toISOString(),
        branchName: branchName || 'Not specified (will fetch all)'
      });
      
      // Fetch sales stats for today
      const salesResponse = await api.get('/orders/stats', {
        params: {
          startDate: today.toISOString(),
          branchName: branchName || undefined
        }
      });
      
      console.log('Sales response:', salesResponse.data);
      
      // Handle different response formats
      let totalRevenue = 0;
      const responseData = salesResponse.data;

      // Check if the response has a data property
      if (responseData && typeof responseData === 'object') {
        // Check for nested data structure first
        if (responseData.data && typeof responseData.data === 'object') {
          totalRevenue = responseData.data.totalRevenue || 0;
          
          // If still 0, check for alternative property names
          if (totalRevenue === 0) {
            totalRevenue = responseData.data.total || 0;
          }
        } 
        // Check for direct properties
        else if ('totalRevenue' in responseData) {
          totalRevenue = responseData.totalRevenue;
        }
        // Check for alternative property names
        else if ('total' in responseData) {
          totalRevenue = responseData.total;
        }
      }
      
      console.log('Setting today\'s sales to:', totalRevenue);
      setTodaysSales(Number(totalRevenue) || 0);
      
    } catch (error) {
      console.error('Error fetching today\'s sales:', error);
      toast.error('Failed to load today\'s sales data');
      setTodaysSales(0);
    } finally {
      setIsLoadingSales(false);
    }
  };
  
  const [isLoading, setIsLoading] = useState(false);
  
  // Load today's sales when component mounts or user data changes
  useEffect(() => {
    console.log('useEffect triggered, user:', user);
    
    // If we don't have user data yet, wait for it
    if (!user) {
      console.log('User data not loaded yet, waiting...');
      return;
    }
    
    // If we have a branchId, fetch the sales data
    if (user.branchId) {
      console.log('Branch ID available, fetching sales data...');
      fetchTodaysSales();
    } else if (user.role === 'ADMIN') {
      // If admin, allow proceeding without branch (can view all branches)
      console.log('Admin user, fetching sales data without branch filter');
      fetchTodaysSales();
    } else {
      console.log('No branchId available in user data:', user);
      toast.error('No branch assigned to your account. Please contact an administrator.');
    }
  }, [user]); // Watch the entire user object for changes
  const [error, setError] = useState<string | null>(null);

  const generateDayEndReport = async (data: { expectedTotal: number; actualCash: number }) => {
    try {
      const response = await api.post('/api/reports/day-end', data);
      // Handle the response structure with success and data fields
      if (response.data && response.data.success) {
        return response.data.data;
      }
      throw new Error('Invalid response format from server');
    } catch (error: any) {
      console.error('Error generating day end report:', error);
      throw error.response?.data || { message: error.message || 'Failed to generate day end report' };
    }
  };

  const getTodaysReport = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const response = await api.get('/api/reports/day-end', {
        params: {
          startDate: today.toISOString(),
          branchId: user?.branchId,
          page: 1,
          pageSize: 1
        }
      });
      
      return response.data.data?.[0];
    } catch (error) {
      console.error('Error fetching today\'s report:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.actualCash) {
      toast.error('Please enter the actual cash amount');
      return;
    }

    // Ensure we have a valid sales value
    if (todaysSales === 0) {
      toast.error('No sales data found for today. Cannot generate report.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      console.log('Submitting report with values:', {
        expectedTotal: todaysSales,
        actualCash: Number(formData.actualCash)
      });
      
      const report = await generateDayEndReport({
        expectedTotal: todaysSales,
        actualCash: Number(formData.actualCash)
      });

      console.log('Report generated:', report);
      
      // Ensure the report data includes the expected total from todaysSales
      const reportWithExpectedTotal = {
        ...report,
        expectedTotal: todaysSales, // Explicitly set the expectedTotal from todaysSales
        paymentMethods: Array.isArray(report.paymentMethods) 
          ? report.paymentMethods 
          : (typeof report.paymentMethods === 'string' 
              ? JSON.parse(report.paymentMethods) 
              : [])
      };
      
      setReportData(reportWithExpectedTotal);
      setIsReportGenerated(true);
      toast.success('Day end report generated successfully');
    } catch (error: any) {
      console.error('Error generating day end report:', error);
      const errorMessage = error.message || 'Failed to generate day end report';
      setError(errorMessage);
      toast.error(errorMessage);
      
      // If unauthorized, redirect to login
      if (error.statusCode === 401) {
        router.push('/login');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Load today's report and sales data
  useEffect(() => {
    const loadTodaysData = async () => {
      if (!user?.branchId) return;
      
      setIsLoading(true);
      try {
        // Load today's report if it exists
        const report = await getTodaysReport();
        if (report) {
          setReportData({
            ...report,
            paymentMethods: Array.isArray(report.paymentMethods) 
              ? report.paymentMethods 
              : JSON.parse(report.paymentMethods as any)
          });
          
          // Set today's sales from the report's expectedTotal
          setTodaysSales(Number(report.expectedTotal));
          
          setIsReportGenerated(true);
          setFormData({
            actualCash: report.actualCash.toString()
          });
          return; // Skip loading sales data if we already have a report
        }
        
        try {
          console.log('Fetching today\'s sales...');
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          console.log('User branchId:', user?.branchId);
          
          // Get the branch name from user's branch info
          let branchName = '';
          if (user?.branchId) {
            console.log('Fetching branch info...');
            const branchResponse = await api.get(`/api/branches/${user.branchId}`);
            console.log('Branch response:', branchResponse.data);
            branchName = branchResponse.data?.name || '';
            console.log('Branch name:', branchName);
          }
          
          console.log('Fetching sales stats...');
          const salesResponse = await api.get('/api/orders/stats', {
            params: {
              startDate: today.toISOString(),
              branchName: branchName || undefined
            }
          });
          
          console.log('Sales response:', salesResponse.data);
          
          if (salesResponse.data?.data?.totalRevenue !== undefined) {
            console.log('Setting today\'s sales:', salesResponse.data.data.totalRevenue);
            setTodaysSales(Number(salesResponse.data.data.totalRevenue));
          } else {
            console.warn('No totalRevenue in response, trying alternative path...');
            // Try alternative response path
            if (salesResponse.data?.totalRevenue !== undefined) {
              console.log('Setting today\'s sales (alternative path):', salesResponse.data.totalRevenue);
              setTodaysSales(Number(salesResponse.data.totalRevenue));
            } else {
              console.warn('No sales data found in response');
            }
          }
        } catch (error) {
          console.error('Error fetching sales data:', error);
        }
      } catch (error) {
        console.error('Error loading today\'s report:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTodaysData();
  }, [user?.branchId]);

  const handlePrint = () => {
    setIsPrintView(true);
    setTimeout(() => {
      window.print();
      setIsPrintView(false);
    }, 100);
  };

  const reportRef = useRef<HTMLDivElement>(null);

  const handleDownloadPdf = () => {
    try {
      setIsLoading(true);
      
      // Format currency function
      const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-GB', {
          style: 'currency',
          currency: 'GBP',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }).format(value);
      };
      
      // Helper function to add a new page if needed
      const addNewPageIfNeeded = (doc: any, yPos: number, margin = 20) => {
        if (yPos > 270) {
          doc.addPage();
          return margin;
        }
        return yPos;
      };
      
      // Dynamically import jsPDF to avoid SSR issues
      import('jspdf').then(({ jsPDF }) => {
        const doc = new jsPDF();
        let yPosition = 20;
        
        // Set document properties
        doc.setProperties({
          title: `Day End Report - ${format(new Date(), 'yyyy-MM-dd')}`,
          subject: 'Daily Sales Report',
          author: 'POS System',
          creator: 'POS Admin'
        });

        // Add title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(20);
        doc.text('Day End Report', 15, yPosition);
        yPosition += 10;
        
        // Add date and branch
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        doc.setTextColor(100);
        doc.text(
          `${format(parseISO(reportData.date), 'EEEE, MMMM d, yyyy')}${reportData.branch ? ` • ${reportData.branch.name}` : ''}`,
          15,
          yPosition
        );
        yPosition += 15;

        // Add summary section
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text('Summary', 15, yPosition);
        yPosition += 10;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.text(`Total Sales: ${formatCurrency(reportData.totalSales)}`, 20, yPosition);
        yPosition += 7;
        doc.text(`Expected Total: ${formatCurrency(reportData.expectedTotal || 0)}`, 20, yPosition);
        yPosition += 7;
        doc.text(`Orders Count: ${reportData.ordersCount}`, 20, yPosition);
        yPosition += 7;
        doc.text(`Average Order Value: ${formatCurrency(reportData.averageOrderValue || 0)}`, 20, yPosition);
        yPosition += 15;

        // Add payment methods
        if (reportData.paymentMethods?.length) {
          yPosition = addNewPageIfNeeded(doc, yPosition + 10);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(14);
          doc.text('Payment Methods', 15, yPosition);
          yPosition += 10;
          
          doc.setFont('helvetica', 'normal');
          reportData.paymentMethods.forEach((method) => {
            yPosition = addNewPageIfNeeded(doc, yPosition + 7);
            doc.text(
              `• ${method.method}: ${formatCurrency(method.amount)} (${method.count} transactions)`,
              20,
              yPosition
            );
          });
          yPosition += 10;
        }

        // Add sales by category
        if (reportData.salesByCategory?.length) {
          yPosition = addNewPageIfNeeded(doc, yPosition + 10);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(14);
          doc.text('Sales by Category', 15, yPosition);
          yPosition += 10;
          
          doc.setFont('helvetica', 'normal');
          reportData.salesByCategory.forEach((category) => {
            yPosition = addNewPageIfNeeded(doc, yPosition + 7);
            doc.text(
              `• ${category.category}: ${formatCurrency(category.amount)} (${category.count} items)`,
              20,
              yPosition
            );
          });
          yPosition += 10;
        }

        // Add top selling items
        if (reportData.topSellingItems?.length) {
          yPosition = addNewPageIfNeeded(doc, yPosition + 10);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(14);
          doc.text('Top Selling Items', 15, yPosition);
          yPosition += 10;
          
          doc.setFont('helvetica', 'normal');
          reportData.topSellingItems.forEach((item, index) => {
            yPosition = addNewPageIfNeeded(doc, yPosition + 7);
            doc.text(
              `${index + 1}. ${item.name}: ${item.quantity} x ${formatCurrency(item.total / item.quantity)} = ${formatCurrency(item.total)}`,
              20,
              yPosition
            );
          });
          yPosition += 10;
        }

        // Add discount summary if available
        if (reportData.discountSummary) {
          yPosition = addNewPageIfNeeded(doc, yPosition + 10);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(14);
          doc.text('Discounts Summary', 15, yPosition);
          yPosition += 10;
          
          doc.setFont('helvetica', 'normal');
          doc.text(`Total Discounts: ${formatCurrency(reportData.discountSummary.totalDiscounts)}`, 20, yPosition);
          yPosition += 7;
          doc.text(`Discounted Orders: ${reportData.discountSummary.discountedOrders} of ${reportData.ordersCount}`, 20, yPosition);
          yPosition += 15;
        }

        // Add hourly sales if available
        if (reportData.hourlySales?.length) {
          yPosition = addNewPageIfNeeded(doc, yPosition + 10);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(14);
          doc.text('Hourly Sales', 15, yPosition);
          yPosition += 10;
          
          doc.setFont('helvetica', 'normal');
          reportData.hourlySales.forEach((hour) => {
            yPosition = addNewPageIfNeeded(doc, yPosition + 7);
            const hourStr = `${hour.hour}:00 - ${hour.hour + 1}:00`;
            doc.text(
              `${hourStr}: ${formatCurrency(hour.amount)} (${hour.orderCount} orders)`,
              20,
              yPosition
            );
          });
          yPosition += 10;
        }

        // Add order types if available
        if (reportData.orderTypes?.length) {
          yPosition = addNewPageIfNeeded(doc, yPosition + 10);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(14);
          doc.text('Orders by Type', 15, yPosition);
          yPosition += 10;
          
          doc.setFont('helvetica', 'normal');
          reportData.orderTypes.forEach((orderType) => {
            yPosition = addNewPageIfNeeded(doc, yPosition + 7);
            doc.text(
              `• ${orderType.type}: ${orderType.count} orders (${formatCurrency(orderType.total)})`,
              20,
              yPosition
            );
          });
        }

        // Add generated at
        yPosition = addNewPageIfNeeded(doc, 280);
        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text(`Generated at: ${format(new Date(), 'PPPppp')}`, 15, yPosition);

        // Save the PDF
        doc.save(`day-end-report-${format(new Date(), 'yyyy-MM-dd-HH-mm-ss')}.pdf`);
        toast.success('Report downloaded successfully');
      }).catch(error => {
        console.error('Error loading jsPDF:', error);
        toast.error('Failed to load PDF generator. Please try again.');
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isReportGenerated && reportData) {
    // Format currency
    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GBP',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value);
    };

    // Format time from hour number
    const formatHour = (hour: number) => {
      return new Date(0, 0, 0, hour).toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    };

    return (
      <div className="container mx-auto py-6 px-4" ref={reportRef}>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Day End Report</h1>
            {reportData && (
              <p className="text-muted-foreground">
                {format(parseISO(reportData.date), 'EEEE, MMMM d, yyyy')}
                {reportData.branch && ` • ${reportData.branch.name}`}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {isReportGenerated && (
              <>
                <Button variant="outline" onClick={handleDownloadPdf} disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Download PDF
                </Button>
                <Button variant="outline" onClick={handlePrint}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </Button>
              </>
            )}
          </div>
        </div>
        <Card className={isPrintView ? 'border-none shadow-none' : ''}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Day End Summary</CardTitle>
                <CardDescription>
                  {format(new Date(reportData.date), 'EEEE, MMMM d, yyyy')}
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Generated at</div>
                <div className="font-medium">{format(new Date(), 'h:mm a')}</div>
              </div>
            </div>
          </CardHeader>
          {isReportGenerated && reportData ? (
            <Tabs defaultValue="summary" className="space-y-6">
              <TabsList>
                <TabsTrigger value="summary">
                  <BarChart2 className="h-4 w-4 mr-2" />
                  Summary
                </TabsTrigger>
                <TabsTrigger value="sales">
                  <PieChart className="h-4 w-4 mr-2" />
                  Sales Analysis
                </TabsTrigger>
                <TabsTrigger value="items">
                  <Package className="h-4 w-4 mr-2" />
                  Top Items
                </TabsTrigger>
                <TabsTrigger value="payments">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Payments
                </TabsTrigger>
                <TabsTrigger value="payments">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Payments
                </TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                        <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{formatCurrency(reportData.totalSales)}</p>
                      <p className="text-sm text-muted-foreground">{reportData.ordersCount} orders</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium">Expected Total</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{formatCurrency(reportData.expectedTotal || 0)}</p>
                      <p className="text-sm text-muted-foreground">expected sales</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium">Avg. Order</CardTitle>
                        <Tag className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{formatCurrency(reportData.averageOrderValue || 0)}</p>
                      <p className="text-sm text-muted-foreground">per order</p>
                    </CardContent>
                  </Card>

                  {reportData.discountSummary && (
                    <Card>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-medium">Discounts</CardTitle>
                          <Percent className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold text-red-600">-{formatCurrency(reportData.discountSummary.totalDiscounts || 0)}</p>
                        <p className="text-sm text-muted-foreground">
                          {reportData.discountSummary.discountedOrders} of {reportData.ordersCount} orders
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="md:col-span-2">
                    <CardHeader>
                      <CardTitle>Sales by Category</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {reportData.salesByCategory && reportData.salesByCategory.length > 0 ? (
                        <div className="space-y-4">
                          {reportData.salesByCategory.map((category, index) => (
                            <div key={index} className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span className="font-medium">{category.category}</span>
                                <span>{formatCurrency(category.amount)} ({category.count})</span>
                              </div>
                              <Progress 
                                value={(category.amount / reportData.totalSales) * 100} 
                                className="h-2"
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-sm">No category data available</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Order Types</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {reportData.orderTypes && reportData.orderTypes.length > 0 ? (
                        <div className="space-y-4">
                          {reportData.orderTypes.map((orderType, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                {orderType.type === 'DINE_IN' ? (
                                  <Utensils className="h-4 w-4 text-muted-foreground" />
                                ) : orderType.type === 'TAKEAWAY' ? (
                                  <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <Coffee className="h-4 w-4 text-muted-foreground" />
                                )}
                                <span className="capitalize">{orderType.type.toLowerCase().replace('_', ' ')}</span>
                              </div>
                              <div className="text-right">
                                <p className="font-medium">{formatCurrency(orderType.total)}</p>
                                <p className="text-xs text-muted-foreground">{orderType.count} orders</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-sm">No order type data available</p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {reportData.difference !== 0 && (
                  <Alert variant={reportData.difference > 0 ? 'default' : 'destructive'}>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Cash Variance</AlertTitle>
                    <AlertDescription>
                      There is a difference of {formatCurrency(Math.abs(reportData.difference))} between expected and actual cash.
                    </AlertDescription>
                  </Alert>
                )}
              </TabsContent>

              <TabsContent value="sales" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Sales by Hour</CardTitle>
                    <CardDescription>Hourly sales performance</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {reportData.hourlySales && reportData.hourlySales.length > 0 ? (
                      <div className="space-y-4">
                        {reportData.hourlySales.map((hour, index) => (
                          <div key={index} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                                <span>{formatHour(hour.hour)}</span>
                              </div>
                              <div className="text-right">
                                <span className="font-medium">{formatCurrency(hour.amount)}</span>
                                <span className="text-muted-foreground text-xs ml-2">
                                  ({hour.orderCount} {hour.orderCount === 1 ? 'sale' : 'sales'})
                                </span>
                              </div>
                            </div>
                            <Progress 
                              value={(hour.amount / (reportData.hourlySales?.reduce((sum, h) => sum + h.amount, 0) || 1)) * 100} 
                              className="h-2"
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">No hourly sales data available</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="items" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Top Selling Items</CardTitle>
                    <CardDescription>Most popular menu items by quantity sold</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {reportData.topSellingItems && reportData.topSellingItems.length > 0 ? (
                      <div className="space-y-4">
                        {reportData.topSellingItems.map((item, index) => (
                          <div key={item.id} className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                                <span className="text-sm font-medium text-primary">{index + 1}</span>
                              </div>
                              <div>
                                <p className="font-medium">{item.name}</p>
                                <p className="text-sm text-muted-foreground">{item.quantity} sold</p>
                              </div>
                            </div>
                            <span className="font-medium">{formatCurrency(item.total)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">No item data available</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="payments" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Methods</CardTitle>
                    <CardDescription>Breakdown of payment types</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {reportData.paymentMethods && reportData.paymentMethods.length > 0 ? (
                      <div className="space-y-4">
                        {reportData.paymentMethods.map((method, index) => (
                          <div key={index} className="space-y-1">
                            <div className="flex justify-between">
                              <span className="font-medium capitalize">{method.method.toLowerCase()}</span>
                              <span>{formatCurrency(method.amount)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-muted-foreground">
                              <span>{method.count} {method.count === 1 ? 'transaction' : 'transactions'}</span>
                              <span>{((method.amount / reportData.totalSales) * 100).toFixed(1)}% of sales</span>
                            </div>
                            <Progress 
                              value={(method.amount / reportData.totalSales) * 100} 
                              className="h-2"
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">No payment data available</p>
                    )}
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium">Expected Cash</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{formatCurrency(reportData.expectedTotal)}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium">Actual Cash</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{formatCurrency(reportData.actualCash)}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium">Variance</CardTitle>
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className={`text-2xl font-bold ${reportData.difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {reportData.difference >= 0 ? '+' : ''}{formatCurrency(Math.abs(reportData.difference))}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Payments Tab */}
              <TabsContent value="payments" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Methods</CardTitle>
                    <CardDescription>Breakdown of payments by method</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {reportData.paymentMethods && reportData.paymentMethods.length > 0 ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4 font-medium text-sm text-muted-foreground border-b pb-2">
                          <div>Payment Method</div>
                          <div className="text-right">Amount</div>
                          <div className="text-right">Count</div>
                        </div>
                        {reportData.paymentMethods.map((method, index) => (
                          <div key={index} className="grid grid-cols-3 gap-4 items-center">
                            <div className="font-medium">{method.method}</div>
                            <div className="text-right">{formatCurrency(method.amount)}</div>
                            <div className="text-right text-muted-foreground">{method.count} {method.count === 1 ? 'transaction' : 'transactions'}</div>
                          </div>
                        ))}
                        <div className="grid grid-cols-3 gap-4 font-medium border-t pt-2 mt-2">
                          <div>Total</div>
                          <div className="text-right">
                            {formatCurrency(reportData.paymentMethods.reduce((sum, method) => sum + method.amount, 0))}
                          </div>
                          <div className="text-right">
                            {reportData.paymentMethods.reduce((sum, method) => sum + method.count, 0)} transactions
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">No payment data available</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="space-y-4">
              <Alert variant={reportData.difference > 0 ? 'default' : 'destructive'}>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Cash Variance</AlertTitle>
                <AlertDescription>
                  There is a difference of {formatCurrency(Math.abs(reportData.difference))} between expected and actual cash.
                </AlertDescription>
              </Alert>
              
              <div className="flex justify-end gap-4">
                <Button variant="outline" onClick={() => setIsReportGenerated(false)}>
                  Back
                </Button>
                <Button onClick={handlePrint} className="gap-2">
                  <Printer className="h-4 w-4" />
                  Print Report
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Day End Report</CardTitle>
        <CardDescription>
          Enter the actual cash in drawer to generate the day end report. The expected total is calculated from today's total sales.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label>Expected Total (Today's Sales)</Label>
              <div className={`flex items-center h-10 px-3 py-2 text-sm border rounded-md ${todaysSales === 0 ? 'bg-amber-50 border-amber-200' : 'bg-muted/50'}`}>
                <span className="mr-2">£</span>
                <span className={`font-medium ${todaysSales === 0 ? 'text-amber-800' : ''}`}>
                  {isLoading ? 'Loading...' : 
                    todaysSales > 0 ? 
                    new Intl.NumberFormat('en-GB', {
                      style: 'currency',
                      currency: 'GBP',
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    }).format(todaysSales).replace('£', '')
                    : '0.00'}
                </span>
                {todaysSales === 0 && (
                  <span className="ml-2 text-xs text-amber-600">
                    No sales recorded for today
                  </span>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="actualCash">Actual Cash in Drawer</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">£</span>
                <Input
                  id="actualCash"
                  name="actualCash"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.actualCash}
                  onChange={handleInputChange}
                  className="pl-8"
                  required
                />
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate Report'
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
