import api from '@/utils/api';

// Types
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  statusCode: number;
}

export interface Printer {
  id: string;
  name: string;
  type: 'KITCHEN' | 'BAR' | 'RECEIPT' | 'REPORT' | 'LABEL' | 'OTHER';
  connectionType: 'NETWORK' | 'USB' | 'BLUETOOTH' | 'CLOUD';
  ipAddress?: string;
  port?: number;
  macAddress?: string;
  apiKey?: string;
  isActive: boolean;
  isDefault: boolean;
  branchId?: string;
  branchName?: string;
  restaurantId: string;
  createdAt: string;
  updatedAt: string;
  paperWidth?: number;
  paperDensity?: number;
  autoCut?: boolean;
  openCashDrawer?: boolean;
  printLogo?: boolean;
  printHeader?: string;
  printFooter?: string;
  status?: 'ONLINE' | 'OFFLINE' | 'ERROR';
  lastStatusCheck?: string;
  errorMessage?: string;
}

export interface PrintJob {
  id: string;
  printerId: string;
  type: 'ORDER' | 'RECEIPT' | 'REPORT' | 'LABEL' | 'OTHER';
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'RETRY';
  content: string;
  errorMessage?: string;
  retryCount: number;
  maxRetries: number;
  printedAt?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

export interface PrinterStats {
  totalPrinters: number;
  activePrinters: number;
  jobs: {
    pending: number;
    processing: number;
    failed: number;
    completed: number;
  };
  printerTypes: Record<string, number>;
  lastUpdated: string;
}

// Request and response types
export type CreatePrinterRequest = {
  body: {
    name: string;
    description?: string;
    type: 'KITCHEN' | 'BAR' | 'RECEIPT' | 'REPORT' | 'LABEL' | 'OTHER';
    connectionType: 'NETWORK' | 'USB' | 'BLUETOOTH' | 'CLOUD' | 'SERIAL';
    ipAddress?: string;
    port?: number;
    devicePath?: string;
    paperSize?: string;
    characterPerLine?: number;
    autoCut?: boolean;
    openCashDrawer?: boolean;
    printLogo?: boolean;
    branchId: string;
    isActive?: boolean;
  };
};

export type UpdatePrinterRequest = {
  body: Partial<CreatePrinterRequest['body']> & {
    status?: 'ONLINE' | 'OFFLINE' | 'ERROR' | 'MAINTENANCE';
  };
};

// Printer API
export const printerApi = {
  // ==================== PRINTER MANAGEMENT ====================
  create: async (data: CreatePrinterRequest) => {
    // Ensure the data is properly structured with a 'body' property
    const requestData = data.body ? data : { body: data };
    console.log('Sending printer create request:', requestData);
    const response = await api.post<ApiResponse<Printer>>('/printers', requestData);
    return response.data;
  },

  list: async (params?: any) => {
    const response = await api.get<ApiResponse<Printer[]>>('/printers', { params });
    return response.data;
  },

  get: async (id: string) => {
    const response = await api.get<ApiResponse<Printer>>(`/printers/${id}`);
    return response.data;
  },

  update: async (id: string, data: UpdatePrinterRequest) => {
    const response = await api.put<ApiResponse<Printer>>(`/printers/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete<ApiResponse<null>>(`/printers/${id}`);
    return response.data;
  },

  updateStatus: async (id: string, isActive: boolean) => {
    const response = await api.put<ApiResponse<Printer>>(`/printers/${id}/status`, { 
      body: { isActive } 
    });
    return response.data;
  },

  getStats: async () => {
    const response = await api.get<ApiResponse<PrinterStats>>('/printers/stats');
    return response.data;
  },

  // ==================== PRINT OPERATIONS ====================
  testPrint: async (id: string) => {
    const response = await api.post<ApiResponse<{ success: boolean }>>(`/printers/${id}/test`);
    return response.data;
  },

  printOrder: async (orderData: any) => {
    const response = await api.post<ApiResponse<{ jobId: string }>>('/print/order', orderData);
    return response.data;
  },

  printReport: async (reportData: any) => {
    const response = await api.post<ApiResponse<{ jobId: string }>>('/print/report', reportData);
    return response.data;
  },

  // ==================== PRINT JOB MANAGEMENT ====================
  getPrintJobs: async (printerId: string, params?: any) => {
    const response = await api.get<ApiResponse<PrintJob[]>>(`/printers/${printerId}/jobs`, { params });
    return response.data;
  },

  getPrintQueue: async (params?: any) => {
    const response = await api.get<ApiResponse<PrintJob[]>>('/print/queue', { params });
    return response.data;
  },

  markJobPrinted: async (jobId: string) => {
    const response = await api.put<ApiResponse<PrintJob>>(`/print/jobs/${jobId}/printed`);
    return response.data;
  },

  retryFailedJobs: async (printerId: string) => {
    const response = await api.post<ApiResponse<{ count: number }>>(`/printers/${printerId}/retry-jobs`);
    return response.data;
  },

  clearOldJobs: async (days: number = 7) => {
    const response = await api.delete<ApiResponse<{ count: number }>>('/print/jobs/clear-old', { 
      params: { days } 
    });
    return response.data;
  },
};

export default printerApi;
