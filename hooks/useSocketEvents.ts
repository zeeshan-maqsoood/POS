'use client';

import { useEffect } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import type { Order } from '@/types/order';
import type { UserRole } from '@/contexts/SocketContext';

export type OrderNotification = { order: Order; createdByRole: string };
export type OrderUpdateNotification = { order: Order; updatedByRole: string };

interface UseSocketEventsProps {
  onNewOrder?: (data: OrderNotification) => void;
  onOrderUpdate?: (data: OrderUpdateNotification) => void;
  branchId?: string;
  userRole?: UserRole;
}

export const useSocketEvents = ({
  onNewOrder,
  onOrderUpdate,
  branchId,
  userRole,
}: UseSocketEventsProps = {}) => {
  const { isConnected, joinBranch, onNewOrder: subNewOrder, onOrderUpdate: subOrderUpdate } = useSocket();

  useEffect(() => {
    if (branchId && userRole && isConnected) {
      joinBranch(branchId, userRole);
    }
  }, [branchId, userRole, isConnected, joinBranch]);

  useEffect(() => {
    if (!onNewOrder) return;
    return subNewOrder(onNewOrder);
  }, [onNewOrder, subNewOrder]);

  useEffect(() => {
    if (!onOrderUpdate) return;
    return subOrderUpdate(onOrderUpdate);
  }, [onOrderUpdate, subOrderUpdate]);

  return { isConnected };
};