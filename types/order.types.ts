import { OrderStatus, PaymentStatus } from "@prisma/client";

export interface OrderStats {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  ordersByStatus: Record<OrderStatus, number>;
  revenueByStatus: Record<OrderStatus, number>;
  paymentStatus: Record<PaymentStatus, number>;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    status: OrderStatus;
    total: number;
    customerName: string | null;
    createdAt: Date;
  }>;
}

export interface UpdateOrderStatusData {
  orderId: string;
  status: OrderStatus;
}
