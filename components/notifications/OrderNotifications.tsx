'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSocket } from '@/contexts/SocketContext';
import type { OrderStatus } from '@/types/order';

interface Order {
  id: string;
  orderNumber: string;
  branchId: string;
  status: OrderStatus;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    notes?: string;
  }>;
  createdAt: string;
  updatedAt: string;
  // Add other order properties as needed
}

const playNotificationSound = () => {
  if (typeof Audio !== 'undefined') {
    const audio = new Audio('/sounds/notification.mp3');
    audio.volume = 0.3;
    audio.play().catch(() => {});
  }
};

export function OrderNotifications() {
  const router = useRouter();
  const { socket, isConnected, onNewOrder, onOrderUpdate } = useSocket();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const muted = localStorage.getItem('notificationsMuted') === 'true';
    setIsMuted(muted);
  }, []);

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    localStorage.setItem('notificationsMuted', String(newMuted));
  };

  useEffect(() => {
    if (!isConnected) return;

    const cleanupNew = onNewOrder(({ order }) => {
      if (!isMuted) playNotificationSound();
      setUnreadCount(c => c + 1);

      toast(
        <div
          className="flex flex-col gap-2 p-2 cursor-pointer"
          onClick={() => {
            router.push(`/orders/${order.id}`);
            setUnreadCount(0);
          }}
        >
          <div className="font-semibold">New Order #{order.orderNumber}</div>
          <div className="text-sm text-muted-foreground">A new order has been created</div>
        </div>,
        { duration: 10000, position: 'top-right', action: { label: <X size={14} />, onClick: () => {} } }
      );
    });

    const cleanupUpdate = onOrderUpdate(({ order, updatedByRole }) => {
      if (!isMuted) playNotificationSound();

      const statusMessages: Record<OrderStatus, string> = {
        PENDING: 'is pending',
        PREPARING: 'is being prepared',
        READY: 'is ready',
        COMPLETED: 'has been completed',
        CANCELLED: 'has been cancelled',
      };

      toast(
        <div
          className="flex flex-col gap-2 p-2 cursor-pointer"
          onClick={() => {
            router.push(`/orders/${order.id}`);
            setUnreadCount(0);
          }}
        >
          <div className="font-semibold">
            Order #{order.orderNumber} {statusMessages[order.status]}
          </div>
          <div className="text-sm text-muted-foreground">Updated by: {updatedByRole}</div>
        </div>,
        { duration: 10000, position: 'top-right', action: { label: <X size={14} />, onClick: () => {} } }
      );
    });

    return () => {
      cleanupNew();
      cleanupUpdate();
    };
  }, [isConnected, isMuted, onNewOrder, onOrderUpdate, router]);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="relative">
        <Button
          variant="outline"
          size="icon"
          className="relative rounded-full h-12 w-12 shadow-lg"
          onClick={toggleMute}
          title={isMuted ? 'Unmute notifications' : 'Mute notifications'}
        >
          <Bell className={cn('h-5 w-5 transition-colors', isMuted ? 'text-muted-foreground' : 'text-foreground')} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}