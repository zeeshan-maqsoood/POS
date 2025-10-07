// POS_Admin_Panel/lib/api/reports.ts
import api from './api';

export const getSalesReport = async (params: {
  from?: string;
  to?: string;
  groupBy?: 'day' | 'week' | 'month';
  branchName?: string;
}) => {
  const response = await api.get<{ data: any }>(`/reports/sales`, { params });
  return response.data;
};

export const getOrderAnalysis = async (params: {
  from?: string;
  to?: string;
  branchName?: string;
}) => {
  const response = await api.get<{ data: any }>(`/reports/orders/analysis`, { params });
  return response.data;
};

export const getMenuPerformance = async (params: {
  from?: string;
  to?: string;
  branchName?: string;
}) => {
  const response = await api.get<{ data: any }>(`/reports/menu/performance`, { params });
  return response.data;
};

export const getStaffPerformance = async (params: {
  from?: string;
  to?: string;
  branchName?: string;
}) => {
  const response = await api.get<{ data: any }>(`/reports/staff/performance`, { params });
  return response.data;
};

export const getFinancialSummary = async (params: {
  from?: string;
  to?: string;
  branchName?: string;
}) => {
  const response = await api.get<{ data: any }>(`/reports/financial/summary`, { params });
  return response.data;
};