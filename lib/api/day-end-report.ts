import { api } from './api';

export interface DayEndReportInput {
  expectedTotal: number;
  actualCash: number;
  branchId?: string;
}

export interface DayEndReportResponse {
  id: string;
  date: string;
  expectedTotal: number;
  actualCash: number;
  difference: number;
  ordersCount: number;
  totalSales: number;
  paymentMethods: Array<{
    method: string;
    amount: number;
    count: number;
  }>;
  branchId?: string;
  createdAt: string;
  updatedAt: string;
}

export const dayEndReportApi = {
  // Generate a new day end report
  generateReport: async (data: DayEndReportInput): Promise<DayEndReportResponse> => {
    const response = await api.post('/api/reports/day-end', data);
    return response.data;
  },

  // Get a specific day end report by ID
  getReport: async (id: string): Promise<DayEndReportResponse> => {
    const response = await api.get(`/api/reports/day-end/${id}`);
    return response.data;
  },

  // List all day end reports with pagination
  listReports: async (params?: {
    startDate?: string;
    endDate?: string;
    branchId?: string;
    page?: number;
    pageSize?: number;
  }) => {
    const response = await api.get('/api/reports/day-end', { params });
    return response.data;
  }
};
