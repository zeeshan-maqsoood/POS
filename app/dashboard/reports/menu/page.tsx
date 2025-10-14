// app/dashboard/reports/menu/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Utensils,
  TrendingUp,
  Star,
  Download,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { reportApi, ReportParams } from '@/lib/report-api';
import { categoryApi, Category } from '@/lib/menu-api';
import { DateRangePicker } from '@/components/ui/date-range-picker';
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

interface MenuItemPerformance {
  menuItem: {
    id: string;
    name: string;
    category: {
      id: string;
      name: string;
    };
  };
  totalQuantity: number;
  totalRevenue: number;
  ordersCount: number;
}

interface CategoryPerformance {
  category: {
    id: string;
    name: string;
  };
  totalQuantity: number;
  totalRevenue: number;
  itemsCount: number;
  uniqueItemsCount: number;
  avgItemValue: number;
  popularity: number;
}

export default function MenuReportsPage() {
  const [reportType, setReportType] = useState<'performance' | 'categories'>('performance');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ startDate?: string; endDate?: string }>({});
  const [categories, setCategories] = useState<Category[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState<boolean>(false)
  // State for menu performance data
  const [menuPerformance, setMenuPerformance] = useState<{
    menuItems: MenuItemPerformance[];
    totalItems: number;
    totalRevenue: number;
    totalQuantity: number;
  } | null>(null);

  // State for category performance data
  const [categoryPerformance, setCategoryPerformance] = useState<{
    categories: CategoryPerformance[];
    totalCategories: number;
    totalRevenue: number;
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Build API params
  const buildParams = (): ReportParams => {
    const params: ReportParams = {
      branchName: branchFilter === 'all' ? undefined : branchFilter,
      categoryId: categoryFilter === 'all' ? undefined : categoryFilter,
      ...dateRange
    };
    return params;
  };

  // Fetch menu performance data
  const fetchMenuPerformance = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await reportApi.getMenuPerformance(buildParams());
      if (response.data.success) {
        setMenuPerformance(response.data.data);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError('Failed to fetch menu performance data');
      console.error('Error fetching menu performance:', err);
    } finally {
      setLoading(false);
    }
  };

  // Add this useEffect after the existing ones:
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const response = await categoryApi.getCategories();
        if (response.data.success) {
          setCategories(response.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Fetch category performance data
  const fetchCategoryPerformance = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await reportApi.getCategoryPerformance(buildParams());
      if (response.data.success) {
        setCategoryPerformance(response.data.data);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError('Failed to fetch category performance data');
      console.error('Error fetching category performance:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when filters or report type changes
  useEffect(() => {
    if (reportType === 'performance') {
      fetchMenuPerformance();
    } else {
      fetchCategoryPerformance();
    }
  }, [reportType, branchFilter, categoryFilter, dateRange]);

  // Handle export functionality
  const handleExport = async () => {
    try {
      // You can implement export functionality here
      // This could generate a CSV or PDF report
      console.log('Exporting menu report...');
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  // Loading state component
  const LoadingState = () => (
    <div className="flex justify-center items-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <span className="ml-2 text-muted-foreground">Loading data...</span>
    </div>
  );

  // Error state component
  const ErrorState = ({ message }: { message: string }) => (
    <div className="text-center py-12 text-red-600">
      <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
      <p>{message}</p>
      <Button
        variant="outline"
        className="mt-4"
        onClick={() => {
          if (reportType === 'performance') {
            fetchMenuPerformance();
          } else {
            fetchCategoryPerformance();
          }
        }}
      >
        Retry
      </Button>
    </div>
  );

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Menu Performance Reports</h1>
          <p className="text-muted-foreground mt-2">
            Menu item analytics and category performance metrics
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="w-full sm:w-48">
              <label className="text-sm font-medium mb-2 block">Report Type</label>
              <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select report" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="performance">Item Performance</SelectItem>
                  <SelectItem value="categories">Category Performance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-48">
              <label className="text-sm font-medium mb-2 block">Branch</label>
              <Select value={branchFilter} onValueChange={setBranchFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Branches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  <SelectItem value="Bradford">Bradford</SelectItem>
                  <SelectItem value="Leeds">Leeds</SelectItem>
                  <SelectItem value="Darley St Market">Darley St Market</SelectItem>
                  <SelectItem value="Helifax">Helifax</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-48">
              <label className="text-sm font-medium mb-2 block">Category</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='w-full sm:w-48'>
              <label className='text-sm font-medium mb-2 block'>Date Range</label>
              <DateRangePicker date={dateRange.startDate && dateRange.endDate ? { from: new Date(dateRange.startDate), to: new Date(dateRange.endDate) } : undefined}
                onDateChange={(dateRange) => setDateRange({ startDate: dateRange.from?.toISOString(), endDate: dateRange.to?.toISOString() })}
                placeholder='Select Date Range' className='w-full' />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && <LoadingState />}

      {/* Error State */}
      {error && <ErrorState message={error} />}

      {/* Menu Performance Report */}
      {!loading && !error && reportType === 'performance' && menuPerformance && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">£{menuPerformance.totalRevenue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  From menu items
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Items Sold</CardTitle>
                <Utensils className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{menuPerformance.totalQuantity}</div>
                <p className="text-xs text-muted-foreground">
                  Items purchased
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unique Items</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{menuPerformance.totalItems}</div>
                <p className="text-xs text-muted-foreground">
                  Menu items tracked
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Top Performing Items */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Menu Items</CardTitle>
              <CardDescription>Best selling items by revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {menuPerformance.menuItems.map((item, index) => (
                  <div key={item.menuItem.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{item.menuItem.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.menuItem.category.name}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">£{item.totalRevenue.toFixed(2)}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.totalQuantity} sold • {item.ordersCount} orders
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Revenue by Item Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Menu Item</CardTitle>
              <CardDescription>Distribution of revenue across top items</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={menuPerformance.menuItems}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="menuItem.name"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => [`£${value.toFixed(2)}`, 'Revenue']}
                    labelFormatter={(label, payload) => {
                      if (payload && payload[0]) {
                        const item = payload[0].payload as MenuItemPerformance;
                        return `${item.menuItem.name} (${item.menuItem.category.name})`;
                      }
                      return label;
                    }}
                  />
                  <Legend />
                  <Bar dataKey="totalRevenue" fill="#8884d8" name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Items by Quantity Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Items by Quantity Sold</CardTitle>
              <CardDescription>Most popular items by quantity</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={menuPerformance.menuItems}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="menuItem.name"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => [value, 'Quantity']}
                    labelFormatter={(label, payload) => {
                      if (payload && payload[0]) {
                        const item = payload[0].payload as MenuItemPerformance;
                        return `${item.menuItem.name} (${item.menuItem.category.name})`;
                      }
                      return label;
                    }}
                  />
                  <Legend />
                  <Bar dataKey="totalQuantity" fill="#00C49F" name="Quantity Sold" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Category Performance Report */}
      {!loading && !error && reportType === 'categories' && categoryPerformance && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Categories</CardTitle>
                <Utensils className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{categoryPerformance.totalCategories}</div>
                <p className="text-xs text-muted-foreground">
                  Active categories
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Category Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">£{categoryPerformance.totalRevenue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  Total from categories
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg per Category</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  £{(categoryPerformance.totalRevenue / categoryPerformance.totalCategories).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Average revenue
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Category Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Category Performance</CardTitle>
              <CardDescription>Revenue and sales by category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categoryPerformance.categories.map((category, index) => (
                  <div key={category.category.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <div>
                        <div className="font-medium">{category.category.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {category.uniqueItemsCount} items • {category.itemsCount} sales
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">£{category.totalRevenue.toFixed(2)}</div>
                      <div className="text-sm text-muted-foreground">
                        {category.totalQuantity} items sold
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Revenue by Category Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Distribution by Category</CardTitle>
              <CardDescription>Percentage of total revenue by category</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryPerformance.categories}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ category, totalRevenue }) => `${category.name}: £${totalRevenue.toFixed(2)}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="totalRevenue"
                  >
                    {categoryPerformance.categories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`£${value.toFixed(2)}`, 'Revenue']} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Quantity by Category Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Quantity Sold by Category</CardTitle>
              <CardDescription>Items sold per category</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryPerformance.categories}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category.name" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => [value, 'Quantity']}
                  />
                  <Legend />
                  <Bar dataKey="totalQuantity" fill="#00C49F" name="Quantity Sold" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && (
        <>
          {reportType === 'performance' && (!menuPerformance || menuPerformance.menuItems.length === 0) && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12 text-muted-foreground">
                  <Utensils className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No menu performance data available for the selected filters.</p>
                </div>
              </CardContent>
            </Card>
          )}
          {reportType === 'categories' && (!categoryPerformance || categoryPerformance.categories.length === 0) && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12 text-muted-foreground">
                  <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No category performance data available for the selected filters.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}