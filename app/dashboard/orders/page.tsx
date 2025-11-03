'use client';
// @ts-nocheck

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Order, OrderStatus, orderApi, PaymentMethod, type PaymentStatus as TPaymentStatus } from '@/lib/order-api';
import { useRouter } from 'next/navigation';
import PermissionGate from '@/components/auth/permission-gate';
import { WithPermission } from '@/components/auth/with-permission';
import { usePermissions } from '@/hooks/use-permissions';
import { restaurantApi, Restaurant } from '@/lib/restaurant-api';
import { branchApi, Branch } from '@/lib/branch-api';
import { User } from '@/types/user';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Define PaymentStatus enum to match the one in order-api.ts
const PaymentStatus = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED'
} as const;
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { OrderPrintView } from '@/components/orders/order-print-view';

interface OrderStats {
  totalOrders: number;
  totalRevenue: number;
  ordersByStatus: Record<OrderStatus, number>;
  revenueByStatus: Record<OrderStatus, number>;
  paymentStatus: Record<string, number>;
  recentOrders: Order[];
  completedOrders: number;
  pendingOrders: number;
  processingOrders: number;
}
export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<OrderStatus | 'ALL'>('ALL');
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>('all');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [filteredBranches, setFilteredBranches] = useState<Branch[]>([]);
  const [restaurantsLoaded, setRestaurantsLoaded] = useState(false);
  const [orderToPrint, setOrderToPrint] = useState<Order | null>(null);
  const { hasRole, user } = usePermissions();
  const router = useRouter();
  const isKitchenStaff = hasRole('KITCHEN_STAFF');
  const isManager = hasRole('MANAGER');
  const userBranch = user?.branchId || user?.branch; // Get the user's branch from the auth context

  const handleEditOrder = (order: Order) => {
    const timeStamp = Date.now()
    router.push(`/pos?editOrderId=${order.id}&t=${timeStamp}`);
  };

  const handleAfterPrint = () => {
    setOrderToPrint(null);
  };

  // Fetch restaurants and branches on component mount
  useEffect(() => {
    const loadRestaurantsAndBranches = async () => {
      setLoading(true);
      try {
        let restaurantsData: Restaurant[] = [];
        
        if (isManager) {
          // For managers, only show their restaurant
          const restaurantId = user?.restaurantId || (user as any)?.restaurant?.id;
          if (restaurantId) {
            const restaurantResponse = await restaurantApi.getRestaurantById(restaurantId);
            const managerRestaurant = restaurantResponse.data?.data || restaurantResponse.data;
            if (managerRestaurant) {
              restaurantsData = [managerRestaurant];
              setSelectedRestaurant(managerRestaurant.id);
              
              // If manager has a branch, set it
              const branchId = user?.branchId || (user as any)?.branch?.id || (user as any)?.branch;
              if (branchId) {
                const branchResponse = await branchApi.getBranchById(branchId);
                const managerBranch = branchResponse.data?.data || branchResponse.data;
                if (managerBranch) {
                  setFilteredBranches([managerBranch]);
                  setSelectedBranch(managerBranch.id);
                }
              }
            }
          }
        } else {
          // For admins, load all active restaurants
          const restaurantsResponse = await restaurantApi.getActiveRestaurants();
          restaurantsData = restaurantsResponse.data?.data || restaurantsResponse.data || [];
          // For admins, we don't need to wait for branches to be loaded
          // as we'll handle that in a separate effect
          setSelectedRestaurant('all');
        }
        
        console.log('Loaded restaurants:', restaurantsData);
        setRestaurants(restaurantsData);
        setRestaurantsLoaded(true);
        
      } catch (error) {
        console.error('Error loading restaurants:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRestaurantsAndBranches();
  }, [isManager, user]);

  // Fetch branches when restaurant selection changes (only for admins)
  useEffect(() => {
    if (restaurantsLoaded && !isManager) {
      console.log('Restaurant changed to:', selectedRestaurant);
      
      // Only fetch branches if a specific restaurant is selected
      if (selectedRestaurant !== 'all') {
        setLoading(true);
        fetchBranchesForRestaurant(selectedRestaurant)
          .catch(error => {
            console.error('Error fetching branches:', error);
          })
          .finally(() => {
            setLoading(false);
          });
      } else {
        // If 'all' is selected, clear branches
        setFilteredBranches([]);
        setSelectedBranch('all');
      }
    }
  }, [selectedRestaurant, restaurantsLoaded, isManager]);

  // const fetchOrders = async () => {
  //   try {
  //     // Only pass branch if user is not admin
  //     const branch = (isManager || isKitchenStaff) ? userBranch : undefined;

  //     const response = await orderApi.getOrders({
  //       status: activeTab === 'ALL' ? undefined : activeTab,
  //       branchName: branch,
  //       page: 1,
  //       pageSize: 100, // Adjust based on your needs
  //       sortBy: 'createdAt',
  //       sortOrder: 'desc'
  //     });
  //     const payload: any = response.data;
  //     // Support both shapes: { data: Order[] } and { data: { data: Order[] } }
  //     const list = Array.isArray(payload?.data)
  //       ? payload.data
  //       : Array.isArray(payload?.data?.data)
  //         ? payload.data.data
  //         : [];
  //     console.log('orders payload parsed', list);
  //     setOrders(list);
  //   } catch (error) {
  //     console.error('Error fetching orders:', error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };
  const fetchOrders = async (status?: OrderStatus | 'ALL') => {
    try {
      let branchName: string | undefined;
      
      if (selectedBranch !== 'all') {
        const branch = filteredBranches.find(branch => branch.id === selectedBranch);
        branchName = branch?.name;
        
        // If we have a selected branch but couldn't find its name, log an error
        if (selectedBranch && !branchName) {
          console.error('Selected branch not found in filteredBranches', {
            selectedBranch,
            filteredBranches: filteredBranches.map(b => ({ id: b.id, name: b.name }))
          });
        }
      }

      console.log('=== FETCH ORDERS DEBUG ===');
      console.log('selectedRestaurant:', selectedRestaurant);
      console.log('selectedBranch:', selectedBranch);
      console.log('filteredBranches:', filteredBranches);
      console.log('branchName to send:', branchName);
      console.log('status:', status);

      const response = await orderApi.getOrders({
        status: status === 'ALL' ? undefined : status,
        branchName: branchName,
        restaurantId: selectedRestaurant === 'all' ? undefined : selectedRestaurant || undefined,
        page: 1,
        pageSize: 100,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });

      console.log('Orders API Response:', response);
      
      let ordersList: any[] = [];
      
      // Handle different response formats
      if (Array.isArray(response.data)) {
        ordersList = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        ordersList = response.data.data;
      } else if (response.data && response.data.data && Array.isArray(response.data.data.data)) {
        ordersList = response.data.data.data;
      }
      
      console.log('Parsed orders list:', ordersList);
      setOrders(ordersList);
      
      // If no orders found, log it
      if (ordersList.length === 0) {
        console.log('No orders found with current filters');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      // Set empty array on error to clear any previous orders
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };
  // Fetch orders when activeTab, selectedRestaurant, or selectedBranch changes
  useEffect(() => {
    const loadData = async () => {
      if (!restaurantsLoaded) return;
      
      console.log('Fetching orders with params:', {
        activeTab,
        selectedRestaurant,
        selectedBranch,
        hasBranches: filteredBranches.length > 0
      });
      
      setLoading(true);
      try {
        await fetchOrders(activeTab);
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      } finally {
        setLoading(false);
      }
    };
    
    const timer = setTimeout(() => {
      loadData();
    }, 0);
    
    return () => clearTimeout(timer);
  }, [activeTab, selectedRestaurant, selectedBranch, restaurantsLoaded]);

  // Fetch branches for selected restaurant
  const fetchBranchesForRestaurant = async (restaurantId: string) => {
    try {
      console.log('fetchBranchesForRestaurant called with:', restaurantId);
      if (restaurantId === 'all') {
        // When "All Restaurants" is selected, show no branches (empty state)
        console.log('Setting empty branches for "all"');
        setFilteredBranches([]);
      } else {
        // Load branches specific to the selected restaurant
        console.log('Fetching branches for restaurant:', restaurantId);
        try {
          const branchesResponse = await branchApi.getBranchesByRestaurant(restaurantId);
          console.log('Branch API response:', branchesResponse);
          const branchesData = branchesResponse.data.data || [];
          console.log('Received branches:', branchesData);
          setFilteredBranches(branchesData);
        } catch (apiError) {
          console.error('API Error fetching branches:', apiError);
          console.error('API Error response:', apiError.response?.data);
          setFilteredBranches([]);
        }
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
      setFilteredBranches([]);
    }
  };
  const fetchStats = async (restaurantId?: string, branchName?: string) => {
    console.log('fetchStats called with restaurantId:', restaurantId, 'branchName:', branchName);
    try {
      const response = await orderApi.getStats({
        branchName: branchName,
        restaurantId: restaurantId,
      });
      console.log('Stats API response:', response);
      const payload: any = response.data;
      // Support both shapes: { data: Stats } and { data: { data: Stats } }
      const statsData = payload?.data?.data ?? payload?.data ?? null;
      console.log('Stats data:', statsData);

      // If stats data exists, calculate processingOrders from ordersByStatus
      if (statsData && statsData.ordersByStatus) {
        let processingOrders = 0;
        if (Array.isArray(statsData.ordersByStatus)) {
          // Backend returns array format
          processingOrders = statsData.ordersByStatus.find((item: any) => item.status === OrderStatus.PROCESSING)?.count || 0;
        } else {
          // Fallback calculation returns object format
          processingOrders = statsData.ordersByStatus[OrderStatus.PROCESSING] || 0;
        }
        setStats({
          ...statsData,
          processingOrders
        });
        console.log('Stats set successfully:', { ...statsData, processingOrders });
      } else {
        setStats(statsData);
        console.log('Stats set (no ordersByStatus):', statsData);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);

      // Fallback to calculating from orders if stats endpoint fails
      try {
        const response = await orderApi.getOrders({
          page: 1,
          pageSize: 1000, // Get enough data for stats
          sortBy: 'createdAt',
          sortOrder: 'desc',
          restaurantId: restaurantId,
          branchName: branchName
        });

        // The response contains data and meta properties
        const opayload: any = response?.data;
        const allOrders = Array.isArray(opayload?.data)
          ? opayload.data
          : Array.isArray(opayload?.data?.data)
            ? opayload.data.data
            : [];

        // Apply additional filtering if specific restaurant/branch is selected
        const filteredOrders = allOrders.filter((order: Order) => {
          const restaurantMatch = !restaurantId || restaurantId === 'all' || order.restaurant?.id === restaurantId;
          const branchMatch = !branchName || branchName === 'all' || order.branchName === branchName;
          return restaurantMatch && branchMatch;
        });

        // Calculate stats - only include paid orders in revenue
        const totalOrders = filteredOrders.length;
        const totalRevenue = filteredOrders
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
        filteredOrders.forEach((order: Order) => {
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


        // Calculate completed and pending orders
        const completedOrders = filteredOrders.filter((order: Order) => order.status === OrderStatus.COMPLETED).length;
        const pendingOrders = filteredOrders.filter((order: Order) => order.status === OrderStatus.PENDING).length;
        const processingOrders = filteredOrders.filter((order: Order) => order.status === OrderStatus.PROCESSING).length;

        setStats({
          totalOrders: filteredOrders.length,
          totalRevenue,
          ordersByStatus,
          revenueByStatus,
          paymentStatus,
          recentOrders: filteredOrders.slice(0, 5), // Get first 5 as recent
          completedOrders,
          pendingOrders,
          processingOrders,
        });
        console.log('Stats calculated from orders:', {
          totalOrders: filteredOrders.length,
          totalRevenue,
          ordersByStatus,
          revenueByStatus,
          paymentStatus,
          recentOrders: filteredOrders.slice(0, 5),
          completedOrders,
          pendingOrders,
          processingOrders,
        });
      } catch (err) {
        console.error('Error calculating stats from orders:', err);
      }
    }
  };
  const updateOrderStatus = async (orderId: string, status: OrderStatus, notes?: string) => {
    try {
      await orderApi.updateStatus(orderId, status, notes);
      const branchName = selectedBranch === 'all' ? undefined : filteredBranches.find(branch => branch.id === selectedBranch)?.name || undefined;
      await Promise.all([fetchOrders(), fetchStats(selectedRestaurant === 'all' ? undefined : selectedRestaurant, branchName)]);
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error; // Re-throw to handle in the UI if needed
    }
  };
  // Initial data load on component mount
  useEffect(() => {
    const loadData = async () => {
      if (!restaurantsLoaded) return;
      
      setLoading(true);
      try {
        const branchName = selectedBranch === 'all' 
          ? undefined 
          : filteredBranches.find(branch => branch.id === selectedBranch)?.name || undefined;
            
        await Promise.all([
          fetchOrders(activeTab), 
          fetchStats(selectedRestaurant === 'all' ? undefined : selectedRestaurant, branchName)
        ]);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      loadData();
    }, 0);
    
    return () => clearTimeout(timer);
  }, [restaurantsLoaded]); // Only run when restaurants are loaded

  // Handle filter changes
  useEffect(() => {
    if (!restaurantsLoaded) return;
    
    const timer = setTimeout(() => {
      const branchName = selectedBranch === 'all' 
        ? undefined 
        : filteredBranches.find(branch => branch.id === selectedBranch)?.name || undefined;
      
      console.log('Filter changed - fetching data:', {
        selectedRestaurant,
        selectedBranch,
        branchName,
        activeTab
      });
      
      setLoading(true);
      Promise.all([
        fetchOrders(activeTab),
        fetchStats(
          selectedRestaurant === 'all' ? undefined : selectedRestaurant, 
          branchName
        )
      ]).finally(() => {
        setLoading(false);
      });
    }, 300); // Small debounce to prevent rapid updates
    
    return () => clearTimeout(timer);
  }, [selectedRestaurant, selectedBranch, activeTab, restaurantsLoaded]);

  const filteredOrders = activeTab === 'ALL'
    ? orders
    : orders.filter(order => order.status === activeTab);

  // Only show loading state if we're still loading the initial data
  if (loading && orders.length === 0) {
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
              const branchName = selectedBranch === 'all' ? undefined : filteredBranches.find(branch => branch.id === selectedBranch)?.name || undefined;
              fetchOrders();
              fetchStats(selectedRestaurant === 'all' ? undefined : selectedRestaurant, branchName);
            }} variant="outline">
              Refresh
            </Button>
          </PermissionGate>
        </div>

        {/* Filters */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Restaurant</label>
            <Select 
              value={selectedRestaurant} 
              onValueChange={setSelectedRestaurant} 
              disabled={!restaurantsLoaded || isManager}
            >
              <SelectTrigger>
                <SelectValue placeholder={restaurantsLoaded ? (isManager ? user?.restaurant?.name || "Loading..." : "All Restaurants") : "Loading restaurants..."} />
              </SelectTrigger>
              <SelectContent>
                {!isManager && <SelectItem value="all">All Restaurants</SelectItem>}
                {restaurants.map((restaurant) => (
                  <SelectItem key={restaurant.id} value={restaurant.id}>
                    {restaurant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Branch</label>
            <Select
              value={selectedBranch}
              onValueChange={setSelectedBranch}
              disabled={!restaurantsLoaded || isManager || selectedRestaurant === 'all' || filteredBranches.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={
                  isManager 
                    ? (user?.branch?.name || "No branch assigned") 
                    : !restaurantsLoaded
                      ? "Loading..."
                      : selectedRestaurant === 'all'
                        ? "Select a restaurant first"
                        : filteredBranches.length === 0
                          ? "No branches available"
                          : "All Branches"
                } />
              </SelectTrigger>
              <SelectContent>
                {filteredBranches.length > 0 && !isManager && (
                  <SelectItem value="all">All Branches</SelectItem>
                )}
                {filteredBranches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <Select value={activeTab} onValueChange={(value) => setActiveTab(value as OrderStatus | 'ALL')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                {Object.values(OrderStatus).map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (() => {
          console.log('Rendering stats cards with stats:', stats);
          return (
            <div className={`grid gap-4 mb-6 ${isKitchenStaff ? 'grid-cols-1 md:grid-cols-4' : 'grid-cols-1 md:grid-cols-5'}`}>
              <StatsCard
                title="Total Orders"
                value={String(stats.totalOrders ?? 0)}
                description="All time orders"
              />
              {!isKitchenStaff && (
                <StatsCard
                  title="Total Revenue"
                  value={`£${(stats.totalRevenue ?? 0)}`}
                  description="Total revenue from all orders"
                />
              )}
              <StatsCard
                title="Processing Orders"
                value={String(stats.processingOrders)}
                description="Orders currently being processed"
              />
              <StatsCard
                title="Pending Orders"
                value={String(stats.pendingOrders)}
                description="Orders awaiting processing"
              />
              <StatsCard
                title="Completed Orders"
                value={String(stats.completedOrders)}
                description="Successfully completed orders"
              />
            </div>
          );
        })()}

        <Tabs value={activeTab === "ALL" ? "all" : activeTab.toLowerCase()} className="space-y-4">
          <div className="relative">
            {/* left/right fade gradients */}
            <div className="hidden sm:block absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
            <div className="hidden sm:block absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

            <TabsList className="w-full overflow-x-auto pb-2 scrollbar-hide sm:overflow-visible">
              <div className="flex space-x-1 sm:space-x-2 px-1">
                {/* All Orders */}
                <TabsTrigger
                  value="all"
                  onClick={() => setActiveTab("ALL")}
                  className="whitespace-nowrap px-2 sm:px-3 py-1.5 text-xs sm:text-sm"
                >
                  All Orders
                </TabsTrigger>

                {/* Dynamic statuses */}
                {Object.entries(OrderStatus || {}).map(([key, value]) => (
                  <TabsTrigger
                    key={key}
                    value={key.toLowerCase()}
                    onClick={() => setActiveTab(value as OrderStatus)}
                    className="whitespace-nowrap px-2 sm:px-3 py-1.5 text-xs sm:text-sm"
                  >
                    {value.replace(/_/g, " ")}
                  </TabsTrigger>
                ))}

              </div>
            </TabsList>
          </div>

          {/* Tab Content */}
          <TabsContent value={activeTab === "ALL" ? "all" : activeTab.toLowerCase()} className="space-y-4 mt-2">
            <OrderList
              orders={filteredOrders}
              onStatusUpdate={updateOrderStatus}
              onPaymentStatusUpdate={async (orderId, paymentStatus, paymentMethod) => {
                try {
                  setLoading(true);
                  await orderApi.updatePaymentStatus(orderId, paymentStatus, paymentMethod);
                  const branchName = selectedBranch === 'all' ? undefined : filteredBranches.find(branch => branch.id === selectedBranch)?.name || undefined;
                  
                  // Refresh both orders and stats when payment status or method changes
                  await Promise.all([
                    fetchOrders(activeTab), 
                    fetchStats(selectedRestaurant === 'all' ? undefined : selectedRestaurant, branchName)
                  ]);
                  
                  // If payment status is updated to PAID, set the order to print
                  if (paymentStatus === 'PAID') {
                    const order = orders.find(o => o.id === orderId);
                    if (order) {
                      // Use setTimeout to ensure the state updates before printing
                      setTimeout(() => {
                        setOrderToPrint({ ...order, paymentStatus, paymentMethod });
                      }, 0);
                    }
                  }
                } catch (error) {
                  console.error("Error updating payment status:", error);
                } finally {
                  setLoading(false);
                }
                }}
                onEditOrder={handleEditOrder}
              />
            ) : (
// ...
              <div className="text-center py-12 border rounded-lg">
                <p className="text-muted-foreground">No orders found</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setActiveTab("ALL")}
                >
                  View All Orders
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Order Print View - Using a portal to avoid layout issues */}
      {typeof window !== 'undefined' && orderToPrint && (
        <OrderPrintView 
          order={orderToPrint} 
          onAfterPrint={handleAfterPrint}
          key={`print-${orderToPrint.id}-${Date.now()}`}
        />
      )}
    </WithPermission>
  );
}

function StatsCard({ title, value, description }: { title: string; value: string; description: string }) {
  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    </>
  );
}

interface OrderListProps {
  orders: Order[];
  onStatusUpdate: (orderId: string, status: OrderStatus) => void;
  onPaymentStatusUpdate: (orderId: string, paymentStatus: TPaymentStatus, paymentMethod: PaymentMethod) => Promise<void>;
  onEditOrder: (order: Order) => void;
}

function OrderList({ orders, onStatusUpdate, onPaymentStatusUpdate, onEditOrder }: OrderListProps) {
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { hasRole } = usePermissions();
  const isKitchenStaff = hasRole('KITCHEN_STAFF');

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
                    {!isKitchenStaff && (
                      <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:space-x-2">
                        <PermissionGate required="ORDER_UPDATE" disableInsteadOfHide>
                          <div className="relative w-full sm:w-auto">
                            <select
                              value={order.paymentStatus}
                              onChange={(e) => onPaymentStatusUpdate(order.id, e.target.value as TPaymentStatus, order.paymentMethod)}
                              className={`w-full px-2 py-1 text-xs font-medium rounded-full ${order.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' :
                                order.paymentStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                } border-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 appearance-none pr-6`}
                            >
                              {Object.values(PaymentStatus).map((status) => (
                                <option key={status} value={status} className="bg-white text-gray-900">
                                  {status}
                                </option>
                              ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1 text-gray-700">
                              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                              </svg>
                            </div>
                          </div>
                        </PermissionGate>
                        <PermissionGate required="ORDER_UPDATE" disableInsteadOfHide>
                          <div className="relative w-full sm:w-auto">
                            <select
                              value={order.paymentMethod}
                              onChange={(e) => onPaymentStatusUpdate(order.id, order.paymentStatus, e.target.value as PaymentMethod)}
                              className="w-full px-2 py-1 text-xs border rounded-md bg-white text-gray-900 appearance-none pr-6"
                            >
                              {Object.values(PaymentMethod).map((method) => (
                                <option key={method} value={method}>
                                  {method.replace('_', ' ')}
                                </option>
                              ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1 text-gray-700">
                              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                              </svg>
                            </div>
                          </div>
                        </PermissionGate>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-3 border-t mt-2 gap-2">
                  <span className="text-sm font-medium">Update Status</span>
                  <PermissionGate required="ORDER_UPDATE" disableInsteadOfHide>
                    <div className="relative w-full max-w-[200px] sm:w-40">
                      <select
                        disabled={updatingOrderId === order.id}

                        style={{
                          WebkitAppearance: 'none' as const,
                          MozAppearance: 'none' as const,
                          textOverflow: 'ellipsis',
                        }}
                        value={order.status}
                        onChange={(e) => handleStatusUpdate(order.id, e.target.value as OrderStatus)}
                        title={order.status.charAt(0) + order.status.slice(1).toLowerCase().replace('_', ' ')}
                      >
                        {updatingOrderId === order.id ? (
                          <option value="updating-status">Updating...</option>
                        ) : (
                          Object.values(OrderStatus)
                            .filter(status => status !== order.status)
                            .map((status) => (
                              <option
                                key={status}
                                value={status}
                                className="bg-white text-gray-900 truncate"
                                title={status.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')}
                              >
                                {status.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')}
                              </option>
                            ))
                        )}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                        </svg>
                      </div>
                    </div>
                  </PermissionGate>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEditOrder(order)}
                    disabled={order.status === 'COMPLETED' || order.status === 'CANCELLED'}
                  >
                    Edit
                  </Button>
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
