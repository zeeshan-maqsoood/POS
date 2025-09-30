import { DateRange } from 'react-day-picker';
import { subDays } from 'date-fns';
import { getToken } from '../utils/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface AnalyticsResponse {
  summary: {
    totalOrders: number;
    totalRevenue: number;
    avgOrderValue: number;
  };
  salesData: Array<{
    date: string;
    orders: number;
    revenue: number;
  }>;
  ordersByType: Array<{
    type: string;
    value: number;
  }>;
  ordersByStatus: Array<{
    status: string;
    value: number;
  }>;
  revenueByPayment: Array<{
    method: string;
    value: number;
  }>;
  revenueByBranch: Array<{
    branch: string;
    revenue: number;
  }>;
  bestSellingItems: Array<{
    name: string;
    sales: number;
  }>;
  ordersByDay: Array<{
    day: string;
    orders: number;
  }>;
  popularModifiers: Array<{
    name: string;
    count: number;
  }>;
  peakHours: Array<{
    hour: string;
    count: number;
    percentage: number;
  }>;
}

export const fetchAnalytics = async (dateRange: DateRange, branch?: string): Promise<AnalyticsResponse> => {
  const params = new URLSearchParams();
  const from = dateRange.from || subDays(new Date(), 30);
  const to = dateRange.to || new Date();
  
  params.append('from', from.toISOString());
  params.append('to', to.toISOString());
  
  if (branch) {
    params.append('branch', branch);
  }

  try {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/analytics?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to fetch analytics');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching analytics:', error);
    throw error;
  }

  const response = await fetch(`${API_BASE_URL}/analytics?${params.toString()}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to fetch analytics');
  }

  return response.json();
};

export const exportAnalyticsToPDF = async (dateRange: DateRange, branch?: string) => {
  const params = new URLSearchParams();
  
  if (dateRange.from) {
    params.append('from', dateRange.from.toISOString());
  }
  
  if (dateRange.to) {
    params.append('to', dateRange.to.toISOString());
  }
  
  if (branch) {
    params.append('branch', branch);
  }

  const response = await fetch(`${API_BASE_URL}/analytics/export?${params.toString()}`, {
    credentials: 'include',
    headers: {
      'Accept': 'application/pdf',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to export analytics');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `analytics-${new Date().toISOString().split('T')[0]}.pdf`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  a.remove();
};
