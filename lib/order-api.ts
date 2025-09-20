import api from "@/utils/api";

// Types
export type OrderType = 'DINE_IN' | 'TAKEOUT' | 'DELIVERY';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export interface OrderItemInput {
  menuItemId: string;
  quantity: number;
  name?: string;
  price?: number;
}

export interface OrderItem extends OrderItemInput {
  name: string;
  price: number;
  menuItemId: string;
  quantity: number;
}

export interface CreateOrderInput {
  tableNumber?: string | null;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  items: OrderItemInput[];
  paymentMethod: PaymentMethod;
  branchName?: string | null;
  subtotal: number;
  tax: number;
  total: number;
  orderType?: OrderType;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  discount?: number;
  notes?: string | null;
}

export enum PaymentMethod {
  CASH = "CASH",
  CARD = "CARD",
  MOBILE_PAYMENT = "MOBILE_PAYMENT",
  OTHER = "OTHER",
}

export enum OrderStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export interface Order {
  id: string;
  orderNumber: string;
  orderType: OrderType;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  tableNumber: string | null;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  notes: string | null;
  branch?: {
    id: string;
    name: string;
  };
  items: OrderItem[];
  payments?: any[];
  createdById?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderStats {
  totalOrders: number;
  totalRevenue: number;
  ordersByStatus: Record<OrderStatus, number>;
  revenueByStatus: Record<OrderStatus, number>;
  paymentStatus: Record<string, number>;
  recentOrders: Order[];
}

interface GetOrdersParams {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  orderType?: OrderType;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const orderApi = {
  // Get all orders with optional filters and pagination
  getOrders: (params?: GetOrdersParams) => {
    const queryParams = {
      ...params,
      page: params?.page || 1,
      pageSize: params?.pageSize || 10,
      sortBy: params?.sortBy || 'createdAt',
      sortOrder: params?.sortOrder || 'desc',
    };
    
    return api.get<{
      data: Order[];
      meta: {
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
      };
    }>('/orders', { params: queryParams });
  },

  // Get a single order by ID
  getOrder: (id: string) => api.get<{ data: Order }>(`/orders/${id}`),

  // Create a new order
  createOrder: (data: CreateOrderInput) => api.post<{ data: Order }>('/orders', data),

  // Update an order
  updateOrder: (id: string, data: Partial<Order>) => 
    api.put<{ data: Order }>(`/orders/${id}`, data),

  // Delete an order
  deleteOrder: (id: string) => api.delete(`/orders/${id}`),

  // Update order status with optional notes
  updateStatus: (id: string, status: OrderStatus, notes?: string) =>
    api.put<{ data: Order }>(`/orders/${id}/status`, { status, notes }),

  // Get order statistics for dashboard
  getStats(params?: { startDate?: string; endDate?: string }) {
    return api.get<{ data: OrderStats }>('/orders/stats', { params });
  },

  // Update payment status and method
  updatePaymentStatus(id: string, paymentStatus: PaymentStatus, paymentMethod: PaymentMethod) {
    return api.put<{ data: Order }>(`/orders/${id}/payment-status`, {
      paymentStatus,
      paymentMethod
    });
  },

  // Get orders by status with pagination (convenience method)
  getOrdersByStatus: (status: OrderStatus, page: number = 1, pageSize: number = 10) => 
    orderApi.getOrders({ 
      status, 
      page, 
      pageSize,
      sortBy: 'createdAt',
      sortOrder: 'desc' 
    }),
};

export default orderApi;