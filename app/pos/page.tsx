'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import orderApi from '@/lib/order-api';
import { usePermissions } from '@/hooks/use-permissions';
import { useOrderNotifications } from '@/hooks/userOrderNotification';
import { POSLayout } from "@/components/pos/pos-layout"
import { EditOrderProvider } from "@/components/pos/edit-order-context"

export default function POSPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasRole, isLoading } = usePermissions();
  useOrderNotifications();
  const [isLoadingOrder, setIsLoadingOrder] = useState(false);
  const [orderData, setOrderData] = useState(null);

  const isAuthorized = hasRole('ADMIN') || hasRole('MANAGER');
  const editOrderId = searchParams.get('editOrderId');
  
  useEffect(() => {
    if (!isLoading && !isAuthorized) {
      // Redirect to unauthorized or dashboard if not authorized
      router.push('/dashboard?error=unauthorized');
    }
  }, [isAuthorized, isLoading, router]);

  // Fetch order data when in edit mode
  useEffect(() => {
    if (editOrderId && isAuthorized && !isLoading) {
      const fetchOrder = async () => {
        try {
          setIsLoadingOrder(true);
          const response = await orderApi.getOrder(editOrderId);
          console.log('Order data received:', response.data);
          setOrderData(response.data);
        } catch (error) {
          console.error('Error fetching order:', error);
        } finally {
          setIsLoadingOrder(false); 
        }
      };
      if(editOrderId){
        fetchOrder();
      }
    }
  }, [editOrderId, isAuthorized, isLoading]);

  // Show loading state while checking permissions or loading order
  if (isLoading || !isAuthorized || (editOrderId && isLoadingOrder)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      
      <POSLayout editOrderData={orderData} key={editOrderId} />
    </div>
  );
}
