// components/order/order-notifications.tsx
'use client';

import { useEffect } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { Order } from '@/types/order';
import { toast } from '@/components/ui/use-toast';

interface OrderNotificationsProps {
  onNewOrder?: (order: Order) => void;
  onOrderUpdate?: (order: Order) => void;
}

export function OrderNotifications({ 
  onNewOrder, 
  onOrderUpdate 
}: OrderNotificationsProps) {
  const { onNewOrder: handleNewOrder, onOrderUpdate: handleOrderUpdate } = useSocket();

  // Handle new orders
  useEffect(() => {
    if (!onNewOrder) return;
    
    const cleanup = handleNewOrder((order) => {
      onNewOrder(order);
    });

    return () => {
      if (cleanup) cleanup();
    };
  }, [handleNewOrder, onNewOrder]);

  // Handle order updates
  useEffect(() => {
    if (!onOrderUpdate) return;
    
    const cleanup = handleOrderUpdate((order) => {
      onOrderUpdate(order);
    });

    return () => {
      if (cleanup) cleanup();
    };
  }, [handleOrderUpdate, onOrderUpdate]);

  return null; // This is a utility component that doesn't render anything
}
