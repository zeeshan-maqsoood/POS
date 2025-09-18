'use client';
// @ts-nocheck

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Order, OrderStatus, orderApi, PaymentMethod, type PaymentStatus as TPaymentStatus } from '@/lib/order-api';
import PermissionGate from '@/components/auth/permission-gate';
import { WithPermission } from '@/components/auth/with-permission';

// Define PaymentStatus enum to match the one in order-api.ts
const PaymentStatus = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED'
} as const;
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

interface OrderStats {
  totalOrders: number;
  totalRevenue: number;
  ordersByStatus: Record<OrderStatus, number>;
  recentOrders: Order[];
  revenueByStatus: Record<OrderStatus, number>;
  paymentStatus: Record<string, number>;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<OrderStatus | 'ALL'>('ALL');

  useEffect(() => {
    fetchOrders();
    fetchStats();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await orderApi.getOrders({
        status: activeTab === 'ALL' ? undefined : activeTab,
        page: 1,
        pageSize: 100, // Adjust based on your needs
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
      const payload: any = response.data;
      // Support both shapes: { data: Order[] } and { data: { data: Order[] } }
      const list = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.data?.data)
          ? payload.data.data
          : [];
      console.log('orders payload parsed', list);
      setOrders(list);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await orderApi.getStats();
      const payload: any = response.data;
      // Support both shapes: { data: Stats } and { data: { data: Stats } }
      const statsData = payload?.data?.data ?? payload?.data ?? null;
      console.log('stats payload parsed', statsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching stats:', error);
      
      // Fallback to calculating from orders if stats endpoint fails
      try {
        const response = await orderApi.getOrders({
          page: 1,
          pageSize: 1000, // Get enough data for stats
          sortBy: 'createdAt',
          sortOrder: 'desc'
        });

        // The response contains data and meta properties
        const opayload: any = response?.data;
        const allOrders = Array.isArray(opayload?.data)
          ? opayload.data
          : Array.isArray(opayload?.data?.data)
            ? opayload.data.data
            : [];
        
        // Calculate stats - only include paid orders in revenue
        const totalOrders = allOrders.length;
        const totalRevenue = allOrders
          .filter((order: Order) => order.paymentStatus === 'PAID')
          .reduce((sum: number, order: Order) => sum + order.total, 0);
        const ordersByStatus = {} as Record<OrderStatus, number>;
        const revenueByStatus = {} as Record<OrderStatus, number>;
        const paymentStatus = {} as Record<string, number>;

        // Initialize all statuses with 0
        Object.values(OrderStatus).forEach(status => {
          ordersByStatus[status] = 0;
          revenueByStatus[status] = 0;
        });

        // Count orders and sum revenue by status
        allOrders.forEach((order: Order) => {
          // Count orders by status
          const status = order.status as OrderStatus;
          ordersByStatus[status] = (ordersByStatus[status] || 0) + 1;
          
          // Only include paid orders in revenue calculations
          if (order.paymentStatus === 'PAID') {
            // Sum revenue by status for paid orders only
            revenueByStatus[status] = (revenueByStatus[status] || 0) + order.total;
          }
          
          // Count payment status
          const paymentStatusValue = order.paymentStatus as string;
          paymentStatus[paymentStatusValue] = (paymentStatus[paymentStatusValue] || 0) + 1;
        });

        setStats({
          totalOrders: allOrders.length,
          totalRevenue,
          ordersByStatus,
          revenueByStatus,
          paymentStatus,
          recentOrders: allOrders.slice(0, 5), // Get first 5 as recent
        });
      } catch (err) {
        console.error('Error calculating stats from orders:', err);
      }
    }
  };
console.log(stats,"stats")
  const updateOrderStatus = async (orderId: string, status: OrderStatus, notes?: string) => {
    try {
      await orderApi.updateStatus(orderId, status, notes);
      await Promise.all([fetchOrders(), fetchStats()]);
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error; // Re-throw to handle in the UI if needed
    }
  };
  console.log(orders,"orders")
  const filteredOrders = activeTab === 'ALL' 
    ? orders 
    : orders.filter(order => order.status === activeTab);

    console.log(filteredOrders,"filteredOrders")
  if (loading || !orders) {
    return (
      <div className="container mx-auto p-4">
        <Skeleton className="h-8 w-1/4 mb-4" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-12 w-full my-4" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <WithPermission requiredPermission="ORDER_READ" redirectTo="/unauthorized">
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Orders Management</h1>
        <PermissionGate required="ORDER_READ">
          <Button onClick={() => {
            fetchOrders();
            fetchStats();
          }} variant="outline">
            Refresh
          </Button>
        </PermissionGate>
      </div>
      
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatsCard 
            title="Total Orders" 
            value={String(stats.totalOrders ?? 0)} 
            description="All time orders"
          />
          <StatsCard 
            title="Total Revenue" 
            value={`£${(stats.totalRevenue ?? 0).toFixed(2)}`}
            description="Total revenue from all orders"
          />
          <StatsCard 
            title="Pending Orders" 
            value={String(stats.ordersByStatus?.PENDING ?? 0)} 
            description="Orders awaiting processing"
          />
          <StatsCard 
            title="Completed Orders" 
            value={String(stats.ordersByStatus?.COMPLETED ?? 0)} 
            description="Successfully completed orders"
          />
        </div>
      )}

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all" onClick={() => setActiveTab('ALL')}>All Orders</TabsTrigger>
          {Object.entries(OrderStatus || {}).map(([key, value]) => (
            <TabsTrigger 
              key={key} 
              value={key}
              onClick={() => setActiveTab(value as OrderStatus)}
            >
              {value}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab === 'ALL' ? 'all' : activeTab} className="space-y-4">
  {filteredOrders.length > 0 ? (
    <OrderList 
      orders={filteredOrders} 
      onStatusUpdate={updateOrderStatus}
      onPaymentStatusUpdate={async (orderId, paymentStatus, paymentMethod) => {
        try {
          await orderApi.updatePaymentStatus(orderId, paymentStatus, paymentMethod);
          // Refresh orders and stats
          await Promise.all([fetchOrders(), fetchStats()]);
        } catch (error) {
          console.error('Error updating payment status:', error);
        }
      }} 
    />
  ) : (
    <div className="text-center py-12 border rounded-lg">
      <p className="text-muted-foreground">No orders found</p>
      <Button 
        variant="outline" 
        className="mt-4"
        onClick={() => setActiveTab('ALL')}
      >
        View All Orders
      </Button>
    </div>
  )}
</TabsContent>
      </Tabs>
    </div>
    </WithPermission>
  );
}

function StatsCard({ title, value, description }: { title: string; value: string; description: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

interface OrderListProps {
  orders: Order[];
  onStatusUpdate: (orderId: string, status: OrderStatus) => void;
  onPaymentStatusUpdate: (orderId: string, paymentStatus: TPaymentStatus, paymentMethod: PaymentMethod) => Promise<void>;
}

function OrderList({ orders, onStatusUpdate, onPaymentStatusUpdate }: OrderListProps) {
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const statusOptions = Object.values(OrderStatus).map((status) => ({
    value: status,
    label: status.charAt(0) + status.slice(1).toLowerCase(),
  }));

  const handleStatusUpdate = async (orderId: string, status: OrderStatus) => {
    try {
      setUpdatingOrderId(orderId);
      setError(null);
      await onStatusUpdate(orderId, status);
    } catch (err) {
      setError('Failed to update order status. Please try again.');
      console.error('Status update error:', err);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.COMPLETED:
        return 'bg-green-100 text-green-800';
      case OrderStatus.CANCELLED:
      case OrderStatus.REFUNDED:
        return 'bg-red-100 text-red-800';
      case OrderStatus.PROCESSING:
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getPaymentMethodLabel = (method: PaymentMethod) => {
    return method.split('_')
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
          {error}
        </div>
      )}
      {orders.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No orders found
        </div>
      ) : (
        orders.map((order) => (
        <Card key={order.id}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <div>
                <h3 className="font-semibold">
                  Order #{order.orderNumber || `#${order.id.slice(0, 8).toUpperCase()}`}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {order.customerName || 'Guest'}
                  {order.tableNumber && ` • Table ${order.tableNumber}`}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-medium">£{order.total.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(order.createdAt), 'MMM d, yyyy h:mm a')}
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(order.status)}`}>
                    {order.status.charAt(0) + order.status.slice(1).toLowerCase()}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <PermissionGate required="ORDER_UPDATE" disableInsteadOfHide>
                    <select
                      value={order.paymentStatus}
                      onChange={(e) => onPaymentStatusUpdate(order.id, e.target.value as TPaymentStatus, order.paymentMethod)}
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        order.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' :
                        order.paymentStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      } border-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                    >
                      {Object.values(PaymentStatus).map((status) => (
                        <option key={status} value={status} className="bg-white text-gray-900">
                          {status}
                        </option>
                      ))}
                    </select>
                  </PermissionGate>
                  <PermissionGate required="ORDER_UPDATE" disableInsteadOfHide>
                    <select
                      value={order.paymentMethod}
                      onChange={(e) => onPaymentStatusUpdate(order.id, order.paymentStatus, e.target.value as PaymentMethod)}
                      className="ml-2 px-2 py-1 text-xs border rounded-md bg-white text-gray-900"
                    >
                      {Object.values(PaymentMethod).map((method) => (
                        <option key={method} value={method}>
                          {method.replace('_', ' ')}
                        </option>
                      ))}
                    </select>
                  </PermissionGate>
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t mt-2">
                <span className="text-sm font-medium">Update Status</span>
                <PermissionGate required="ORDER_UPDATE" disableInsteadOfHide>
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusUpdate(order.id, e.target.value as OrderStatus)}
                    disabled={updatingOrderId === order.id}
                    className="text-sm border rounded px-2 py-1 bg-background disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updatingOrderId === order.id && (
                      <option value="">Updating...</option>
                    )}
                    {statusOptions.filter(opt => opt.value !== order.status).map((option) => {
                      // Don't allow changing to REFUNDED status directly
                      if (option.value === OrderStatus.REFUNDED) return null;
                      return (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      );
                    })}
                  </select>
                </PermissionGate>
              </div>

              <div className="pt-3 border-t mt-3">
                <h4 className="text-sm font-medium mb-2">Order Details</h4>
                <div className="space-y-2">
                  {order.items?.map((item, index) => (
                    <div key={`${item.menuItemId}-${index}`} className="flex justify-between text-sm">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.quantity} × £{item.price?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                      <span className="font-medium">
                        £{((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 pt-3 border-t space-y-1">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>£{order.subtotal?.toFixed(2) || '0.00'}</span>
                  </div>
                  {order.discount ? (
                    <div className="flex justify-between text-rose-600">
                      <span>Discount</span>
                      <span>£{order.discount.toFixed(2)}</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>£{order.tax?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between font-semibold pt-2 mt-2 border-t">
                    <span>Total</span>
                    <span>£{order.total?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>
{/*                 
                <div className="mt-4 pt-3 border-t text-xs text-muted-foreground">
                  <p>Ordered: {format(new Date(order.createdAt), 'MMM d, yyyy h:mm a')}</p>
                  {order.assignedToId && (
                    <p>Assigned to: Staff ID {order.assignedToId}</p>
                  )}
                  {order.notes && !order.notes.startsWith('branchName:') && (
                    <p className="mt-1">Notes: {order.notes}</p>
                  )}
                </div> */}
              </div>
            </div>
          </CardContent>
        </Card>
      )))}
    </div>
  );
}
