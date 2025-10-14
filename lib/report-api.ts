import api from '@/utils/api';

// Types for reports
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  statusCode: number;
}
export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  cost: number;
  minStock: number;
  maxStock: number;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  category: {
    name: string;
  };
}
export interface InventoryMetrics {
  totalItems: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
  totalValue: number;
  itemsByCategory: Array<{
    name: string;
    _count: { items: number };
  }>;
}

export interface InventoryStatusResponse {
  inventory: InventoryItem[];
  metrics: InventoryMetrics;
}
export interface EnhancedSalesOverview {
  // Core metrics
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  totalSubtotal: number;
  totalTax: number;
  totalDiscount: number;
  
  // Enhanced metrics
  growthRate: number;
  previousPeriodRevenue: number;
  profitMargin: number;
  netProfit: number;
  
  // Customer metrics
  uniqueCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  revenuePerCustomer: number;
  avgCustomerVisits: number;
  visitFrequency: number;
  
  // Product metrics
  topProducts: TopProduct[];
  
  // Time metrics
  salesByHour: HourlySales[];
  peakHours: PeakHours;
  dailySales: DailySales[];
  
  // Staff metrics
  topStaff: StaffPerformance[];
  
  // Efficiency metrics
  efficiencyScore: number;
  successRate: number;
  conversionRate?: number;
  retentionRate?: number;
  avgServingTime?: number;
  tableTurnover?: number;
  wastePercentage?: number;
  ordersPerHour?: number;
  avgOrdersPerDay?: number;
  
  // Comparison data
  comparisonChart: ComparisonData[];
  
  // Real-time metrics
  ordersToday?: number;
  revenueToday?: number;
  customersToday?: number;
  avgServiceTime?: number;
  
  // Original data structures
  ordersByStatus: any[];
  ordersByType: any[];
  paymentMethods: any[];
}

export interface TopProduct {
  id: string;
  name: string;
  category: string;
  revenue: number;
  quantity: number;
}

export interface HourlySales {
  hour: string;
  revenue: number;
  orders: number;
}

export interface PeakHours {
  busiestHour: string;
  busiestHourSales: number;
  busiestHourOrders: number;
  quietestHour: string;
  quietestHourSales: number;
  quietestHourOrders: number;
  peakToQuietRatio: number;
}

export interface StaffPerformance {
  id: string;
  name: string;
  role: string;
  orders: number;
  revenue: number;
}

export interface ComparisonData {
  date: string;
  current: number;
  previous: number;
}

export interface DailySales {
  date: string;
  revenue: number;
}

export interface LowStockAlert {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  minStock: number;
  status: 'LOW_STOCK' | 'OUT_OF_STOCK';
  urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  category: { name: string };
  needsRestock: boolean;
  restockQuantity: number;
}
export interface LowStockAlertsResponse {
  [x: string]: any;
  error: any;
  data: any;
  alerts: LowStockAlert[];
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  totalAlerts: number;
}
export interface InventoryTransaction {
  id: string;
  type: 'INCOMING' | 'OUTGOING';
  quantity: number;
  reason: string;
  createdAt: string;
  inventoryItem: {
    name: string;
    category: { name: string };
  };
}
export interface InventoryTransactionsResponse {
  loading: any;
  error: any;
  data: any;
  transactions: InventoryTransaction[];
  summary: Array<{
    type: string;
    _count: { _all: number };
    _sum: { quantity: number };
  }>;
  totalTransactions: number;
}

export interface SalesOverview {
  totalOrders: number;
  totalRevenue: number;
  totalSubtotal: number;
  totalTax: number;
  avgOrderValue: number;
  ordersByStatus: Array<{
    status: string;
    _count: { _all: number };
    _sum: { total: number };
  }>;
  ordersByType: Array<{
    orderType: string;
    _count: { _all: number };
    _sum: { total: number };
  }>;
  paymentMethods: Array<{
    paymentMethod: string;
    _count: { _all: number };
    _sum: { total: number };
  }>;
  dailySales: Array<{
    date: string;
    revenue: number;
  }>;
}

export interface OrderReport {
  metrics: {
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    pendingOrders: number;
    totalRevenue: number;
    avgOrderValue: number;
  };
  orders: Array<{
    id: string;
    orderNumber: string;
    createdAt: string;
    status: string;
    orderType: string;
    items: any[];
    total: number;
  }>;
}

export interface PaymentReport {
  paymentSummary: Array<{
    paymentMethod: string;
    _count: { _all: number };
    _sum: { total: number };
  }>;
  paymentStatusSummary: Array<{
    paymentStatus: string;
    _count: { _all: number };
    _sum: { total: number };
  }>;
  totalTransactions: number;
  totalAmount: number;
}

export interface ReportParams {
  startDate?: string;
  endDate?: string;
  branchName?: string;
  status?: string;
  paymentMethod?: string;
  categoryId?: string;
  type?: string;
}
// Time Analytics Types
export interface TimeAnalyticsData {
  salesByHour: Array<{
    hour: string;
    sales: number;
    orders: number;
    avgOrderValue: number;
  }>;
  salesByDay: Array<{
    day: string;
    sales: number;
    orders: number;
    avgOrderValue: number;
  }>;
  peakHours: {
    busiestHour: string;
    busiestHourSales: number;
    busiestHourOrders: number;
    quietestHour: string;
    quietestHourSales: number;
    quietestHourOrders: number;
    peakToQuietRatio: number;
  };
  customerBehavior: {
    avgVisitDuration: string;
    peakWaitTime: string;
    avgWaitTime: string;
    tableTurnoverRate: string;
  };
  productPerformance: any[];
  staffPerformance: any[];
}
// Reports API
export const reportApi = {
  // Sales Overview
  getSalesOverview: (params?: ReportParams) => 
    api.get<ApiResponse<SalesOverview>>('/reports/sales/overview', { params }),

  // Order Reports
  getOrderReports: (params?: ReportParams) => 
    api.get<ApiResponse<OrderReport>>('/reports/sales/orders', { params }),

  // Payment Reports
  getPaymentReports: (params?: ReportParams) => 
    api.get<ApiResponse<PaymentReport>>('/reports/sales/payments', { params }),

  // Inventory Reports
  getInventoryStatus: (params?: ReportParams) => 
    api.get<ApiResponse<InventoryStatusResponse>>('/reports/inventory/status', { params }),

  getInventoryTransactions: (params?: ReportParams) => 
    api.get<ApiResponse<InventoryTransactionsResponse>>('/reports/inventory/transactions', { params }),

  getLowStockAlerts: (params?: ReportParams) => 
    api.get<ApiResponse<LowStockAlertsResponse>>('/reports/inventory/alerts', { params }),


  // Menu Reports
  getMenuPerformance: (params?: ReportParams) => 
    api.get<ApiResponse<any>>('/reports/menu/performance', { params }),

  getCategoryPerformance: (params?: ReportParams) => 
    api.get<ApiResponse<any>>('/reports/menu/categories', { params }),

  // Branch Reports
  getBranchPerformance: (params?: ReportParams) => 
    api.get<ApiResponse<any>>('/reports/branch/performance', { params }),

  getBranchComparison: (params?: ReportParams) => 
    api.get<ApiResponse<any>>('/reports/branch/comparison', { params }),

  // Staff Reports
  getStaffPerformance: (params?: ReportParams) => 
    api.get<ApiResponse<any>>('/reports/staff/performance', { params }),

  getStaffActivity: (params?: ReportParams) => 
    api.get<ApiResponse<any>>('/reports/staff/activity', { params }),
  
  // Financial Reports
  getRevenueReports: (params?: ReportParams) => 
    api.get<ApiResponse<any>>('/reports/financial/revenue', { params }),
  
  getTaxReports: (params?: ReportParams) => 
    api.get<ApiResponse<any>>('/reports/financial/taxes', { params }),
  
  // Dashboard Overview
  getDashboardOverview: (params?: ReportParams) => 
    api.get<ApiResponse<any>>('/reports/dashboard/overview', { params }),

  // Time Analytics
  getTimeAnalytics: (params?: ReportParams) => 
    api.get<ApiResponse<any>>('/reports/time-analytics', { params }),

  getSalesByHour: (params?: ReportParams) => 
    api.get<ApiResponse<any>>('/reports/time-analytics/sales-by-hour', { params }),

  getPeakHoursAnalysis: (params?: ReportParams) => 
    api.get<ApiResponse<any>>('/reports/time-analytics/peak-hours', { params }),
  
  getCustomerBehaviorAnalytics: (params?: ReportParams) => 
    api.get<ApiResponse<any>>('/reports/time-analytics/customer-behavior', { params }),

  getProductPerformanceByTime: (params?: ReportParams) => 
    api.get<ApiResponse<any>>('/reports/time-analytics/product-performance', { params }),

  getStaffPerformanceByTime: (params?: ReportParams) => 
    api.get<ApiResponse<any>>('/reports/time-analytics/staff-performance', { params }),
   getEnhancedSalesOverview: (params: ReportParams) => 
    api.get<ApiResponse<EnhancedSalesOverview>>('/reports/sales/enhanced-overview', { params }),
};

export default reportApi;